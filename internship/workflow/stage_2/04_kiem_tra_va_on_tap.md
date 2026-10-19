# Kiểm tra và ôn tập bảo mật

## 1. Các test hiện có

[`BackendApplicationTests.java`](../../../backend/src/test/java/com/gymduongdouble/backend/BackendApplicationTests.java) chứa unit test cho policy và helper, trong đó có kiểm tra che password trong `LoginRequest.toString()`, chuẩn hóa số điện thoại, JWT version sau thu hồi, password policy, 5 lần sai login và 10 request nhạy cảm. Đọc test để biết đầu vào, hành động và assertion. Các test đó không chứng minh toàn bộ API hoặc mọi kịch bản bảo mật đã được kiểm thử end-to-end.

Chạy trong PowerShell từ thư mục dự án:

```powershell
cd backend
.\mvnw.cmd test
```

Kiểm tra output `Tests run`, số lỗi/thất bại và exit code. Không dùng `clean` khi một backend khác đang chạy từ cùng `target`, vì xóa file build của tiến trình đang chạy có thể gây khó chẩn đoán. Cũng không ghi thông tin bí mật vào lệnh kiểm thử hoặc log chia sẻ.

## 2. Kịch bản thử thủ công local

Chuẩn bị một tài khoản demo và backend đang chạy. Nên dùng môi trường local độc lập, không thử trên người dùng thật.

| Bước | Kết quả cần quan sát |
| --- | --- |
| Đăng nhập đúng | Nhận token, vào giao diện phù hợp role; `lastLoginAt` được cập nhật sau thành công. |
| Đăng nhập sai liên tiếp | Sau 5 lần thất bại trong cửa sổ, lần sau bị 429; quan sát thời gian còn lại do server trả. |
| Thử đúng khi đang bị chặn | Vẫn 429 cho tới khi cửa sổ tương ứng hết hoặc bộ đếm được xóa theo cơ chế hiện có. |
| Truy cập API cần quyền mà không có token | Bị từ chối xác thực; kiểm tra HTTP status và body, không chỉ thông báo trên UI. |
| Dùng tài khoản không có role phù hợp | Bị từ chối quyền trên endpoint đã cấu hình `@PreAuthorize`. |
| Đổi mật khẩu tài khoản thử nghiệm | Token cũ bị từ chối ở request kế tiếp; đăng nhập lại bằng mật khẩu mới. |
| Quan sát header API | Kiểm tra `Cache-Control`, `X-Frame-Options`, `Retry-After` khi bị giới hạn. |

Không khởi động lại backend để kết luận rate limit hoạt động giữa nhiều tiến trình: restart sẽ xóa bộ đếm in-memory. Nên ghi lại trạng thái trước/sau mà không ghi token hay mật khẩu. Với phép thử đổi mật khẩu, tự quản lý tài khoản test để không khóa tài khoản đang dùng.

## 3. Câu hỏi thuyết trình

1. Vẽ luồng đăng nhập và request có Bearer token; đánh dấu nơi kiểm tra mật khẩu, chữ ký và role.
2. Phân biệt BCrypt, JWT HMAC và Base64URL: thành phần nào để kiểm tra mật khẩu, thành phần nào chống sửa token, thành phần nào chỉ biểu diễn dữ liệu?
3. Nêu cơ chế và giới hạn `authVersion`, rate limit in-memory, CORS và security header.
4. Vì sao frontend ẩn nút không đủ để bảo vệ API?
5. Với tài khoản OWNER kiêm PT, cần kiểm tra cả role và điều kiện nghiệp vụ nào trước khi truy cập dữ liệu hội viên?

## 4. Ranh giới kết luận

Qua các bước này có thể hiểu và xác minh một số kịch bản quan trọng. Không thể từ vài test đơn lẻ kết luận hệ thống bảo mật tuyệt đối hoặc không còn lỗi. Review các module nghiệp vụ và dữ liệu còn lại theo mục lục tổng trước khi trình bày toàn hệ thống.

## 5. Mẫu ghi kết quả kiểm thử

