# Rate limit, mật khẩu và security headers

## 1. Giới hạn đăng nhập: cách đếm thực tế

[`InMemoryRateLimiter`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/InMemoryRateLimiter.java) giữ các bộ đếm trong `ConcurrentHashMap` của tiến trình backend. Với login, code tạo hai khóa: định danh được `trim`/lowercase và IP do server nhìn thấy. Cửa sổ là 15 phút kể từ lần thất bại đầu của khóa trong cửa sổ; sau 5 lần sai, lần thử tiếp theo bị chặn nếu một trong hai khóa đã tới giới hạn. Đây không nhất thiết là 15 phút tính lại từ lần nhập sai thứ năm.

Khi bị chặn, service ném `RateLimitExceededException`; handler trả HTTP `429`, `RATE_LIMITED` và `Retry-After` theo số giây còn lại. `AuthService` xóa bộ đếm của định danh/IP đang dùng khi đăng nhập thành công. Vì kiểm tra diễn ra trước khi so mật khẩu, nhập đúng trong thời gian đang bị chặn vẫn bị từ chối.

Lưu ý cần trình bày trung thực: bộ đếm chỉ tồn tại trong RAM, mất khi restart và không tự chia sẻ giữa nhiều instance. Giới hạn theo IP có thể ảnh hưởng những người dùng chung mạng. `getRemoteAddr()` không tự bảo đảm xác định đúng IP khách khi đặt sau proxy. Khóa định danh của rate limit chỉ chuẩn hóa trim/lowercase, trong khi tìm user còn chuẩn hóa số điện thoại; các cách viết khác nhau của cùng số có thể tạo khóa account khác nhau, dù vẫn còn giới hạn theo IP.

## 2. Các API nhạy cảm đang được giới hạn

[`SensitiveEndpointRateLimitFilter`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/SensitiveEndpointRateLimitFilter.java) áp dụng **10 request / 15 phút** theo operation và tài khoản đã xác thực, hoặc IP nếu không có tài khoản. Các đường dẫn được code nhận diện là POST:

- `/v1/auth/change-password`
- `/v1/settings/team-users`
- `/v1/settings/team-users/{id}/reset-password`
- `/v1/members/{id}/portal-account` và `/v1/members/{id}/portal-account/reset-password`
- `/v1/ai/retention-revenue-advisor`

Đường dẫn ở đây là path sau context `/api`. Login được kiểm soát riêng trong `AuthService`, không nằm trong danh sách filter này. **Filter hiện không liệt kê xuất Excel/backup hoặc đồng bộ Google Sheets**, nên không nên nói các chức năng đó đã được rate limit chỉ dựa vào tài liệu cũ. Đây là mô tả trạng thái, không tự động kết luận phải mở rộng scope.

## 3. Chính sách mật khẩu

[`PasswordPolicy`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/PasswordPolicy.java) trim mật khẩu, yêu cầu ít nhất 8 ký tự, có chữ và số; kiểm tra không trùng định danh được truyền vào, trong đó có so sánh phần chữ số của định danh khi đủ dài. Các luồng đổi/reset và tạo tài khoản liên quan gọi policy; khi tìm một luồng cụ thể, kiểm tra nơi gọi và các identifier được truyền vào.

Ví dụ đổi mật khẩu: [`AuthService.changePassword`](../../../backend/src/main/java/com/gymduongdouble/backend/auth/service/AuthService.java) kiểm tra mật khẩu hiện tại, không cho trùng mật khẩu hiện tại, áp dụng policy, mã hóa bằng BCrypt và tăng `authVersion`. Không ghi mật khẩu, hash, token thật vào tài liệu minh họa.

## 4. HTTP headers và CORS

[`ApiSecurityHeadersFilter`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/ApiSecurityHeadersFilter.java) thêm các header: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, CSP với `default-src 'none'`, và `Cache-Control: no-store, max-age=0` / `Pragma: no-cache`. Đây là header của response backend qua security chain, không tự chứng minh frontend được bảo vệ bằng cùng CSP.

`SecurityConfig` cấu hình CORS theo `app.cors.allowed-origins`, expose `Retry-After`, và cho các phương thức được liệt kê. CORS là chính sách trình duyệt, không thay thế xác thực/phân quyền API; client khác ngoài trình duyệt không bị ràng buộc như vậy.

Filter được đưa vào Spring Security chain; các `FilterRegistrationBean` tắt đăng ký servlet tự động của cùng filter để tránh chạy lặp. Dòng log “filter registration was not registered (disabled)” tự nó không có nghĩa các filter bị bỏ khỏi security chain.

## Tự kiểm tra

1. Sau lần sai thứ năm, bộ đếm có luôn khóa đúng 15 phút kể từ thời điểm đó không?
2. Khởi động lại backend local có giữ bộ đếm rate limit không?
3. CORS, CSP và `@PreAuthorize` giải quyết cùng một vấn đề hay các vấn đề khác nhau?

## 5. Tính thời gian khóa bằng một ví dụ

Giả sử lần sai đầu lúc 10:00 và bốn lần tiếp theo trước 10:15, bộ đếm vẫn dùng `startedAt` 10:00. Từ lần thử kế tiếp sau khi count đạt 5, `requireLoginAllowed` từ chối, và `Retry-After` được tính dựa trên `startedAt + 15 phút`. Nếu sai lần thứ năm lúc 10:14, thời gian còn lại xấp xỉ một phút, không nhất thiết là 15 phút mới. Giá trị header tính theo giây và có làm tròn theo implementation.

