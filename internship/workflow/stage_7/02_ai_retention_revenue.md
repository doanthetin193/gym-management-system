# AI Retention & Revenue Advisor: dữ liệu, quy tắc và Groq

## 1. Bài toán và vị trí AI

Chức năng giúp OWNER xem nhóm cần chăm sóc và gợi ý vận hành. Nó không phải mô hình machine learning được huấn luyện riêng để tiên đoán chính xác ai sẽ bỏ phòng gym. Code tự tính nhóm rủi ro bằng quy tắc từ dữ liệu hệ thống, sau đó gọi Groq để diễn giải/đề xuất; nếu gọi AI lỗi, hệ thống có nội dung dự phòng rule-based.

Luồng: [`ReportsPage`](../../../frontend/src/features/reports/pages/ReportsPage.tsx) → [`aiAdvisorApi`](../../../frontend/src/features/reports/api/aiAdvisorApi.ts) → [`AiAdvisorController`](../../../backend/src/main/java/com/gymduongdouble/backend/ai/web/AiAdvisorController.java) → [`RetentionRevenueAdvisorService`](../../../backend/src/main/java/com/gymduongdouble/backend/ai/service/RetentionRevenueAdvisorService.java) → [`RetentionRevenueScenarioCalculator`](../../../backend/src/main/java/com/gymduongdouble/backend/ai/service/RetentionRevenueScenarioCalculator.java) khi có kịch bản → [`GroqAiClient`](../../../backend/src/main/java/com/gymduongdouble/backend/ai/client/GroqAiClient.java). Endpoint `POST /api/v1/ai/retention-revenue-advisor` yêu cầu OWNER và được sensitive rate limit nhận diện.

## 2. Dữ liệu được tổng hợp trước khi gửi

`buildPayload` lấy member ACTIVE, membership không CANCELLED, payments theo kỳ và kỳ trước, debt OPEN/PARTIALLY_PAID có số dư, các gói PT và activity. Trong vòng lặp, code dùng ID nội bộ để nhóm/loại trùng trong bộ nhớ. `AdvisorPayload` gửi ra gồm period, summary, riskSegments, opportunitySegments, sourceMix, revenueByPlanType và `scenario` khi OWNER yêu cầu; nó không chứa tên, số điện thoại, email hay từng giao dịch cá nhân theo cấu trúc hiện tại.

Không nên gọi đây là bảo mật tuyệt đối: số lượng rất nhỏ hoặc kết hợp dữ liệu tổng hợp vẫn có thể tạo rủi ro suy luận. Dữ liệu được gửi tới nhà cung cấp bên ngoài, cần cân nhắc cấu hình, quyền sử dụng và chính sách khi triển khai thật. Không đưa key hay payload có dữ liệu nhạy cảm vào tài liệu/test chia sẻ.

## 3. Ví dụ các rule nội bộ

Mở `buildPayload` và `analyzePtRisk`:

- Gói đang hiệu lực và còn ≤ 7 ngày: đánh dấu nhóm sắp hết hạn và medium risk; phát sinh nhóm cơ hội gia hạn.
- Hội viên có đúng một lượt đăng ký chưa hủy và gói đang hiệu lực còn ≤ 14 ngày: thêm phân đoạn `FIRST_PACKAGE_NEAR_EXPIRY`. Nhánh thêm segment này không tự thêm ID vào tập high/medium risk.
- Gói PT hiệu lực còn ≤ 14 ngày và số buổi PT còn lại ít nhất `ceil(total * 0.35)`: `unusedNearExpiry`, high risk.
- Ngày hoạt động gần nhất không có hoặc trước mốc hôm nay trừ 21 ngày: `longInactive` khi có gói PT hiệu lực phù hợp. `latestActivityByMember()` gộp buổi PT `COMPLETED` và activity `PRACTICE` hoặc `GUIDANCE_CHECKIN`; không chỉ dựa vào lịch hẹn PT.
- Gói được chọn đã hết hạn hơn 7 ngày: high risk; hết hạn gần hơn: medium risk. Sau vòng lặp, code loại high-risk IDs khỏi tập medium để tránh tính một người ở cả hai tổng này.

Một member có thể có mặt trong nhiều segment. Không cộng bừa toàn bộ số lượng segment để suy ra số người duy nhất. `renewalOpportunityByMember` dùng member ID và giữ giá trị lớn nhất theo member; `openDebtAmount` được tổng hợp riêng. Giá trị liên quan chỉ là chỉ báo theo quy tắc, không phải dự báo chắc chắn tiền sẽ mất hoặc doanh thu thực thu.

