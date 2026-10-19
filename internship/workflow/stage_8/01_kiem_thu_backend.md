# Kiểm thử backend và quy trình đối chiếu

## 1. Các mức kiểm thử khác nhau

Unit test cô lập một hàm/lớp để kiểm tra điều kiện. Integration test chạy qua nhiều thành phần, có thể gồm Spring và database. Kiểm thử API end-to-end gửi request và đối chiếu response/trạng thái dữ liệu. Manual UI test mô phỏng người vận hành trên trình duyệt. Một mức kiểm thử không tự thay thế những mức còn lại.

[`BackendApplicationTests`](../../../backend/src/test/java/com/gymduongdouble/backend/BackendApplicationTests.java) hiện có các test về Groq key, che password khi chuyển request thành string, validation payment, assignment date, lifecycle membership, quy tắc khách mới/gia hạn, số đo, phone normalizer, JWT version, password policy, rate limiter và contract loại bỏ field lương/tỷ lệ nháp. [`RetentionRevenueScenarioCalculatorTests`](../../../backend/src/test/java/com/gymduongdouble/backend/ai/service/RetentionRevenueScenarioCalculatorTests.java) kiểm tra riêng phép nhân tỷ lệ, làm tròn và tổng giá trị của kịch bản AI. Đọc từng method để thấy test tạo đối tượng trực tiếp như thế nào; không mặc định cả application, Postgres, giao diện và Groq thật đều được chạy bởi các test này.

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
