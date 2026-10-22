# Kiểm thử backend và quy trình đối chiếu

## 1. Các mức kiểm thử khác nhau

Unit test cô lập một hàm/lớp để kiểm tra điều kiện. Integration test chạy qua nhiều thành phần, có thể gồm Spring và database. Kiểm thử API end-to-end gửi request và đối chiếu response/trạng thái dữ liệu. Manual UI test mô phỏng người vận hành trên trình duyệt. Một mức kiểm thử không tự thay thế những mức còn lại.

[`BackendApplicationTests`](../../../backend/src/test/java/com/gymduongdouble/backend/BackendApplicationTests.java) hiện có các test về Groq key, che password khi chuyển request thành string, validation payment, assignment date, lifecycle membership, quy tắc khách mới/gia hạn, số đo, phone normalizer, JWT version, password policy, rate limiter, metadata cắt trang `PageResponse` và contract loại bỏ field lương/tỷ lệ nháp. [`RetentionRevenueScenarioCalculatorTests`](../../../backend/src/test/java/com/gymduongdouble/backend/ai/service/RetentionRevenueScenarioCalculatorTests.java) kiểm tra riêng phép nhân tỷ lệ, làm tròn và tổng giá trị của kịch bản AI. Đọc từng method để thấy test tạo đối tượng trực tiếp như thế nào; không mặc định cả application, Postgres, giao diện và Groq thật đều được chạy bởi các test này.

## 2. Chạy test trong PowerShell

Từ thư mục gốc dự án:

```powershell
Set-Location backend
.\mvnw.cmd test
```

Đọc `Tests run`, `Failures`, `Errors`, `Skipped`, `BUILD SUCCESS`/`BUILD FAILURE`. Test pass chỉ khẳng định các assertion đã chạy theo điều kiện test. Nếu sửa dependency/config hoặc file build hỏng, việc dùng `clean` cần xem có backend khác đang chạy từ `target` và có cần bảo toàn tiến trình đó không. Test không thay cho sao lưu dữ liệu.

Frontend có `npm run lint`, `npm test` và `npm run build` trong thư mục `frontend`. `npm test` chạy các selector thuần của portal, gồm ngày Việt Nam, gói PT hiệu lực và lịch tương lai; build kiểm tra TypeScript và tạo bản build Vite. Các lệnh này không tự chứng minh mọi nút trong UI hoạt động. Không dùng `&&` trong phiên bản Windows PowerShell cũ không hỗ trợ toán tử đó; chạy riêng từng lệnh.

## 3. Thiết kế test có ý nghĩa

Cho mỗi quy tắc, viết dữ liệu đầu vào, điều kiện trước, hành động và kết quả kỳ vọng. Ví dụ thu nợ: nợ còn 6,2 triệu; gửi 6,2 triệu; kỳ vọng một Payment và số dư bằng 0. Một case đối nghịch: nợ 6,2 triệu nhưng gửi 6,3 triệu; kỳ vọng bị từ chối, không có thêm Payment và số dư giữ nguyên. Case quyền cần account PT đúng/sai assignment; case ngày cần hôm nay, quá khứ, tương lai và biên gói.

Với kiểm thử transaction và đồng thời, cần database test độc lập và hai transaction thực sự, không dùng dữ liệu vận hành. Để kiểm tra provider AI thất bại, dùng mock/stub hoặc môi trường test được kiểm soát. Đừng ghi token hay password vào kết quả test.

## 4. Checklist review backend theo chức năng

1. Ghi endpoint, HTTP method, role được phép và điều kiện trên bản ghi.
2. Ghi request DTO, trường bắt buộc, validator và mặc định khi null.
3. Lần qua service theo từng nhánh thành công/lỗi; đánh dấu transaction và query.
4. Kiểm tra entity, quan hệ, khóa, số liệu cập nhật và response DTO.
5. Thiết kế case biên, request trực tiếp API và dữ liệu test độc lập; kiểm tra cả trạng thái database sau lỗi.
6. So với UI và tài liệu, ghi điều chưa chắc thay vì biến giả định thành kết luận.

## 5. Một assertion chứng minh điều gì?

Trích test thật từ `BackendApplicationTests`:

