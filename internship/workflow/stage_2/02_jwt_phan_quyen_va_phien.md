# JWT, phân quyền và phiên trình duyệt

## 1. Token được tạo từ những gì?

[`JwtService`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/JwtService.java) tự tạo JWT gồm ba phần Base64URL: header, payload, chữ ký. Header khai báo `HS256`; payload có `sub`, `uid`, `name`, `roles`, `ver`, `iat`, `exp`. Chữ ký dùng HMAC-SHA256 với secret trong cấu hình. Base64URL chỉ mã hóa biểu diễn, **không mã hóa bảo mật nội dung**: người có token có thể đọc payload. Không cho mật khẩu hay dữ liệu nhạy cảm vào claim.

Khi đọc code `parseAndValidate()`, chú ý: code kiểm tra số phần, chữ ký và thời gian hết hạn; không nên nói dự án đang dùng đầy đủ các tính năng của một thư viện JWT chuyên dụng. Secret phải được giữ kín và cấu hình riêng; giá trị mặc định dành cho dev không phù hợp triển khai thật.

## 2. Request sau đăng nhập

[`apiClient.ts`](../../../frontend/src/shared/api/apiClient.ts) đọc token và gửi `Authorization: Bearer <token>`. Sau đó:

```text
Request → JwtAuthenticationFilter
  → kiểm tra chữ ký / hạn token
  → lấy subject và nạp lại User từ DB
  → kiểm tra trạng thái và authVersion
  → tạo Authentication và đặt vào SecurityContextHolder
  → Spring Security xét quyền → controller/service
```

Đọc [`JwtAuthenticationFilter`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/JwtAuthenticationFilter.java) để thấy lỗi token bị trả 401 và context bị xóa. Dữ liệu quyền thực tế được nạp lại từ user, không chỉ tin danh sách role cũ trong token. Nếu tài khoản bị khóa hoặc không còn hoạt động, filter từ chối request có token đó.

`STATELESS` trong [`SecurityConfig`](../../../backend/src/main/java/com/gymduongdouble/backend/common/config/SecurityConfig.java) nghĩa là hệ thống không dùng HTTP session của server để lưu trạng thái xác thực giữa các request. Nó **không** có nghĩa là hoàn toàn không đọc database khi xác thực: filter vẫn nạp user để đối chiếu trạng thái, quyền và phiên bản.

## 3. Thu hồi token khi đổi mật khẩu

[`User.revokeActiveTokens()`](../../../backend/src/main/java/com/gymduongdouble/backend/user/domain/User.java) tăng `authVersion`. `JwtService` ghi giá trị đó vào claim `ver`; filter so sánh với phiên bản user hiện tại. Luồng đổi mật khẩu trong `AuthService`, reset mật khẩu nhân sự trong [`TeamUserService`](../../../backend/src/main/java/com/gymduongdouble/backend/user/service/TeamUserService.java) và reset portal trong [`MemberService`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberService.java) gọi cơ chế này. Token cũ sẽ bị từ chối ở request tiếp theo sau khi thay đổi được lưu.

Đăng xuất frontend xóa token ở trình duyệt, nhưng bản thân thao tác này không tăng `authVersion`; vì vậy không nên gọi đó là cơ chế thu hồi mọi bản sao token trên server. Token sao chép trước đó vẫn có thể dùng đến khi hết hạn hoặc phiên bản/trạng thái tài khoản thay đổi.

## 4. Xác thực khác phân quyền

- Xác thực trả lời: request là của tài khoản nào?
- Phân quyền trả lời: tài khoản đó có được thực hiện thao tác này và truy cập bản ghi này không?

`SecurityConfig` cho phép public các đường dẫn health, login và `/v1/public/**`; các đường dẫn khác yêu cầu xác thực. `@EnableMethodSecurity` cho phép `@PreAuthorize` ở controller/service. Ví dụ [`TeamUserController`](../../../backend/src/main/java/com/gymduongdouble/backend/user/web/TeamUserController.java) yêu cầu OWNER, còn [`MemberPortalController`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberPortalController.java) yêu cầu MEMBER. `hasRole('OWNER')` tương ứng authority `ROLE_OWNER` do [`AuthenticatedUser`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/AuthenticatedUser.java) tạo.

Role chưa đủ để khẳng định được truy cập mọi đối tượng; đọc thêm [`MemberAccessService`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberAccessService.java) và các policy/service nghiệp vụ khi kiểm tra quyền theo hội viên.

## 5. Phiên ở frontend

[`authStorage.ts`](../../../frontend/src/shared/lib/authStorage.ts) lưu token vào `localStorage` khi nhớ đăng nhập hoặc `sessionStorage` khi không nhớ. [`AuthProvider`](../../../frontend/src/features/auth/context/AuthProvider.tsx) nạp lại `/auth/me`, quản lý user/token, kiểm tra lại khi cửa sổ được focus và theo chu kỳ; khi nhận sự kiện 401, frontend xóa token và điều hướng về login.

Lưu token trong Web Storage đơn giản cho MVP nhưng JavaScript trong trang có thể truy cập; cần phòng XSS và không coi đó là bảo vệ tuyệt đối. UI route guard giúp trải nghiệm, không thay quyền backend.

## Tự kiểm tra

1. JWT có chữ ký có đồng nghĩa payload được mã hóa không?
2. Tại sao role và trạng thái mới trong DB vẫn ảnh hưởng request dùng token cũ?
3. Đăng xuất ở trình duyệt khác gì tăng `authVersion` trong DB?

## 6. Giải thích cụ thể ba phần JWT

