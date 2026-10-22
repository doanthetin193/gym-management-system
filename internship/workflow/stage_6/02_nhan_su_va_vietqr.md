# Nhân sự và cấu hình VietQR

## 1. Quản lý tài khoản đội ngũ

[`TeamUserController`](../../../backend/src/main/java/com/gymduongdouble/backend/user/web/TeamUserController.java) có `@PreAuthorize("hasRole('OWNER')")` ở cấp class. Đọc [`TeamUserService`](../../../backend/src/main/java/com/gymduongdouble/backend/user/service/TeamUserService.java) để biết các điều kiện ngoài role. `listTeamUsers()` chỉ chọn user có role OWNER hoặc PT, sắp xếp theo ID và chuyển `TeamUserResponse`.

Khi tạo user, service trim/lowercase email, kiểm tra email trùng, chuẩn hóa điện thoại tùy chọn và kiểm tra trùng nếu có. `requireTeamRole` chỉ chấp nhận `OWNER`/`PT` sau chuẩn hóa; không âm thầm biến chuỗi khác thành PT. Password được kiểm tra policy và BCrypt trước khi lưu, trạng thái ban đầu ACTIVE.

Một chi tiết dự án: nếu tạo OWNER, service thêm cả role PT; nếu tạo OWNER hoặc PT thì `createPtProfileIfMissing` tạo profile khi chưa có. Profile chỉ khởi tạo cấp PT, chuyên môn, giới thiệu và trạng thái hoạt động; dự án không lưu hay tính lương hoặc chi phí trả PT.

## 2. Đổi role, trạng thái và mật khẩu

`updateRole` không cho user đang thao tác tự đổi role của chính mình. Khi chuyển thành PT, `ensureNotLastActiveOwner` ngăn bỏ role của chủ phòng ACTIVE cuối cùng theo điều kiện code. Service xóa tập role cũ rồi thêm role mới, đồng thời thêm PT nếu role mục tiêu là OWNER; đảm bảo profile tồn tại.

`updateStatus` không cho tự khóa chính mình. Nếu trạng thái mới là `LOCKED`, code kiểm tra chủ phòng ACTIVE cuối cùng; đồng thời đặt `PtProfile.active` theo việc status có phải ACTIVE hay không. Đọc enum và request validation trước khi suy rộng quy tắc này sang mọi trạng thái khác.

`resetPassword` áp dụng policy, BCrypt và tăng authVersion. Luồng này khác với `AuthService.changePassword` vì OWNER reset cho tài khoản khác mà không xác nhận mật khẩu cũ của người đó. Số lần POST reset hiện được filter rate limit nhận diện theo operation.

## 3. VietQR được lưu và đọc như thế nào?

[`VietQrSettingService`](../../../backend/src/main/java/com/gymduongdouble/backend/common/service/VietQrSettingService.java) dùng các key `payment.vietqr.*` trong [`SystemSetting`](../../../backend/src/main/java/com/gymduongdouble/backend/common/domain/SystemSetting.java): bật/tắt, mã/tên ngân hàng, số/tên tài khoản, prefix nội dung và template. `get()` đọc danh sách key, dùng mặc định khi thiếu; `update()` upsert từng key và cập nhật thời gian. Trường nhận từ request được trim, một số giá trị có mặc định.

[`SettingsController`](../../../backend/src/main/java/com/gymduongdouble/backend/common/web/SettingsController.java) giới hạn GET/PUT `/v1/settings/vietqr` cho OWNER. Đồng thời [`PublicSettingsController`](../../../backend/src/main/java/com/gymduongdouble/backend/common/web/PublicSettingsController.java) có GET `/v1/public/vietqr-setting` trả `VietQrSettingResponse`. Vì có endpoint public, không đưa bí mật hoặc thông tin không định công khai vào các field đó.

Thông tin VietQR được dùng để hiển thị/cung cấp nội dung chuyển khoản; tạo QR không đồng nghĩa ngân hàng đã xác nhận thu tiền. Khoản `Payment` chỉ xuất hiện khi code ghi nhận giao dịch trong luồng thu tiền.

