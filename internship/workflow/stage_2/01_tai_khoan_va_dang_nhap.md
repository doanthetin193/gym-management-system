# Tài khoản và luồng đăng nhập

## 1. User khác hội viên như thế nào?

[`User`](../../../backend/src/main/java/com/gymduongdouble/backend/user/domain/User.java) là tài khoản đăng nhập: email, điện thoại, password hash, trạng thái, `lastLoginAt`, `authVersion` và tập role. [`Role`](../../../backend/src/main/java/com/gymduongdouble/backend/user/domain/Role.java) biểu diễn quyền; quan hệ nhiều-nhiều qua `user_roles`. Một hội viên được quản lý trong [`Member`](../../../backend/src/main/java/com/gymduongdouble/backend/member/domain/Member.java); hội viên không mặc nhiên có tài khoản portal chỉ vì đã có hồ sơ.

Ba role thường gặp là `OWNER`, `PT`, `MEMBER`. Tập role cho phép một tài khoản có nhiều role; chủ phòng có thể kiêm PT theo logic quản lý tài khoản. Đừng suy ra PT được xem toàn bộ dữ liệu chỉ vì có role PT: một số service còn kiểm tra quan hệ phân công/hội viên. Quản lý tài khoản nhân sự và portal sẽ được học sâu ở stage nghiệp vụ tương ứng.

## 2. Từ form tới controller

[`LoginPage.tsx`](../../../frontend/src/features/auth/pages/LoginPage.tsx) nhận thông tin người dùng; [`authApi.ts`](../../../frontend/src/features/auth/api/authApi.ts) gọi backend. [`AuthController`](../../../backend/src/main/java/com/gymduongdouble/backend/auth/web/AuthController.java) khai báo:

| Endpoint | Công việc |
| --- | --- |
| `POST /api/v1/auth/login` | Nhận định danh, mật khẩu, tùy chọn `rememberMe`. |
| `GET /api/v1/auth/me` | Trả thông tin người đang được xác thực. |
| `POST /api/v1/auth/change-password` | Đổi mật khẩu tài khoản hiện tại. |

