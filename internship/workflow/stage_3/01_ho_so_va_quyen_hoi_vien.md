# Hồ sơ, số điện thoại và quyền truy cập hội viên

## 1. Phân biệt hồ sơ và tài khoản đăng nhập

Một người đến phòng tập trước hết có thể được tạo **hồ sơ hội viên**. Hồ sơ này ghi tên, số điện thoại, ngày sinh, giới tính, địa chỉ, nguồn khách, Zalo, trạng thái và ghi chú. Nó không đồng nghĩa người đó đã mua gói hay đã có tài khoản portal. Một hội viên có thể có nhiều lượt đăng ký gói theo lịch sử; các lượt này là bản ghi riêng.

Đọc [`Member`](../../../backend/src/main/java/com/gymduongdouble/backend/member/domain/Member.java) để xem quan hệ và tên trường thực tế. Phân biệt `Member.status` là trạng thái quản lý hội viên, không đồng nghĩa thời hạn của gói. Đọc [`MemberMembership`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/domain/MemberMembership.java) để thấy ngày bắt đầu/kết thúc, giá và số tiền thuộc lượt đăng ký.

## 2. Bản đồ code cần mở

| Tầng | File và mục đích |
| --- | --- |
| Frontend danh sách | [`MembersPage.tsx`](../../../frontend/src/features/members/pages/MembersPage.tsx): tìm, lọc và mở hồ sơ. |
| Frontend chi tiết | [`MemberDetailPage.tsx`](../../../frontend/src/features/members/pages/MemberDetailPage.tsx): hồ sơ, lịch sử và các form nghiệp vụ. |
| Controller | [`MemberController`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberController.java): mapping, quyền và DTO. |
| Nghiệp vụ | [`MemberService`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberService.java): tạo, cập nhật, danh sách, chi tiết và tài khoản portal. |
| Truy vấn | [`MemberRepository`](../../../backend/src/main/java/com/gymduongdouble/backend/member/repository/MemberRepository.java). |
| Quyền theo bản ghi | [`MemberAccessService`](../../../backend/src/main/java/com/gymduongdouble/backend/member/service/MemberAccessService.java) và [`PtAssignmentPolicy`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/service/PtAssignmentPolicy.java). |
| Chuẩn hóa | [`VietnamPhoneNormalizer`](../../../backend/src/main/java/com/gymduongdouble/backend/common/validation/VietnamPhoneNormalizer.java). |

Khi tự lần code, hãy đọc chữ ký method và annotation trước, sau đó mới đọc phần tính toán. Không mặc định mọi thao tác của OWNER và PT là giống nhau: `@PreAuthorize` là lớp đầu, service còn có kiểm tra theo hội viên.

## 3. Tạo hồ sơ: từ request tới database

