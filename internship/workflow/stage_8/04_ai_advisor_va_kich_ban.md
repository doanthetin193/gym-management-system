# AI Advisor và kịch bản vận hành

## 1. Mục đích đúng của phần AI

AI Advisor không phải chatbot, không đọc hồ sơ từng khách và không tự tạo thao tác vận hành. Chủ phòng dùng trang Báo cáo để xem dữ liệu phòng gym đã được backend tổng hợp trước, sau đó chủ động yêu cầu Groq diễn giải các nhóm rủi ro/cơ hội. Khi Groq không trả lời được, backend trả kết quả fallback theo rule để trang Báo cáo vẫn có ích.

Kịch bản doanh thu và giữ chân là lớp bổ sung đơn giản trên cùng luồng đó. Chủ phòng chọn ba tỷ lệ giả định cho tuần tới, ví dụ thu 50% công nợ, khôi phục 40% giá trị nhóm PT rủi ro và gia hạn/quay lại 30% nhóm còn lại. Backend nhân các tỷ lệ với giá trị nền đã tính; Groq chỉ giúp giải thích thứ tự ưu tiên và điều cần thận trọng. Không có dự báo xác suất churn, không có mô hình machine learning được huấn luyện và không có lời hứa số tiền sẽ thu được.

## 2. Đường đi của request

```text
ReportsPage
  -> aiAdvisorApi.analyzeRetentionRevenue
  -> POST /v1/ai/retention-revenue-advisor
  -> AiAdvisorController
  -> RetentionRevenueAdvisorService
  -> RetentionRevenueScenarioCalculator (nếu có scenario)
  -> GroqAiClient hoặc fallback
  -> RetentionRevenueAdvisorResponse
  -> ReportsPage hiển thị số liệu và diễn giải
```

`AiAdvisorController` chỉ cho OWNER gọi endpoint. `RetentionRevenueAdvisorRequest` có `year`, `month` tùy chọn và `scenario` tùy chọn. Khi object `scenario` xuất hiện, ba field phần trăm là bắt buộc, là số nguyên và nằm trong `0..100`. Đây là validation backend; việc input frontend giới hạn số chỉ là lớp hỗ trợ giao diện.

## 3. Dữ liệu được đọc và dữ liệu không được gửi

`RetentionRevenueAdvisorService.buildPayload` đọc hội viên ACTIVE, lượt đăng ký không CANCELLED, payment theo kỳ, công nợ OPEN/PARTIALLY_PAID, gói buổi PT và log vận động. Mã nhóm dữ liệu theo ID nội bộ trong bộ nhớ để tính; ID đó không nằm trong payload gửi Groq.

Payload gửi provider gồm kỳ, tổng hội viên, doanh thu, công nợ, số khách mới/gia hạn, source mix, doanh thu theo loại gói, segment rủi ro/cơ hội và object kịch bản nếu người dùng yêu cầu. Nó không có tên, số điện thoại, email, Zalo, địa chỉ, mật khẩu, token, danh sách hội viên hay từng giao dịch. Việc chỉ gửi aggregate giảm phạm vi chia sẻ dữ liệu nhưng không thay thế đánh giá pháp lý/bảo mật khi triển khai production.

## 4. Cách tính kịch bản

`RetentionRevenueScenarioCalculator` là lớp package-private, không có repository và không ghi database. Nó nhận ba giá trị nền kiểu `long` cùng ba tỷ lệ đã validation, tính bằng `BigDecimal`, dịch dấu thập phân hai chữ số và làm tròn `HALF_UP` về đồng.

| Nền | Nguồn trong service | Giá trị ước tính |
| --- | --- | --- |
| Công nợ có thể thu | Tổng remaining amount dương của debt OPEN/PARTIALLY_PAID | Nền x `debtCollectionPercent` / 100 |
| PT có thể khôi phục | Giá trị gói của từng hội viên PT thuộc rủi ro còn nhiều buổi gần hết hạn hoặc gián đoạn dài | Nền x `ptRecoveryPercent` / 100 |
| Gia hạn/quay lại | Giá trị cơ hội gia hạn còn lại sau khi bỏ hội viên đã nằm ở nền PT rủi ro | Nền x `renewalConversionPercent` / 100 |