Trong [`LoginRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/auth/web/dto/LoginRequest.java), trường tên `email` có thể chứa email **hoặc số điện thoại**. `@NotBlank` bảo đảm định danh và mật khẩu không rỗng. `toString()` che mật khẩu; đây không có nghĩa toàn bộ hệ thống tự động an toàn nếu code khác chủ động log dữ liệu nhạy cảm.

## 3. Luồng login trong backend

Mở [`AuthService.login`](../../../backend/src/main/java/com/gymduongdouble/backend/auth/service/AuthService.java):

1. Controller lấy IP bằng `request.getRemoteAddr()` rồi service yêu cầu `InMemoryRateLimiter` kiểm tra trước.
2. [`CustomUserDetailsService`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/CustomUserDetailsService.java) tìm email đã trim/lowercase, nếu không thấy thì thử điện thoại qua [`VietnamPhoneNormalizer`](../../../backend/src/main/java/com/gymduongdouble/backend/common/validation/VietnamPhoneNormalizer.java).
3. `AuthenticatedUser` chứa thông tin cần cho Spring Security. Service kiểm tra tài khoản đang hoạt động/không khóa và dùng `PasswordEncoder.matches()` so sánh mật khẩu với hash.
4. Thành công: cập nhật `lastLoginAt`, tạo token, xóa bộ đếm lỗi cho định danh và IP được dùng, trả token và thông tin user. Nếu `rememberMe=true`, thời hạn token là 30 ngày; nếu không, dùng `app.security.jwt.access-token-minutes` (mặc định 120 phút).
5. Sai thông tin hoặc tài khoản không đủ điều kiện: ghi nhận lần đăng nhập thất bại và trả lỗi phù hợp. Sau khi đạt giới hạn, lần thử tiếp theo có thể nhận 429 trước cả khi mật khẩu được kiểm tra.

`BCryptPasswordEncoder` được cấu hình trong [`SecurityConfig`](../../../backend/src/main/java/com/gymduongdouble/backend/common/config/SecurityConfig.java). Password hash không phải mật khẩu gốc và không được giải mã để kiểm tra; `matches()` thực hiện phép so sánh theo cơ chế BCrypt.

## 4. Thực hành đọc code

Mở lần lượt `AuthController` → `LoginRequest` → `AuthService.login` → `CustomUserDetailsService` → `UserRepository` → `JwtService.generateAccessToken`. Theo dõi chính xác dữ liệu trả về trong [`LoginResponse`](../../../backend/src/main/java/com/gymduongdouble/backend/auth/web/dto/LoginResponse.java). Khi đăng nhập bằng số điện thoại, subject JWT vẫn lấy từ `AuthenticatedUser.getUsername()`, tức email của tài khoản trong code hiện tại.

## Tự kiểm tra

1. Có hồ sơ hội viên có đồng nghĩa đã có tài khoản portal không?
2. `rememberMe` ảnh hưởng cả thời hạn token và vị trí lưu ở frontend như thế nào?
3. Nếu bị rate limit rồi nhập đúng mật khẩu ngay, tại sao vẫn có thể không đăng nhập được?

## 5. Ví dụ theo dấu email và số điện thoại

Giả sử tài khoản demo có email và điện thoại đã lưu. Người dùng nhập email: `loadUserByUsername` trim, đổi email thành chữ thường, thử `findByEmail`; nếu thấy user thì chuyển thành `AuthenticatedUser`. Nếu nhập số với khoảng trắng, nhánh tìm email không thấy thì normalizer chuẩn hóa số để thử `findByPhone`. Không cần tạo hai user chỉ vì có hai cách đăng nhập. Nhưng khóa rate limit ở `InMemoryRateLimiter` dùng chính định danh request sau trim/lowercase, không lấy ID user; vì vậy hai cách viết khác nhau có thể không chia sẻ cùng khóa account.

Sau khi có `AuthenticatedUser`, `AuthService` dùng `isEnabled()`, `isAccountNonLocked()` và `matches()`. Trong class hiện tại, trạng thái ACTIVE cho `isEnabled=true`; LOCKED khiến `isAccountNonLocked=false`. Nếu user không tồn tại, helper chuyển `UsernameNotFoundException` thành `BadCredentialsException`. Lỗi ở tầng login được handler trả thông tin phù hợp, không trả password hash cho client.

`lastLoginAt` chỉ cập nhật sau khi đã qua kiểm tra và trước khi token được trả trong transaction. Đây là dấu mốc đăng nhập thành công, không phải nhật ký mọi lần gọi API hay lịch sử tất cả thiết bị. Nếu cần điều tra toàn bộ truy cập, trường này một mình không đủ.

## 6. Đổi mật khẩu và những gì người dùng thấy

`AuthController.changePassword` nhận principal hiện tại và `ChangePasswordRequest`. `AuthService` tìm lại entity `User`, kiểm tra mật khẩu cũ với BCrypt, kiểm tra mật khẩu mới không trùng mật khẩu cũ, sau đó áp dụng policy mới, mã hóa, tăng `authVersion` và save. Điều này khác thao tác OWNER reset mật khẩu nhân sự/portal: ở reset, người thực hiện không cần biết mật khẩu cũ của tài khoản được reset, nhưng cần quyền endpoint và dữ liệu hợp lệ.

Khi token cũ không còn hợp lệ, lần request kế tiếp đi qua filter sẽ bị 401; frontend có xử lý xóa token và chuyển về login. Để thử, hãy dùng một tài khoản demo, ghi nhận response trước/sau, và tự giữ mật khẩu mới ở nơi an toàn. Đừng chạy test reset trên tài khoản duy nhất mà mình cần sử dụng.

## 7. Mổ xẻ `AuthService.login` theo từng nhánh

Đoạn trích nguyên văn, đã bỏ phần dựng `LoginResponse` và dấu ngoặc xung quanh để tập trung luồng:

```java
rateLimiter.requireLoginAllowed(request.email(), clientIp);
try {
    AuthenticatedUser user = loadUser(request.email());
    if (!user.isEnabled() || !user.isAccountNonLocked() || !passwordEncoder.matches(request.password(), user.getPassword())) {
        throw new BadCredentialsException("Email hoặc mật khẩu không đúng.");
    }

    userRepository.findById(user.getId()).ifPresent(account -> account.setLastLoginAt(Instant.now()));
    boolean remember = Boolean.TRUE.equals(request.rememberMe());
    long expirationMinutes = remember ? 30L * 24 * 60 : jwtProperties.accessTokenMinutes();
    String token = jwtService.generateAccessToken(user, expirationMinutes);
    rateLimiter.clearLoginFailures(request.email(), clientIp);
    // Trả LoginResponse; xem code gốc để đọc đủ các field.
} catch (BadCredentialsException exception) {
    rateLimiter.recordLoginFailure(request.email(), clientIp);
    throw exception;
}
```

1. Kiểm tra giới hạn **trước** khi kiểm tra mật khẩu. Khi đang bị giới hạn, kể cả mật khẩu đúng cũng chưa được kiểm tra.
2. `loadUser` tra thông tin định danh; trường tên `email` trong request cũng có thể chứa số điện thoại, hãy đọc `CustomUserDetailsService` để hiểu cách tra cứu.
3. Tài khoản phải enabled, không locked, và `matches` phải xác nhận mật khẩu nhập khớp hash. Không so sánh mật khẩu rõ với chuỗi hash bằng `equals`.
4. Khi thành công, cập nhật `lastLoginAt`, chọn thời hạn JWT theo `rememberMe`, tạo token rồi xóa các bộ đếm liên quan. `Boolean.TRUE.equals` an toàn khi giá trị là `null`.
5. Sai thông tin tạo `BadCredentialsException`; `catch` ghi một lần thất bại rồi ném tiếp để tầng xử lý lỗi trả response. Một lỗi khác loại không tự động đi vào nhánh catch này.

Ví dụ thực hành, chỉ là dữ liệu giả: `member@example.com` nhập sai ba lần, sau đó đúng trước khi đạt ngưỡng: login thành công và xóa bộ đếm theo identifier/IP đó. Nếu đã đạt ngưỡng, yêu cầu tiếp theo bị chặn trước bước đối chiếu mật khẩu. Đừng thử nhiều lần trên tài khoản đang cần làm việc vì giới hạn tác động thật đến môi trường dev.

## 8. Tại sao có `@Transactional` dù chỉ đổi một trường?

`login` và `changePassword` đều được đánh dấu transaction. Khi đọc entity `User` rồi thay `lastLoginAt`, entity được quản lý trong persistence context; JPA có thể phát hiện field thay đổi và ghi khi flush/commit. Trong `changePassword`, code còn gọi `save` sau khi đổi hash và tăng phiên bản token. Hãy phân biệt transaction database với bộ đếm trong RAM: rollback database không tự đảo ngược thay đổi của `ConcurrentHashMap`.

Tự kiểm chứng bằng debugger trên dữ liệu demo: theo dõi `isEnabled`, `isAccountNonLocked`, kết quả `matches` và `authVersion` trước/sau đổi mật khẩu. Không ghi nội dung mật khẩu, hash hay token thật vào ảnh thuyết trình.

## 9. Trang hồ sơ tài khoản và đổi mật khẩu

[`ProfilePage.tsx`](../../../frontend/src/features/profile/pages/ProfilePage.tsx) lấy `user` từ auth context, hiển thị thông tin tài khoản và có form đổi mật khẩu. Form kiểm tra xác nhận mật khẩu trùng nhau và độ dài tối thiểu 8 ký tự; request thực tế gọi `changePassword(currentPassword, newPassword)`. Backend vẫn kiểm tra mật khẩu hiện tại và áp dụng `PasswordPolicy` đầy đủ, không chỉ dựa vào hai kiểm tra ở giao diện.

Khi đổi thành công, frontend xóa token trong storage, thông báo đăng nhập lại và chuyển đến `/login`. Ở backend, tăng `authVersion` làm các token phiên bản cũ bị từ chối trong những request sau. Đây là hai hành động ở hai tầng, không phải cùng một cơ chế.

Màn hình chọn `user?.roles[0]` làm role hiển thị chính; vì một OWNER có thể có cả OWNER và PT, nhãn này không phải danh sách đầy đủ các role.