Với mỗi tình huống, ghi: ngày chạy và môi trường; dữ liệu test không nhạy cảm; endpoint/method; điều kiện trước; hành động; kết quả mong đợi; status/body thực tế đã che bí mật; kết luận pass/fail; và mã nguồn liên quan. Ví dụ: “Tài khoản demo, IP local, 5 lần sai trong cùng cửa sổ; thử tiếp; mong đợi 429 và Retry-After”. Nếu thời gian chờ chưa hết, không ghi rằng đã kiểm thử mở khóa sau thời gian chờ.

Các test hiện có trực tiếp tạo đối tượng Java và gọi method, ví dụ `loginRateLimiterBlocksAfterFiveFailedAttemptsAndClearsAfterSuccess`. Test đó kiểm tra bộ đếm ở mức unit, không phải một loạt HTTP request thực tế từ trình duyệt. Để test end-to-end phải khởi động service, dùng tài khoản test và xác minh response; hai cách bổ sung cho nhau thay vì thay thế nhau.

## 6. Đọc một unit test thay vì chỉ nhìn chữ PASS

Trích nguyên test trong `BackendApplicationTests`, dữ liệu dùng ở đây là dữ liệu test:

```java
@Test
void loginRateLimiterBlocksAfterFiveFailedAttemptsAndClearsAfterSuccess() {
    InMemoryRateLimiter rateLimiter = new InMemoryRateLimiter();
    String account = "member@example.com";
    String clientIp = "127.0.0.1";

    for (int attempt = 0; attempt < 5; attempt++) {
        rateLimiter.requireLoginAllowed(account, clientIp);
        rateLimiter.recordLoginFailure(account, clientIp);
    }

    assertThrows(RateLimitExceededException.class, () -> rateLimiter.requireLoginAllowed(account, clientIp));
    rateLimiter.clearLoginFailures(account, clientIp);
    rateLimiter.requireLoginAllowed(account, clientIp);
}
```

**Arrange:** tạo bộ đếm mới và identifier/IP giả. **Act:** năm lần xác nhận chưa bị chặn rồi ghi thất bại. **Assert:** lần kiểm tra kế tiếp phải ném exception; sau khi test chủ động gọi clear thì được kiểm tra lại. Cần hiểu test này **không** chứng minh đang khóa thì nhập đúng sẽ tự xóa bộ đếm: trong ứng dụng, `requireLoginAllowed` chạy trước kiểm tra mật khẩu, và `clearLoginFailures` chỉ chạy sau khi đăng nhập thành công.

Test cũng không chờ đủ 15 phút, không gửi HTTP, không kiểm tra `Retry-After`, không tái hiện nhiều instance, và không khẳng định chống brute-force hoàn hảo. Tên test hữu ích nhưng không thay thế đọc từng assertion. Muốn kiểm tra end-to-end cần một môi trường cách ly, tài khoản/IP test và bằng chứng response thực tế.

## 7. Bảng tự review những tình huống quan trọng

| Điều kiện | Hành động | Điều cần quan sát |
|---|---|---|
| Tài khoản test active, chưa bị giới hạn | Đăng nhập đúng | Token, thông tin user, `lastLoginAt`; che token khi lưu kết quả |
| Cùng identifier/IP đã đủ 5 lần sai | Thử lần tiếp theo | 429 và `Retry-After`; không diễn giải đây là sai mật khẩu thông thường |
| Đăng nhập hai phiên test | Đổi mật khẩu ở một phiên | Request tiếp theo với token cũ bị từ chối; kiểm tra token mới sau login |
| Token hợp lệ của PT A | Truy cập hồ sơ không được phân quyền | Status thực tế và điều kiện policy; không dùng dữ liệu khách thật |
| Thiếu body hoặc field không hợp lệ | Gọi API test | Phân biệt lỗi JSON, validation và lỗi nghiệp vụ |

Trước khi chạy, kiểm tra lệnh Maven wrapper trong thư mục backend của máy mình. Sau khi chạy, đọc số test và kết quả, không ghi “đã kiểm tra HTTP thực tế” nếu chỉ chạy unit test.
