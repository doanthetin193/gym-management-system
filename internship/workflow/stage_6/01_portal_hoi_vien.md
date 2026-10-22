# Portal hội viên: liên kết tài khoản và dữ liệu cá nhân

## 1. Vai trò của portal

Portal là màn hình để hội viên đăng nhập và xem dữ liệu của mình, không phải chỗ công khai nhập bất kỳ số điện thoại nào để xem thông tin sức khỏe/công nợ. Hội viên và user là hai entity riêng; [`Member`](../../../backend/src/main/java/com/gymduongdouble/backend/member/domain/Member.java) có liên kết tài khoản, còn [`User`](../../../backend/src/main/java/com/gymduongdouble/backend/user/domain/User.java) chứa thông tin đăng nhập và role.

Frontend xem tiến trình tại [`MemberPortalPage.tsx`](../../../frontend/src/features/member-portal/pages/MemberPortalPage.tsx). Backend lấy dữ liệu tại [`MemberPortalController`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberPortalController.java) và [`MemberPortalService`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberPortalService.java).

## 2. Cấp tài khoản: đọc đúng những gì backend làm

[`MemberController`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberController.java) có các endpoint quản lý portal dành cho OWNER. Trong [`MemberService.createPortalAccount`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberService.java):

1. Kiểm tra quyền trên member, tìm hồ sơ, từ chối nếu member đã có user.
2. Bắt buộc hội viên `ACTIVE` và có ít nhất một `MemberMembership` hiệu lực tại `AppClock.today()`. Kiểm tra này dùng `MembershipLifecyclePolicy`, nên gói tương lai, chờ thanh toán, hết hạn và hủy không đủ điều kiện.
3. Yêu cầu có điện thoại; tạo email nội bộ dạng `member.<số>@gymduongdouble.local` từ số đã chuẩn hóa.
4. Tìm user theo số hoặc email nội bộ. Nếu có, chỉ tái sử dụng khi là user chỉ có role MEMBER, email khớp và chưa liên kết hội viên khác; không dùng lại tài khoản OWNER/PT.
5. Nếu chưa có, tạo user role MEMBER. Dù tạo mới hay tái sử dụng user hợp lệ, method đều kiểm tra mật khẩu ban đầu theo policy, mã hóa BCrypt, đặt user ACTIVE, lưu và gắn vào member.

Điều kiện cấp mới không kiểm tra `plan_type = PT`: khách tự tập đang có gói hiệu lực cũng được OWNER cấp Portal khi cần theo dõi. Khách PT chỉ khác ở chỗ Portal có thể có thêm lịch, buổi, số đo và mục tiêu. Không nhập mật khẩu thật vào tài liệu.

## 3. Request lấy dữ liệu của ai?

`GET /api/v1/member-portal/me` yêu cầu `hasRole('MEMBER')`. Controller lấy `@AuthenticationPrincipal AuthenticatedUser` và truyền `user.getId()` vào service. Service dùng `memberRepository.findByUserId(userId)` để tìm hồ sơ liên kết, từ chối nếu không tìm thấy hoặc member không ACTIVE. Client không gửi memberId tùy ý cho endpoint này; đó là ranh giới quan trọng để hiểu cách API chọn chủ dữ liệu.

Service trả [`MemberPortalResponse`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/dto/MemberPortalResponse.java), bao gồm profile, lượt membership hiệu lực hôm nay và lịch sử còn lại, gói buổi PT, nợ, phiếu thu, lịch, session log, số đo, mục tiêu và tổng nợ mở. Các danh sách lấy theo `memberId` từ hồ sơ được liên kết. Response API có thể nhiều hơn những trường mà UI quyết định vẽ; đọc frontend để xác định chính xác cách lọc/hiển thị.

`getPortal()` gọi repository lịch theo member và đưa các lịch vào DTO. `MemberPortalPage` giữ các lịch `SCHEDULED` có thời điểm bắt đầu lớn hơn thời điểm hiện tại, tính bằng chuỗi ngày + giờ theo múi giờ `Asia/Ho_Chi_Minh`, sau đó sắp tăng dần và hiển thị toàn bộ danh sách đó. Vì vậy lịch đã qua giờ trong cùng ngày không bị xem nhầm là lịch sắp tới; service vẫn trả lịch sử đầy đủ để giao diện chủ động lọc.