Phần header của code khai báo `alg=HS256` và `typ=JWT`. Phần payload là JSON với `sub` là email, `uid` là ID, `name`, `roles`, `ver`, `iat`, `exp`. Hai phần được JSON hóa, mã hóa Base64URL không padding, nối bằng dấu chấm, rồi tính chữ ký HMAC từ chuỗi header.payload. Cả ba phần được nối lại thành token.

Khi nhận token, service tính lại chữ ký dựa vào secret và so sánh theo `MessageDigestSupport.constantTimeEquals`. Nếu chữ ký không khớp, từ chối; nếu payload đọc được, kiểm tra `exp` so với `Instant.now()`. Sau đó filter mới nạp user, kiểm tra status và `ver`. Điều này giải thích vì sao đổi một ký tự trong payload mà không biết secret sẽ không tạo ra chữ ký hợp lệ. Tuy nhiên, ký token không ngăn người đang nắm token hợp lệ sử dụng nó, và không che nội dung payload.

## 7. Đọc phân quyền theo hai lớp

Ở lớp URL, `SecurityConfig` cho `permitAll` đối với health, login và public API; các request khác cần `authenticated`. Sau đó `@PreAuthorize` có thể đặt điều kiện role ở controller. Ví dụ role MEMBER có thể đăng nhập nhưng không tự được sử dụng API quản trị nhân sự chỉ vì đã authenticated.

Ở lớp đối tượng, `MemberAccessService` và policy liên quan xét hội viên/phân công; `hasRole('PT')` không đủ diễn đạt toàn bộ điều kiện đó. Khi review một endpoint, lập bảng: ai được gọi theo URL, role nào qua annotation, service kiểm tra ID của bản ghi nào, response trả gì. Những câu hỏi này cũng giúp phát hiện lỗi IDOR, tức dùng ID của người khác để truy cập dữ liệu không được phép, mà không cần giả định có lỗi chỉ vì API nhận ID.

## 8. Ví dụ vòng đời token ở hai trình duyệt

Giả sử cùng tài khoản đăng nhập ở hai trình duyệt, cùng nhận token có `ver=0`. Đăng xuất ở trình duyệt A chỉ xóa token A trong storage, bản token B vẫn có thể còn hợp lệ. Nếu sau đó đổi mật khẩu thành công và `authVersion` thành 1, request tiếp theo mang token cũ từ B sẽ thất bại tại `requireCurrentTokenVersion`; đăng nhập mới tạo token theo phiên bản hiện tại. Nếu chỉ đóng tab khi dùng `sessionStorage`, hành vi lưu trữ tuân theo vòng đời tab/trình duyệt; đừng gọi việc đó là server đã thu hồi token.

## 9. Đọc filter theo thứ tự: chữ ký, tài khoản, phiên bản

Trích từ `JwtAuthenticationFilter.doFilterInternal`, lược bỏ nhánh ghi lỗi và phần tạo authentication:

```java
String token = extractBearerToken(request);
if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
    Map<String, Object> claims = jwtService.parseAndValidate(token);
    String email = jwtService.extractEmail(claims);
    AuthenticatedUser userDetails = (AuthenticatedUser) userDetailsService.loadUserByUsername(email);
    // Code gốc còn từ chối tài khoản bị khóa hoặc không hoạt động.
    jwtService.requireCurrentTokenVersion(claims, userDetails);
    // Code gốc dựng authentication và đưa vào SecurityContextHolder.
}
```

`extractBearerToken` chỉ lấy token khi header bắt đầu bằng `Bearer `. Không có token thì filter tiếp tục chain; endpoint công khai hay được bảo vệ còn do cấu hình Security quyết định. Có token thì `parseAndValidate` kiểm tra token, sau đó tải lại tài khoản từ server; trạng thái hiện tại và `authVersion` vì vậy có ý nghĩa ở từng request. Roles dùng để dựng authentication được lấy từ `userDetails` hiện tại, không chỉ tin chuỗi role client tự đưa lên.

Kiểm tra phiên bản thực tế trong `JwtService`:

```java
public void requireCurrentTokenVersion(Map<String, Object> claims, AuthenticatedUser user) {
    Object tokenVersion = claims.get("ver");
    if (!(tokenVersion instanceof Number version) || version.longValue() != user.getAuthVersion()) {
        throw new BadRequestException("Token đã bị thu hồi.");
    }
}
```

Nếu claim không phải số hoặc số không khớp entity hiện tại, method ném lỗi. Trong filter, runtime exception bị bắt và trả 401 `INVALID_TOKEN`; do đó người gọi filter không nhất thiết nhận HTTP 400 chỉ vì method này ném `BadRequestException`. Đây là ví dụ vì sao phải đọc cả nơi ném lẫn nơi bắt exception.

## 10. Phân biệt xác thực và phân quyền bằng tình huống

Một token hợp lệ chỉ giúp xác định người dùng; chưa đồng nghĩa được truy cập mọi hồ sơ. Ví dụ PT A gọi endpoint nhận ID học viên B: trước tiên token phải đúng và tài khoản active; tiếp theo annotation có cho role PT không; cuối cùng service/policy có cho PT A truy cập học viên B không. Một ID hợp lệ trong database không tự tạo quyền xem. Với OWNER cũng cần đọc điều kiện thực tế của từng endpoint, không suy ra mọi API đều mở cho OWNER.

Token có chữ ký không có nghĩa payload được mã hóa; không đưa mật khẩu hay dữ liệu nhạy cảm vào claim. Trong môi trường dev, có thể quan sát claim **bằng token thử nghiệm**, nhưng không dán token hoặc secret thật vào công cụ ngoài. Khi ôn lại, hãy vẽ hai cột: `authentication` trả lời “ai?”, `authorization` trả lời “được làm gì với bản ghi nào?”.