Một hội viên PT có thể thỏa nhiều rule PT nhưng chỉ góp một giá trị theo ID vào nền PT. Sau đó ID của toàn bộ nền PT được loại khỏi nền gia hạn/quay lại. Nhờ vậy hai nhánh giữ chân trong tổng kịch bản không cộng cùng một hội viên hai lần. Công nợ được trình bày tách như tác động dòng tiền; vì người có công nợ cũng có thể nằm trong nhóm giữ chân, tổng cuối cùng là chỉ số hỗ trợ ưu tiên, không phải doanh thu chắc chắn hoặc một phép dự báo tài chính đầy đủ.

Response trả lại nền tính và số đã nhân dưới `scenario`, trong đó `estimatedTotalImpact` bằng tổng ba giá trị ước tính. Đây là con số frontend phải dùng để vẽ/hiển thị; không lấy số trong câu chữ của mô hình làm số liệu.

## 5. Vai trò của Groq và fallback

Khi không có `scenario`, system prompt yêu cầu schema insight tổng quan. Khi có, prompt nối thêm schema `insight.scenario` gồm `overview`, tối đa ba `priorityActions` và tối đa hai `cautions`. Prompt yêu cầu mô hình không tự tính lại hoặc bảo đảm các giá trị backend đã tính.

`normalizeScenarioInsight` làm sạch nội dung AI. Nếu mô hình không trả phần kịch bản hoặc trả list rỗng, service dùng `fallbackScenarioInsight` để tạo nhận xét dựa trên ba giá trị ước tính và sắp thứ tự giảm dần. Nếu toàn bộ lời gọi provider ném lỗi, `fallbackInsight` vẫn trả insight tổng quan lẫn insight kịch bản, với `aiGenerated=false` và thông báo provider phù hợp.

## 6. Điều không xảy ra khi bấm phân tích

Kịch bản không tạo `Payment`, `DebtRecord`, `MemberMembership`, `PtSessionLog`, lịch PT hay notification. Nó không sửa trạng thái hội viên, không gửi Zalo, không cấp ưu đãi và không lưu tỷ lệ vừa nhập. Tất cả số liệu được tính trong response của request hiện tại; tải lại trang hoặc chọn kỳ khác không phải là khôi phục lịch sử kịch bản.

Đây là chủ đích để giữ scope gọn: trước khi phòng gym có chính sách chính thức, không nên biến giả định vận hành thành dữ liệu kế toán hoặc workflow tự động.

## 7. Cách tự kiểm tra

1. Đăng nhập OWNER, mở `/reports` và bấm phân tích tổng quan. Xác nhận phần kịch bản chưa có giá trị kết quả.
2. Nhập ba tỷ lệ hợp lệ rồi bấm `Phân tích kịch bản`. Đối chiếu mỗi giá trị với nền ngay dưới nó và kiểm tra tổng là tổng ba nhánh.
3. Gửi trực tiếp payload với tỷ lệ `101` hoặc thiếu một field từ công cụ API; xác nhận `400`.
4. Chụp số lượng payment, debt, membership và session log trước/sau request trong database test; chúng phải không đổi.
5. Tắt key Groq trong môi trường test hoặc dùng mock provider lỗi; xác nhận `aiGenerated=false` nhưng vẫn có lời khuyên fallback và giá trị kịch bản.

Khi trình bày với mentor, nên nói rõ rule và calculator tạo số liệu có kiểm soát, AI làm phần diễn giải chiến lược. Cách tách này giảm chi phí, tránh giao AI quyền thay đổi nghiệp vụ và vẫn cho thấy ứng dụng AI được dùng đúng mức cho bài toán vận hành.