## 4. Khóa, reset và xóa liên kết

`updatePortalAccountStatus` cập nhật trạng thái user. `resetPortalAccountPassword` áp dụng policy, mã hóa password, tăng `authVersion`; token cũ bị từ chối ở request sau. `deletePortalAccount` gỡ liên kết khỏi member, sau đó xóa user nếu thỏa điều kiện `canDeletePortalUser`; nếu không xóa được nhưng user chỉ có role MEMBER thì khóa user. Đây là logic xóa/khóa có điều kiện, không phải mọi trường hợp đều là soft delete.

Khi sửa điện thoại/tên hồ sơ, `syncPortalAccount` đồng bộ số/tên sang user sau khi kiểm tra trùng; việc đổi số đăng nhập và việc thay đổi email nội bộ là các vấn đề khác nhau, nên kiểm tra code thay vì mặc định email nội bộ tự đổi theo số mới.

## 5. Kịch bản kiểm tra

1. Tạo hội viên `ACTIVE` chưa có user và chưa có gói, thử cấp Portal: phải bị từ chối. Gán gói hiệu lực rồi cấp lại: thành công cho cả gói tự tập hoặc PT.
2. Với hai member test, đăng nhập từng user, so `me` với đúng hồ sơ liên kết; không chia sẻ response có dữ liệu thật.
3. Reset password và thử token cũ; quan sát status, rồi đăng nhập lại bằng mật khẩu mới.
4. Đối chiếu số dư PT, lịch, số đo và nợ ở `MemberPortalResponse` với các bản ghi đã tạo trong module PT/finance.
5. Tìm nơi frontend chọn lịch sắp tới và mục tiêu hiện tại; giải thích khác biệt giữa toàn bộ dữ liệu API và phần hiển thị.

## 6. Vì sao endpoint `/me` không nhận ID hội viên từ client?

Trích `MemberPortalController`, bỏ import:

```java
@GetMapping("/me")
@PreAuthorize("hasRole('MEMBER')")
public ApiResponse<MemberPortalResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(memberPortalService.getPortal(user.getId()));
}
```

Frontend gọi `GET /api/v1/member-portal/me` cùng token. JWT filter xác thực tài khoản; Spring đưa principal vào tham số `user`; controller truyền **ID tài khoản đang xác thực**, không nhận `memberId` tự do trong query. `MemberPortalService` tiếp tục tìm hồ sơ liên kết user và kiểm tra điều kiện của hồ sơ. Một client đổi số ID trên UI không tự làm principal trở thành người khác; tuy vậy phải đọc cả service và security, không xem tên `/me` là bằng chứng đủ cho mọi quyền.

Hội viên chưa có tài khoản portal không thể đăng nhập chỉ bằng việc biết số điện thoại. OWNER cấp/reset tài khoản qua luồng quản trị riêng, còn portal chủ yếu đọc dữ liệu đã có. Mật khẩu được xác thực bằng hệ thống user; không được đặt mật khẩu hoặc token thật vào tài liệu mẫu.

## 7. Đối chiếu dữ liệu PT với màn hình khách

Với một hội viên demo, hãy lập bảng: PT nhập một `BodyMeasurement` ngày X; API portal trả danh sách measurement; frontend chọn bản gần nhất và dựng biểu đồ từ tối đa tám lần đo gần nhất; mục tiêu lấy từ `PtGoal`; lịch sắp tới lọc theo ngày giờ thực tế; số dư lấy từ gói buổi; khoản phải thu từ finance. Các bản ghi này có nguồn khác nhau, không nên kỳ vọng ghi buổi tự tạo số đo ở mọi trường.

Để chọn gói PT đang theo dõi, frontend đồng thời kiểm tra `PtSessionPackage.status = ACTIVE`, khoảng ngày của package bao gồm ngày hiện tại, và `membershipId` nằm trong tập membership `ACTIVE` có hiệu lực hôm nay. Điều này loại gói mua trước chưa đến ngày, gói hết hạn, hủy và gói chờ thanh toán. Danh sách phiếu thu của portal được hiển thị đầy đủ theo response hiện tại; chỉ biểu đồ được giới hạn có chủ đích để không quá dày.

