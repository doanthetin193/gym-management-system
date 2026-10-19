# Portal hội viên: liên kết tài khoản và dữ liệu cá nhân

## 1. Vai trò của portal

Portal là màn hình để hội viên đăng nhập và xem dữ liệu của mình, không phải chỗ công khai nhập bất kỳ số điện thoại nào để xem thông tin sức khỏe/công nợ. Hội viên và user là hai entity riêng; [`Member`](../../../backend/src/main/java/com/gymduongdouble/backend/member/domain/Member.java) có liên kết tài khoản, còn [`User`](../../../backend/src/main/java/com/gymduongdouble/backend/user/domain/User.java) chứa thông tin đăng nhập và role.

Frontend xem tiến trình tại [`MemberPortalPage.tsx`](../../../frontend/src/features/member-portal/pages/MemberPortalPage.tsx). Backend lấy dữ liệu tại [`MemberPortalController`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberPortalController.java) và [`MemberPortalService`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberPortalService.java).

## 2. Cấp tài khoản: đọc đúng những gì backend làm

[`MemberController`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberController.java) có các endpoint quản lý portal dành cho OWNER. Trong [`MemberService.createPortalAccount`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberService.java):

1. Kiểm tra quyền trên member, tìm hồ sơ, từ chối nếu member đã có user.
2. Yêu cầu có điện thoại; tạo email nội bộ dạng `member.<số>@gymduongdouble.local` từ số đã chuẩn hóa.
3. Tìm user theo số hoặc email nội bộ. Nếu có, chỉ tái sử dụng khi là user chỉ có role MEMBER, email khớp và chưa liên kết hội viên khác; không dùng lại tài khoản OWNER/PT.
4. Nếu chưa có, tạo user role MEMBER. Dù tạo mới hay tái sử dụng user hợp lệ, method đều kiểm tra mật khẩu ban đầu theo policy, mã hóa BCrypt, đặt user ACTIVE, lưu và gắn vào member.

Đọc điều kiện backend trước khi khẳng định chỉ một loại gói mới được cấp portal: method cấp tài khoản cần những điều kiện nêu trên, còn những hạn chế được UI thể hiện phải đối chiếu riêng với frontend. Không nhập mật khẩu thật vào tài liệu.

## 3. Request lấy dữ liệu của ai?

`GET /api/v1/member-portal/me` yêu cầu `hasRole('MEMBER')`. Controller lấy `@AuthenticationPrincipal AuthenticatedUser` và truyền `user.getId()` vào service. Service dùng `memberRepository.findByUserId(userId)` để tìm hồ sơ liên kết, từ chối nếu không tìm thấy hoặc member không ACTIVE. Client không gửi memberId tùy ý cho endpoint này; đó là ranh giới quan trọng để hiểu cách API chọn chủ dữ liệu.

Service trả [`MemberPortalResponse`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/dto/MemberPortalResponse.java), bao gồm profile, lượt membership hiệu lực hôm nay và lịch sử còn lại, gói buổi PT, nợ, phiếu thu, lịch, session log, số đo, mục tiêu và tổng nợ mở. Các danh sách lấy theo `memberId` từ hồ sơ được liên kết. Response API có thể nhiều hơn những trường mà UI quyết định vẽ; đọc frontend để xác định chính xác cách lọc/hiển thị.

`getPortal()` gọi repository lịch theo member và đưa các lịch vào DTO. `MemberPortalPage` giữ các lịch `SCHEDULED` có thời điểm bắt đầu lớn hơn thời điểm hiện tại, tính bằng chuỗi ngày + giờ theo múi giờ `Asia/Ho_Chi_Minh`, sau đó sắp tăng dần và hiển thị toàn bộ danh sách đó. Vì vậy lịch đã qua giờ trong cùng ngày không bị xem nhầm là lịch sắp tới; service vẫn trả lịch sử đầy đủ để giao diện chủ động lọc.

## 4. Khóa, reset và xóa liên kết

`updatePortalAccountStatus` cập nhật trạng thái user. `resetPortalAccountPassword` áp dụng policy, mã hóa password, tăng `authVersion`; token cũ bị từ chối ở request sau. `deletePortalAccount` gỡ liên kết khỏi member, sau đó xóa user nếu thỏa điều kiện `canDeletePortalUser`; nếu không xóa được nhưng user chỉ có role MEMBER thì khóa user. Đây là logic xóa/khóa có điều kiện, không phải mọi trường hợp đều là soft delete.

Khi sửa điện thoại/tên hồ sơ, `syncPortalAccount` đồng bộ số/tên sang user sau khi kiểm tra trùng; việc đổi số đăng nhập và việc thay đổi email nội bộ là các vấn đề khác nhau, nên kiểm tra code thay vì mặc định email nội bộ tự đổi theo số mới.

## 5. Kịch bản kiểm tra

1. Tạo member test chưa có user: thử portal trước khi cấp, sau đó cấp tài khoản hợp lệ và đăng nhập.
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