```java
for (int attempt = 0; attempt < 10; attempt++) {
    assertTrue(rateLimiter.tryConsumeSensitiveRequest("ai-advisor", "user:owner"));
}
assertFalse(rateLimiter.tryConsumeSensitiveRequest("ai-advisor", "user:owner"));
```

Test này kiểm tra đối tượng `InMemoryRateLimiter` cho phép 10 lượt rồi từ chối lượt 11 theo key minh họa. Nó không tự khởi động HTTP server, không xác nhận filter có gắn vào đúng endpoint, không đo nhiều tiến trình hay 15 phút ngoài đời. Để hiểu đầy đủ, đi từ `@Test` qua setup, action, assertions và trạng thái sau action; sau đó ghi rõ phạm vi chưa kiểm chứng.

## 6. Thiết kế test cho một phiếu thu

Chia test theo tầng: unit test cho phép tính/validation với dữ liệu giả; integration test cho repository, transaction và rollback trên database test; API test cho JSON, security, status và dữ liệu sau request; kiểm thử UI cho luồng người dùng. Ví dụ nợ 600 nghìn, thu 700 nghìn phải bị từ chối; cần kiểm tra không phát sinh payment và remaining không đổi, không chỉ assert status 400.

Kiểm tra concurrency là bài riêng: hai request cùng đọc một version, quan sát kết quả và dữ liệu sau commit; không coi một unit test đơn luồng là bằng chứng concurrency. Lệnh test thực tế và số lượng bài phụ thuộc môi trường; phải chạy rồi đọc output, không viết PASS dựa trên tài liệu cũ.

## 7. Kiểm thử kịch bản AI không làm thay đổi dữ liệu

Kịch bản AI là phép tính đọc dữ liệu, không phải luồng tạo doanh thu. Chuẩn bị một request OWNER có `year`, `month` và ba tỷ lệ hợp lệ. Đối chiếu response theo bốn bước:

1. Gửi request không có `scenario`; kỳ vọng `scenario` là `null` để bảo đảm phân tích tổng quan cũ vẫn tương thích.
2. Gửi đủ ba tỷ lệ trong khoảng `0..100`; kỳ vọng response có ba nền tính, ba giá trị ước tính và tổng bằng tổng của ba giá trị đó.
3. Gửi một tỷ lệ vượt `100`, âm hoặc thiếu một trường; kỳ vọng API validation trả `400`, không gọi nghiệp vụ để tạo thay đổi dữ liệu.
4. Trước và sau request, đối chiếu số phiếu thu, công nợ, lượt đăng ký và lịch PT trong database test; các số này phải không đổi. Khi tắt/mô phỏng lỗi Groq, `aiGenerated=false` nhưng `scenario` và `insight.scenario` vẫn có dữ liệu fallback.

`RetentionRevenueScenarioCalculatorTests` không chứng minh controller validation, quyền OWNER hay failover Groq. Những phần đó cần request API và môi trường test có kiểm soát. Cũng không khẳng định tỷ lệ người dùng nhập sẽ xảy ra trong thực tế; test chỉ chứng minh phép tính và contract phản hồi.

## 8. Test tự động nào thực sự đang có?

Hiện backend có hai file test Java trong `backend/src/test/java`:

- `BackendApplicationTests.java`: các test đơn vị nhỏ cho cấu hình Groq keys, che mật khẩu trong `toString`, Bean Validation payment/số đo, policy membership/PT assignment, chuẩn hóa số điện thoại, JWT bị thu hồi khi reset password, password policy, khóa login đủ 15 phút từ lỗi thứ năm, metadata `PageResponse`, thống kê membership và việc loại bỏ field payroll/price ratio khỏi contract.
- `ai/service/RetentionRevenueScenarioCalculatorTests.java`: kiểm tra ba nhánh phép tính scenario, làm tròn về đồng và tổng impact.

Tên `BackendApplicationTests` không có nghĩa toàn bộ Spring context/PostgreSQL đã được khởi động trong mọi test. Hãy nhìn annotation và object được khởi tạo: phần lớn test tạo policy/service/DTO trực tiếp, nên chạy nhanh và cô lập nhưng không thay thế integration test controller + security filter + JPA thật. Frontend hiện có test Node `frontend/tests/portal-selectors.test.mjs` cho helper ngày Việt Nam, chọn package PT hiệu lực và lọc lịch sắp tới.