Khi dữ liệu lệch, lần theo bốn điểm: bản ghi database; DTO `MemberPortalResponse`; response `/me`; logic chọn/lọc/format ở `MemberPortalPage.tsx`. Hãy kiểm tra ngày, thứ tự, trạng thái và null từng điểm. Nếu API có nhiều trường mà màn hình không hiển thị thì đó là khác biệt presentation, không tự khẳng định database bị mất dữ liệu.

## 8. Portal lấy đúng “tôi” bằng cách nào?

Endpoint duy nhất của portal là `GET /api/v1/member-portal/me`. Controller dùng `@PreAuthorize("hasRole('MEMBER')")` rồi nhận `AuthenticatedUser` do JWT filter đã xác thực. Service gọi `memberRepository.findByUserId(user.getId())`; client không gửi `memberId` trong URL để chọn người khác. Đây là một mẫu bảo mật quan trọng:

```java
// MemberPortalController
return ApiResponse.ok(memberPortalService.getPortal(user.getId()));

// MemberPortalService
Member member = memberRepository.findByUserId(userId)
    .orElseThrow(...);
```

Tên route `/me` không tự tạo bảo mật. Tính bảo mật đến từ cả chuỗi: token hợp lệ -> principal đúng người -> controller yêu cầu role MEMBER -> service truy vấn bằng `userId` từ principal -> member phải `ACTIVE`. Nếu một tài khoản MEMBER chưa được liên kết với hồ sơ hội viên, service trả lỗi; nếu hồ sơ bị ngừng hoạt động, service từ chối truy cập. Vì vậy không nên tạo portal bằng cách chỉ thêm role rồi hy vọng màn hình tự biết hồ sơ nào thuộc tài khoản đó.

## 9. Response portal gồm gì và frontend đang dùng gì?

`MemberPortalResponse` trả mười một phần dữ liệu: `profile`, `activeMemberships`, `membershipHistory`, `ptSessionPackages`, `debts`, `payments`, `schedules`, `sessionLogs`, `bodyMeasurements`, `goals` và `totalDebt`. Service đọc danh sách theo `memberId`, còn trạng thái hiệu lực membership/package được tính qua `MembershipLifecyclePolicy` tại ngày hiện tại.

Frontend không bê nguyên danh sách lên cùng lúc. [`MemberPortalPage.tsx`](../../../frontend/src/features/member-portal/pages/MemberPortalPage.tsx) chọn gói PT bằng helper `currentPtPackage`, chọn lịch sắp tới bằng `upcomingPtSchedules`, lấy số đo đầu danh sách là mới nhất, lấy số đo thứ hai là kỳ trước, và dựng biểu đồ từ tối đa tám lần đo. Đây là một ví dụ tốt về khác biệt giữa:

- **dữ liệu nguồn**: lịch sử đầy đủ backend trả về;
- **view model**: phần tử mới nhất, phần tử kế trước, danh sách đã lọc;
- **UI**: thẻ, biểu đồ và câu chữ mà khách nhìn thấy.

Do response hiện trả toàn bộ danh sách cho hội viên đó, giới hạn “tối đa tám” chỉ áp dụng cho biểu đồ, không phải giới hạn API. Khi dữ liệu lớn trong tương lai, có thể mới cần pagination hoặc endpoint tách riêng; hiện tại không được ghi nhầm rằng backend đã phân trang portal.

## 10. Những gì hội viên có thể và không thể làm

Portal cho hội viên xem gói, hạn, lịch sử gói, thanh toán và công nợ. Nếu hội viên có dữ liệu PT hiệu lực thì Portal hiển thị thêm số lượt, lịch PT, mục tiêu, nhật ký buổi và chỉ số cơ thể; khách tự tập không có những bản ghi đó sẽ thấy trạng thái trống thay vì dữ liệu bị suy đoán. Họ có thể gọi endpoint đổi mật khẩu dùng chung của auth sau khi nhập mật khẩu hiện tại. UI cũng có liên kết liên hệ Zalo phòng gym.