Giá trị gói dùng cho nhiều segment được lấy từ `membership.getActualPrice()`, không tự trừ `discountAmount` trong dòng tính giá trị đó. Số lượng `activeDebts` và `openDebtAmount` được lấy từ danh sách nợ mở có số dư dương; còn vòng lặp đánh giá segment hội viên dùng danh sách member `ACTIVE`. Hai tập nguồn này không nên mặc định có cùng phạm vi. Nếu cần giải thích một con số trên UI, lần từ DTO tới công thức tương ứng thay vì coi đó là doanh thu thực thu.

## 3.1. Kịch bản doanh thu và giữ chân: calculator trước, AI sau

Sau khi trang Báo cáo đã có phân tích tổng quan, OWNER có thể gửi thêm object `scenario` với đủ ba tỷ lệ nguyên `0..100`:

```json
{
  "debtCollectionPercent": 50,
  "ptRecoveryPercent": 40,
  "renewalConversionPercent": 30
}
```

`RetentionRevenueScenarioCalculator` là class tính thuần, không có repository và không ghi database. Nó nhân từng nền tiền với tỷ lệ tương ứng bằng `BigDecimal`, dịch hai chữ số thập phân, rồi làm tròn `HALF_UP` về đồng. Ba nền được service chuẩn bị như sau:

1. `debtCollectionPotential`: tổng số dư dương của debt OPEN/PARTIALLY_PAID.
2. `ptRecoveryPotential`: giá trị gói theo từng hội viên PT thỏa `unusedNearExpiry` hoặc `longInactive`.
3. `renewalOpportunityPotential`: phần cơ hội gia hạn/quay lại còn lại sau khi loại ID hội viên đã nằm ở nền PT rủi ro.

Map PT dùng ID hội viên làm key, nên một khách PT thỏa hai rule chỉ góp một lần vào nền PT. Loại ID PT khỏi nền gia hạn/quay lại tránh cộng lặp giữa hai nhánh giữ chân. Công nợ được coi là nhánh dòng tiền riêng; một người vừa còn nợ vừa có cơ hội gia hạn vẫn có thể xuất hiện trong hai loại hành động khác nhau. Vì vậy `estimatedTotalImpact` là chỉ số ưu tiên theo giả định, không phải doanh thu thực thu, dự báo bảo đảm hay lợi nhuận.

Khi không gửi `scenario`, response có `scenario: null` và luồng AI Advisor tổng quan không đổi. Khi có, response mang ba nền, ba giá trị ước tính và tổng; UI phải hiển thị các number đó thay vì rút số tiền từ câu văn AI. `insight.scenario` chỉ chứa nhận xét, tối đa ba hành động ưu tiên và tối đa hai lưu ý.

## 4. Ngày kỳ báo cáo và ngày đánh giá

Service dùng `YearMonth` request cho current/previous payments và đếm đăng ký trong kỳ, nhưng trạng thái active, near-expiry, expired và PT risk được xét với `AppClock.today()`. Khi chọn tháng quá khứ, đây không phải báo cáo snapshot đầy đủ ở thời điểm quá khứ. Số khách mới/gia hạn được lấy từ `MembershipPeriodStatistics`, chung với Dashboard: bỏ lượt CANCELLED, lấy lượt đầu/lượt sau trong lịch sử của từng hội viên và đếm theo ID hội viên phân biệt. Không tùy ý thay hai nhãn này bằng “tỷ lệ churn”; một hội viên có lần đầu và lượt sau cùng tháng có thể xuất hiện ở cả hai nhãn.

## 5. Gọi Groq và thử key tiếp theo

[`GroqAiProperties`](../../../backend/src/main/java/com/gymduongdouble/backend/ai/config/GroqAiProperties.java) tách danh sách key bằng dấu phẩy, trim, loại trùng. `requestJson` thử các key theo thứ tự trong mỗi lần gọi; nếu provider trả 401, 403 hoặc 429 thì thử key tiếp. Đây là **failover tuần tự**, không phải thuật toán round-robin chia đều mỗi request. Các lỗi HTTP khác không đi qua nhánh retry key đó. `timeoutSeconds`, model và endpoint lấy từ cấu hình; không ghi key thật.