1. Controller nhận `POST /api/v1/members`, chuyển JSON thành [`MemberCreateRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/member/web/dto/MemberCreateRequest.java) và kích hoạt `@Valid`.
2. `MemberService.create()` chuẩn hóa số điện thoại chính bằng `normalizeRequired`, Zalo bằng `normalizeOptional`.
3. Repository tìm số chính sau chuẩn hóa. Nếu đã có, service ném `ConflictException` thay vì tạo thêm hồ sơ theo cách viết khác.
4. Tạo entity `Member`, trim tên, gán các trường request; nếu không nhập số Zalo thì dùng số điện thoại chính, đặt `MemberStatus.ACTIVE`.
5. Repository lưu; `MemberResponse.from(...)` chuyển entity thành DTO trả lại client. Quá trình này chưa tự tạo membership, phiếu thu hay tài khoản portal.

Ví dụ số `0901 000 004` và `+84 901-000-004` được normalizer quy về dạng chung `0901000004` theo test hiện có. Nên đọc đầy đủ `VietnamPhoneNormalizer` để biết chính xác định dạng được chấp nhận; không suy rộng rằng mọi số điện thoại quốc tế đều hợp lệ. Việc kiểm tra trùng ở service và ràng buộc database là hai lớp khác nhau; không giả định check ở UI là đủ.

## 4. Sửa và đồng bộ tài khoản portal

`update(id, request)` trước hết gọi `ensureCanAccessMember(id)`, tìm hội viên và kiểm tra số đã chuẩn hóa có trùng hội viên khác không. Tên, số và các trường hồ sơ được cập nhật. Với `status`, service chỉ cho OWNER thay đổi trạng thái quản lý; PT không được tự đổi trạng thái bằng request.

Sau đó `syncPortalAccount` chỉ chạy khi hội viên đã liên kết `User`. Code kiểm tra số mới không trùng tài khoản khác, đồng bộ tên và điện thoại; nếu trạng thái hội viên không còn `ACTIVE` thì khóa portal user. Khi đọc code, lưu ý đây là hành vi cụ thể: không suy ra rằng việc đổi lại `ACTIVE` tự động mở tài khoản portal vì method này không đặt trạng thái user về ACTIVE trong nhánh đó.

## 5. Xem danh sách và chi tiết

`list(keyword, filter)` tìm theo tên hoặc số, hoặc lấy danh sách; sau đó lọc quyền `canAccessMember`, sắp xếp theo thời gian tạo giảm dần, dựng summary bằng `preferredSummary`, rồi lọc trạng thái. Ngưỡng `EXPIRING_SOON_DAYS` là 7. Filter `ALL` khác các filter còn lại ở chỗ các filter còn lại trước tiên yêu cầu hồ sơ `ACTIVE`; để hiểu chính xác ngày biên, đọc `matchesFilter()`.

`getDetail(id)` lấy hội viên, các lượt đăng ký, gói buổi PT và tổng nợ còn mở. Lượt đăng ký hiệu lực hôm nay được trả vào danh sách active; các lượt khác vào history theo `MembershipLifecyclePolicy`. Tổng nợ cộng `remainingAmount` dương của các khoản `OPEN` hoặc `PARTIALLY_PAID`, không phải giá niêm yết của tất cả gói.

## 6. Phân quyền theo hội viên

`MemberAccessService.canAccessMember` cho OWNER truy cập; với PT, cần tài khoản PT và hồ sơ hội viên đang `ACTIVE`, rồi ủy quyền quyết định cho `PtAssignmentPolicy` dựa trên ngày hiện tại. Khi tạo gói, `ensureCanCreateMembership` có nhánh riêng cho PT bắt đầu đăng ký gói PT của hội viên đang hoạt động chưa có phân công hiệu lực. Cần đọc policy để hiểu chính xác thế nào là phân công hiệu lực, không hiểu thông báo lỗi là toàn bộ thuật toán.

Ví dụ học tập: PT A gọi API chi tiết khách. Hãy xác định A có role gì, khách có đang ACTIVE không, ai đang được phân công và gói PT có hiệu lực không; sau đó đối chiếu policy thay vì chỉ nhìn danh sách trên UI. OWNER kiêm PT vẫn đi qua nhánh OWNER trong `canAccessMember`.

## 7. Bài tập tự đọc

1. Theo dõi `POST /v1/members` từ request DTO tới response. Tìm nơi đặt trạng thái ban đầu và nơi kiểm tra trùng điện thoại.
2. Tạo hai cách viết cùng một số trong dữ liệu thử; kiểm tra response và xác định lỗi phát ra ở service nào.
3. Với hội viên có cả gói hiện tại và gói tương lai, theo dõi `preferredSummary` sang `preferredMembership` để giải thích gói nào được ưu tiên.
4. Tại sao một member ACTIVE chưa chắc đã có gói hiệu lực? Vì sao hiển thị hay ẩn nút ở frontend chưa đủ để bảo vệ API?

## 8. Mổ xẻ tạo hội viên và chuẩn hóa số điện thoại

Đoạn trích `MemberService.create`, lược phần lưu và response:

```java
String normalizedPhone = phoneNormalizer.normalizeRequired(request.phone(), "Số điện thoại");
String normalizedZaloPhone = phoneNormalizer.normalizeOptional(request.zaloPhone(), "Số Zalo");
memberRepository.findByPhone(normalizedPhone).ifPresent(member -> {
    throw new ConflictException("Số điện thoại đã tồn tại trong hệ thống.");
});

Member member = new Member();
member.setFullName(request.fullName().trim());
member.setPhone(normalizedPhone);
member.setZaloPhone(normalizedZaloPhone == null ? normalizedPhone : normalizedZaloPhone);
member.setStatus(MemberStatus.ACTIVE);
```

Đi từng dòng: chuẩn hóa số chính bắt buộc và số Zalo tùy chọn; kiểm tra số chính đã tồn tại; tạo entity; bỏ khoảng trắng đầu/cuối tên; đặt số Zalo mặc định bằng số chính nếu không nhập; đặt trạng thái hồ sơ ACTIVE. Phần bị lược còn gán ngày sinh, giới tính, địa chỉ, nguồn, ghi chú và lưu. Cần mở `VietnamPhoneNormalizer` để biết chính xác những định dạng được chấp nhận, không tự suy ra mọi số quốc tế đều hợp lệ.

**Ví dụ giả:** hai cách nhập `0901 234 567` và `0901234567` nếu normalizer đưa về cùng giá trị thì kiểm tra trùng dựa trên giá trị đó, không chỉ dựa vào chuỗi người dùng gõ. Ở update, `existsByPhoneAndIdNot` bỏ qua chính ID hội viên đang sửa; nếu chỉ dùng kiểm tra tồn tại thông thường, giữ nguyên số cũ cũng bị báo trùng. Kiểm tra ứng dụng và ràng buộc database có vai trò khác nhau khi có hai request đồng thời.

## 9. Hội viên, gói và tài khoản là ba khái niệm

`Member` là hồ sơ người tập. `MemberMembership` là một lần đăng ký và có thời hạn, giá, tình trạng tương ứng. `User` là thông tin đăng nhập; hội viên có thể chưa có user portal. Tạo hồ sơ không tự đồng nghĩa đã bán gói hoặc đã thu tiền. Nếu khách có hai lượt đăng ký theo thời gian, không tạo hai `Member` chỉ để ghi hai gói.

Khi đọc quyền, chọn một request cụ thể: xem controller nhận ID nào, role nào được vào, service có `ensureCanAccessMember` hay không, và policy xét phân công/gói theo ngày nào. UI ẩn nút không thể ngăn người dùng gọi trực tiếp API; backend phải tự kiểm tra. Không thử request vượt quyền trên dữ liệu thật nếu chưa có tài khoản demo tách biệt.