Portal **không** có endpoint để hội viên tự tạo membership, tự ghi phiếu thu, tự gán PT, tự đặt lịch, tự ghi số đo hay tự sửa mục tiêu. Đây không phải thiếu sót ngẫu nhiên: các dữ liệu đó phải được OWNER/PT xác nhận vì ảnh hưởng số lượt, lịch và tài chính. Nếu khách muốn đổi lịch hoặc gia hạn, họ liên hệ phòng gym; hệ thống nội bộ mới ghi nhận thay đổi sau khi được xác nhận.

## 11. Vòng đời cấp và gỡ tài khoản portal

Các thao tác này nằm trong `MemberService` và được `MemberController` bảo vệ bằng `hasRole('OWNER')`:

1. **Cấp**: hội viên phải chưa có `member.user`, có số điện thoại, có `status = ACTIVE` và ít nhất một gói hiệu lực hôm nay. Service chuẩn hóa/kiểm tra số điện thoại ở luồng hồ sơ trước đó, dùng `MembershipLifecyclePolicy` kiểm tra gói, tạo email local dạng `member.<digits>@gymduongdouble.local` nếu cần, thêm role `MEMBER`, áp dụng `PasswordPolicy`, mã hóa mật khẩu rồi liên kết `Member.user`.
2. **Dùng lại có kiểm soát**: nếu trùng phone/email với tài khoản có sẵn, service chỉ chấp nhận tài khoản MEMBER-only đúng email kỳ vọng và chưa gắn nhầm cho hội viên khác. Tài khoản OWNER/PT đang dùng phone đó không thể bị “mượn” làm portal.
3. **Khóa/mở**: cập nhật `UserStatus`; lần request kế tiếp, lớp xác thực sẽ thấy trạng thái khóa và không cho dùng như tài khoản active.
4. **Reset mật khẩu**: qua `PasswordPolicy`, BCrypt và `revokeActiveTokens()`. Token JWT cũ bị vô hiệu theo `authVersion` khi request sau đi qua filter.
5. **Xóa liên kết**: service tháo quan hệ member-user. Tài khoản local MEMBER-only không còn liên kết được xóa; nếu không thỏa điều kiện xóa vật lý nhưng vẫn là MEMBER-only thì bị khóa. Điều này tránh vô tình xóa tài khoản có vai trò khác.

Khi hồ sơ hội viên đổi tên/số điện thoại, `syncPortalAccount` đồng bộ tên/số điện thoại sang user portal; nếu hội viên không còn `ACTIVE`, portal bị khóa. Đây là quan hệ dữ liệu thật, không chỉ là UI hiển thị cùng một tên.

Điều kiện gói hiệu lực áp dụng tại thời điểm **cấp mới**. Hệ thống không tự xóa Portal khi gói về sau hết hạn, vì hội viên vẫn cần xem lịch sử; OWNER có thể khóa hoặc gỡ liên kết theo quy trình quản trị khi cần.

## 12. Kịch bản review thực hành

1. Với hội viên chưa cấp tài khoản, thử truy cập `/my-progress` bằng một user MEMBER khác: không được thấy dữ liệu người đó vì `/me` luôn bám principal.
2. Thử cấp Portal cho hội viên không có gói hiệu lực để thấy `400`; sau đó cấp cho hội viên có phone hợp lệ và gói tự tập/PT hiệu lực. Đăng nhập Portal, kiểm tra gói và các dữ liệu PT chỉ xuất hiện khi PT tạo dữ liệu ở stage 5.
3. Đổi mật khẩu portal, sau đó dùng token cũ gọi một API được bảo vệ. Quan sát phản hồi bị từ chối thay vì tin rằng đổi mật khẩu chỉ đổi một chuỗi hash.
4. Khóa portal từ OWNER rồi thử tải lại `/me`; sau đó mở lại và đăng nhập mới.
5. Cập nhật số điện thoại hội viên sang định dạng hợp lệ khác, kiểm tra account portal đồng bộ; thử một số đã thuộc user khác để quan sát conflict.

Khi demo, tuyệt đối không in token, mật khẩu hoặc dữ liệu cá nhân thật ra console/tài liệu. Mục tiêu là chứng minh ownership và vòng đời tài khoản, không phải phô bày secret.