Một người đăng nhập thành công trước khi đạt ngưỡng sẽ gọi `clearLoginFailures` cho khóa định danh và IP của request. Một khi đang bị chặn, `requireLoginAllowed` chạy trước so mật khẩu, nên không thể đăng nhập đúng để tự xóa ngay bộ đếm đó. Nếu nhiều tài khoản dùng chung IP, lỗi của các request cùng IP có thể đóng góp vào cùng bộ đếm IP; khi thử thủ công cần lưu ý tránh vô tình làm gián đoạn người khác.

## 6. Filter trong chuỗi bảo mật

`SecurityConfig` thêm `ApiSecurityHeadersFilter` và `JwtAuthenticationFilter` trước `UsernamePasswordAuthenticationFilter`, thêm `SensitiveEndpointRateLimitFilter` sau mốc đó. Filter nhạy cảm chọn operation từ method POST và URI sau khi bỏ context path; `authenticatedActorOrIp` lấy tên Authentication nếu có, nếu không lấy `getRemoteAddr`. Vì vậy không phải chỉ cần có một endpoint nhạy cảm là tự động được giới hạn: endpoint phải khớp điều kiện trong `sensitiveOperation`.

`FilterRegistrationBean` bị disabled để cùng filter không được servlet container đăng ký tự động ngoài security chain. Khi đọc log khởi động, cần phân biệt việc đăng ký tự động bị tắt với việc filter được thêm trong `SecurityFilterChain`. Để xác nhận end-to-end, gọi API local và quan sát header/status, không kết luận chỉ bằng log.

## 7. Ý nghĩa thực tế của từng lớp bảo vệ

`nosniff` yêu cầu trình duyệt không tự suy đoán loại nội dung trái khai báo. `X-Frame-Options: DENY` ngăn response được nhúng vào frame trong trình duyệt hỗ trợ. `Referrer-Policy: no-referrer` hạn chế gửi referrer. CSP response API `default-src 'none'` là chính sách cho response đó, không tự cấu hình CSP của trang React được phục vụ bởi Vite. `Cache-Control: no-store` chỉ dẫn không lưu response; không thay thế kiểm soát truy cập.

Rate limit trong RAM phù hợp giải thích MVP local nhưng không duy trì trạng thái khi process khởi động lại và không đồng bộ giữa instance. Trước khi triển khai thực, cần đánh giá proxy, IP, storage dùng chung, XSS và các chính sách bảo mật khác; không thể suy ra production-ready chỉ từ việc có các header này.

## 8. Đọc thuật toán đếm thực tế

Trích `InMemoryRateLimiter`, đã lược các method khác:

```java
static final int LOGIN_FAILURE_LIMIT = 5;
static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

public void requireLoginAllowed(String identifier, String clientIp) {
    RateLimitWindow accountWindow = activeWindow(loginAccountKey(identifier), LOGIN_WINDOW);
    RateLimitWindow ipWindow = activeWindow(loginIpKey(clientIp), LOGIN_WINDOW);
    if (accountWindow.count() >= LOGIN_FAILURE_LIMIT) {
        throw exceeded(accountWindow, LOGIN_WINDOW);
    }
    if (ipWindow.count() >= LOGIN_FAILURE_LIMIT) {
        throw exceeded(ipWindow, LOGIN_WINDOW);
    }
}

public void recordLoginFailure(String identifier, String clientIp) {
    increment(loginAccountKey(identifier), LOGIN_WINDOW);
    increment(loginIpKey(clientIp), LOGIN_WINDOW);
}
```

Hai key khác nhau cùng được kiểm tra và tăng. Login được phép khi **cả hai** chưa tới ngưỡng. Bộ đếm dùng identifier đã trim/lowercase, còn cách tra tài khoản có thêm chuẩn hóa số điện thoại; do vậy các cách viết định danh có thể là các key account khác nhau, dù giới hạn IP vẫn áp dụng. Không nên trình bày đây là khóa vĩnh viễn tài khoản trong database.

Timeline giả sử lần sai đầu lúc 10:00: mỗi lần sai trong cửa sổ tăng cả hai counter; sau lần sai thứ năm, lần thử kế tiếp bị 429; hết cửa sổ được thử lại. Cửa sổ bắt đầu ở lần sai đầu, **không phải tự động 15 phút tính lại từ lần sai thứ năm**. Phần giây `Retry-After` tính theo thời điểm kết thúc cửa sổ; thời gian hiển thị nên lấy response thực tế thay vì luôn tự đặt 15:00.

`ConcurrentHashMap.compute` xử lý cập nhật cho một key an toàn hơn đọc rồi ghi rời; tuy nhiên việc kiểm tra rồi tăng là các bước riêng, không nên tự khẳng định mọi trường hợp request song song tuyệt đối không vượt ngưỡng. Bộ đếm nằm trong tiến trình, khởi động lại mất; nhiều tài khoản dùng chung IP có thể cùng bị ảnh hưởng.

## 9. Header nào bảo vệ response nào?

Hãy mở `ApiSecurityHeadersFilter` và kiểm tra chính xác header được đặt, sau đó xem response một API trong tab Network. `Content-Security-Policy` áp trên response API không thay thế CSP cho HTML frontend; `X-Frame-Options` cũng cần xem response trang HTML nếu muốn đánh giá bảo vệ giao diện. `no-store` hạn chế caching theo chỉ dẫn, không đảm bảo token không bị đánh cắp bởi XSS. Không dán `Authorization` hay JWT thật vào tài liệu kiểm thử.

Các endpoint giới hạn nhạy cảm được chọn trong `SensitiveEndpointRateLimitFilter`: đừng kết luận toàn bộ các endpoint đều có bộ đếm này. Đặc biệt, đối chiếu code hiện tại trước khi nói xuất XLSX hoặc đồng bộ Sheets được backend rate-limit, vì những phần đó có thao tác ở frontend.