Client gửi system/user messages, yêu cầu JSON object, temperature 0.2; trích content từ `choices[0].message.content`, bỏ code fence nếu có, rồi parse. Khi payload có kịch bản, prompt yêu cầu model chỉ diễn giải các giá trị backend đã tính, không tự tính lại hoặc bảo đảm kết quả. `analyze` bắt `RuntimeException` trong lúc gọi/chuẩn hóa AI và trả `aiGenerated=false` kèm fallback dựa trên payload; trường hợp thành công trả `aiGenerated=true`. Fallback có cả `insight.scenario` bằng cách sắp thứ tự ba nhánh theo giá trị ước tính. Vì vậy giao diện có kết quả không đồng nghĩa Groq thực sự đã sinh kết quả: cần kiểm tra cờ và provider message.

## 6. Kiểm tra và giới hạn

1. Bấm phân tích với dữ liệu demo và so summary/segment với rule bằng tay; xác minh kỳ và ngày hiện tại.
2. Tắt cấu hình key trong môi trường test an toàn: kiểm tra fallback và `aiGenerated`, không để key thật trong ảnh/log.
3. Kiểm tra số khách trong các segment chồng nhau; không cộng dồn như những nhóm loại trừ nhau.
4. Thử tình huống provider lỗi 401/403/429 qua môi trường mock nếu có; phân biệt failover theo thứ tự với round-robin.
5. Gửi request không có `scenario`, request có đủ ba tỷ lệ và request vượt `100`; lần lượt kiểm tra `scenario: null`, response hợp lệ và `400` validation.
6. Trước/sau request kịch bản trên database test, đối chiếu payment, debt, membership, PT session và schedule không phát sinh thay đổi.
7. Khuyến nghị AI cần người dùng cân nhắc, không chứng minh nguyên nhân rời bỏ hay bảo đảm doanh thu; không dùng như tư vấn y tế.

## 7. Gọi Groq: thứ tự key và điều kiện thử tiếp

Trích `GroqAiClient.requestJson`, bỏ phần tạo prompt:

```java
RuntimeException lastError = null;
for (String key : keys) {
    try {
        return requestWithKey(key, systemPrompt, userPrompt, responseType);
    } catch (RetryableGroqException error) {
        lastError = error;
    }
}

if (lastError != null) {
    throw lastError;
}
```

Mỗi request duyệt từ đầu danh sách cấu hình, thành công thì trả ngay; chỉ exception được phân loại retryable mới chuyển key. Trong `requestWithKey`, HTTP 401/403/429 được chuyển thành `RetryableGroqException`; không mặc định mọi lỗi mạng, 404 hay JSON sai đều thử key kế tiếp. Đây là **failover tuần tự**, không phải round-robin phân chia tải. Không đưa key thật vào code minh họa, log hay ảnh.

Body có `model`, `temperature`, `response_format` và messages; code đọc `choices[0].message.content`, trích JSON rồi deserialize sang response type. `extractJson` có xử lý code fence nhưng không thể bảo đảm model luôn sinh nội dung chính xác. Service có nhánh fallback: kiểm tra `aiGenerated` và nội dung thực tế để biết đó là phản hồi AI hay kết quả dự phòng, không quảng bá mọi phản hồi đều do Groq sinh.

## 8. Rule, tổng hợp và AI: ba bước khác nhau

1. Backend đọc dữ liệu nghiệp vụ và tính các nhóm theo điều kiện lập trình: ví dụ gần hết hạn, buổi PT còn dư, lịch bị gián đoạn. Hãy xem ngưỡng thực tế trong service trước khi nói đó là dự đoán học máy.
2. Backend gửi payload tổng hợp, không đưa các field tên/SĐT/email/giao dịch cá nhân vào payload được thiết kế. Ẩn thông tin định danh trực tiếp không đồng nghĩa loại bỏ hoàn toàn khả năng suy luận khi nhóm có ít người; không hứa bảo mật tuyệt đối.
3. Groq tạo diễn giải/đề xuất; người quản lý đánh giá trước khi làm. Các con số cơ hội hay rủi ro là ước tính theo rule, không phải tiền chắc chắn sẽ mất hoặc nhận được. Các nhóm có thể chồng nhau, không tùy tiện cộng tổng từng dòng làm tổng độc lập.

Kịch bản review: với dữ liệu test nhỏ, đối chiếu số thành viên thực tế và từng segment, sau đó kiểm tra payload mock không có PII, thử provider trả lỗi và JSON sai. Nêu rõ kỳ doanh thu có thể theo tháng được chọn còn rủi ro theo ngày hiện tại; đừng gọi đó là snapshot lịch sử nếu code không lưu snapshot.