Đây là cách đọc mức độ bao phủ đúng:

| Kiểu kiểm tra | Ví dụ hiện có | Chứng minh được | Không tự chứng minh |
| --- | --- | --- | --- |
| Unit test | `PasswordPolicy`, `MembershipLifecyclePolicy`, scenario calculator | Điều kiện/thuật toán cục bộ | Route, JWT filter, database, UI |
| Frontend helper test | `portalSelectors` | Lọc ngày/gói/lịch trong helper | Response API và giao diện render |
| Lint/build | `npm run lint`, `npm run build` | Cú pháp, type/build frontend | Tính đúng nghiệp vụ runtime |
| Manual/API test | đăng nhập, đăng ký gói, thu nợ, PT | Luồng liên kết gần thực tế | Toàn bộ tổ hợp edge case, concurrency |

## 9. Ma trận kiểm thử tối thiểu trước một buổi demo

1. **Auth & security:** đăng nhập đúng/sai, rate limit, 401 token hết hạn/đổi password, 403 khi role sai, 429 có `Retry-After`.
2. **Hội viên/gói/tài chính:** tạo member, gán gói trả đủ/trả thiếu, thu nợ nhiều đợt khác phương thức, ngày thu quá khứ/hiện tại, chặn ngày thu tương lai.
3. **PT:** gán PT có gói hiệu lực, đặt lịch không trùng, ghi buổi có scheduleId, trừ đúng một lượt, ghi tự tập, số đo, mục tiêu, portal xem cùng dữ liệu. Khi cấp Portal, kiểm tra hội viên chưa có gói hiệu lực bị từ chối còn hội viên `ACTIVE` có gói tự tập/PT hiệu lực được cấp.
4. **Báo cáo/AI:** payment theo ngày thu, debt mở, segment AI, scenario 0–100, provider fallback không đổi dữ liệu.
5. **Public:** không đăng nhập xem gói/video/VietQR; không thể đọc member/payment/report nội bộ.

Sau mỗi lỗi, ghi response HTTP, message, payload đã che dữ liệu nhạy cảm, và dữ liệu trước/sau. Đây là cách phân biệt lỗi validation dự kiến (`400`) với lỗ hổng quyền (`403` phải có nhưng lại trả `200`) hoặc lỗi server (`500`).

## 10. Cách đọc transaction qua test thủ công

Với các luồng ghi nhiều bảng, “nút thành công” chưa đủ. Ví dụ thu nợ cần đối chiếu `Payment`, `DebtRecord.paidAmount/remainingAmount/status` và trạng thái membership; ghi buổi PT cần đối chiếu `PtSessionLog`, bộ đếm package và `PtSchedule` nếu có scheduleId. Nếu request lỗi giữa chừng, dữ liệu phải giữ trạng thái trước transaction.

Để test rollback một cách an toàn, dùng dữ liệu demo và cố tình gửi một request vi phạm backend sau khi đã qua một vài điều kiện, ví dụ gói không thuộc member hoặc schedule đã có log. Đừng sửa SQL trực tiếp để “dàn dựng PASS”; mục tiêu là quan sát transaction do service quản lý. Xung đột đồng thời là bài kiểm tra riêng: `@Version` trên `PtSessionPackage` giúp phát hiện optimistic lock, nhưng cần hai request gần đồng thời mới đánh giá được.

## 11. Mẫu ghi nhận kết quả test

```text
Ngày/giờ:
Môi trường: local, profile dev, database test/demo
Vai trò thực hiện: OWNER | PT | MEMBER | chưa đăng nhập
Tiền điều kiện: ...
Request/thao tác: ...
Kỳ vọng: HTTP ...; dữ liệu ...
Thực tế: ...
Đối chiếu sau thao tác: ...
Kết luận: PASS | FAIL | cần kiểm tra thêm
```

Mẫu này giúp bạn báo cáo với mentor rõ “đã kiểm tra gì” thay vì chỉ ghi “đã test hệ thống”. Không chép JWT, password, DB password, Groq key hay token Apps Script vào phần thực tế.