Ở [`PricingPackages.tsx`](../../../frontend/src/features/public-home/components/PricingPackages.tsx), client public không chứa số tài khoản hoặc tên người nhận dự phòng. `buildVietQrImageUrl` chỉ được gọi khi response có `enabled=true` và đủ mã ngân hàng, số tài khoản, tên chủ tài khoản. Nếu endpoint lỗi, cấu hình tắt hoặc thiếu trường bắt buộc, khối QR bị ẩn thay vì hướng khách chuyển khoản vào thông tin không xác thực.

## 4. Câu hỏi và bài tập

1. Tạo một PT test; tìm code kiểm tra email, phone, role và password trước khi lưu.
2. Tại sao đổi role chính mình bị từ chối? Điều kiện cụ thể nào bảo vệ OWNER ACTIVE cuối cùng?
3. So sánh khóa tài khoản với reset mật khẩu: tình trạng user/profile và `authVersion` thay đổi thế nào?
4. Đọc hai controller VietQR: dữ liệu nào public, thao tác cập nhật cần quyền nào? Vì sao không nên đưa secret vào SystemSetting được public?

## 5. OWNER kiêm PT trong code được biểu diễn ra sao?

Trích từ `TeamUserService` khi tạo tài khoản, đã lược các bước kiểm tra và gán field:

```java
user.setStatus(UserStatus.ACTIVE);
user.getRoles().add(role);
if ("OWNER".equals(targetRoleCode)) {
    user.getRoles().add(teamRole("PT"));
}
User savedUser = userRepository.save(user);

if ("PT".equals(targetRoleCode) || "OWNER".equals(targetRoleCode)) {
    createPtProfileIfMissing(savedUser);
}
```

Một `User` có thể mang hai role. Khi chọn OWNER, code thêm role PT và tạo profile PT nếu thiếu, nên cùng tài khoản có thể được xét trong luồng huấn luyện. Điều này không có nghĩa hệ thống tính riêng lương PT cho chủ phòng: phân quyền và bảng lương là hai nghiệp vụ khác nhau. Khi đổi role, hãy đọc cả `updateRole`, ràng buộc chủ phòng cuối cùng và việc tự thay đổi tài khoản; không suy ra từ đoạn tạo này rằng mọi thay đổi role đều cho phép.

Kiểm tra giá trị role đầu vào trong `requireTeamRole`: chỉ `OWNER` hoặc `PT` sau chuẩn hóa mới được chấp nhận. Khi reset mật khẩu, code dùng policy/hash và thu hồi token cũ bằng phiên bản; lúc khóa tài khoản, filter còn kiểm tra trạng thái user khi request đến.

## 6. VietQR là thông tin phục vụ thanh toán

Người quản trị cấu hình thông tin ngân hàng; frontend sử dụng dữ liệu cần thiết để hiển thị mã và nội dung chuyển khoản. Việc tạo mã QR không đồng nghĩa có webhook ngân hàng, không tự xác nhận tiền về và không tự sinh phiếu thu. Với một khoản nợ demo, nên đối chiếu ba mốc: nội dung QR hiển thị, giao dịch được người vận hành xác nhận ngoài hệ thống, và phiếu `Payment` được ghi trong hệ thống.

Khi review bảo mật, so response endpoint public với endpoint cập nhật: chỉ dữ liệu thật sự cần hiển thị cho người trả tiền nên được công khai. Không đặt khóa bí mật hay thông tin quản trị trong nội dung public rồi cho rằng nó được bảo vệ vì giao diện chỉ hiển thị QR.

## 7. Hai vai trò nhân sự và trường hợp chủ phòng kiêm PT

`TeamUserController` có prefix `/api/v1/settings/team-users` và cả controller yêu cầu `OWNER`. Service chỉ cho phép đúng hai giá trị đầu vào sau chuẩn hóa: `OWNER` hoặc `PT`; chuỗi sai như `ADMIN` không bị âm thầm đổi thành PT mà bị `BadRequestException`.

Một tài khoản được chọn là OWNER sẽ có **hai role** trong tập roles: `OWNER` và `PT`. Service cũng bảo đảm có `PtProfile`. Vì vậy cùng một người có thể quản trị phòng gym và xuất hiện trong luồng gán/đặt lịch PT. Khi đổi một tài khoản sang PT, service thay tập role bằng PT; khi đổi sang OWNER, service thêm PT lại. Đây là thiết kế phục vụ quyền vận hành, **không** là cơ chế lương hoặc hoa hồng.

Các chốt an toàn nằm trong service, không chỉ ở UI:

- người đang đăng nhập không được tự đổi role hoặc tự khóa tài khoản của mình;
- không được đổi/khóa chủ phòng active cuối cùng;
- khóa user sẽ đặt `PtProfile.active = false` nếu profile tồn tại;
- reset mật khẩu áp dụng policy, mã hóa hash và tăng phiên bản token để phiên JWT cũ không còn hợp lệ.

Nhìn vào `user.getRoles().clear()` có thể khiến người mới lo mất role. Ở đây đó là chủ ý: module đội ngũ chỉ quản lý hai role nội bộ OWNER/PT; sau khi clear service thêm role đích, và thêm PT nếu đích là OWNER. Trước khi tái dùng mẫu này ở hệ thống nhiều role hơn, cần thiết kế lại để không vô tình xóa role nghiệp vụ khác.

## 8. Password policy được dùng ở đâu?

`PasswordPolicy.requireValid` được gọi khi tạo nhân sự, reset password nhân sự, cấp/reset portal và đổi mật khẩu bản thân. Mật khẩu hợp lệ phải có ít nhất 8 ký tự, có cả chữ lẫn số, và không trùng email/số điện thoại đăng nhập. Password không được lưu nguyên văn: service gọi `PasswordEncoder.encode(...)` trước lúc save.

Đây là ví dụ về việc đặt chính sách ở một component dùng chung thay vì copy điều kiện vào nhiều controller. Frontend có thể kiểm tra sớm để UX tốt hơn, nhưng backend vẫn bắt buộc kiểm tra vì request có thể đến từ Postman hay client đã bị sửa. Từ `toString()` của DTO tạo nhân sự, bạn cũng thấy password được che `***` để giảm nguy cơ log request làm lộ secret.

## 9. VietQR: config, endpoint public và giới hạn thực tế

`VietQrSettingService` không dùng một entity cấu hình lớn. Nó lưu bảy key trong bảng `system_settings`:

```text
payment.vietqr.enabled
payment.vietqr.bank_code
payment.vietqr.bank_name
payment.vietqr.account_number
payment.vietqr.account_name
payment.vietqr.transfer_prefix
payment.vietqr.template
```

`PUT /api/v1/settings/vietqr` chỉ OWNER gọi được và validation yêu cầu đủ mã/tên ngân hàng, số tài khoản, tên chủ tài khoản. Service `upsert` từng key, cập nhật `updatedAt`, rồi trả `VietQrSettingResponse`. `GET /api/v1/public/vietqr-setting` không yêu cầu đăng nhập và hiện gọi cùng `get()`; response có cả thông tin tài khoản nhận tiền và cờ `enabled`. Đây là thông tin được chủ động coi là có thể công khai để người trả tiền tạo QR, không phải secret như API key hay token.

`enabled=false` là tín hiệu để giao diện không sử dụng/hiển thị QR; endpoint public không tự che các field chỉ vì cờ này. Khi triển khai production với yêu cầu bảo mật khác, cần cân nhắc contract public riêng. Trong scope hiện tại, VietQR chỉ hỗ trợ tạo nội dung thanh toán; không có webhook ngân hàng, không tự xác nhận giao dịch và không tự làm giảm công nợ. Chỉ `PaymentService`/luồng thu tiền đã xác nhận mới thay đổi tài chính.

## 10. Bài tập lần vết tài khoản và VietQR

1. Tạo PT bằng email/phone demo. Theo request -> controller -> `TeamUserService.createTeamUser` -> validation phone/password -> `User` -> `PtProfile`.
2. Dùng request role sai `ADMIN` để quan sát backend trả lỗi. Sau đó thử hạ chủ phòng active duy nhất thành PT để hiểu invariant “luôn có ít nhất một OWNER active”.
3. Reset mật khẩu tài khoản thử nghiệm, rồi giải thích vì sao `revokeActiveTokens()` không phải là xóa ngay toàn bộ bản ghi user mà là tăng version để JWT cũ bị filter từ chối.
4. Cấu hình VietQR ở Settings, kiểm tra response owner và public. Tắt `enabled`, quan sát UI/response để không nhầm rằng endpoint public đã xóa dữ liệu ngân hàng.
5. Tạo QR trên form thu tiền, nhưng chỉ tạo `Payment` khi người vận hành xác nhận thu. So sánh đây với một webhook mà hệ thống hiện chưa tích hợp.
