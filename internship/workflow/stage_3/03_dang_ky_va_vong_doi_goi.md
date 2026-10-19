# Đăng ký, gia hạn và vòng đời gói

## 1. Tình huống để hình dung

Khánh là hội viên đã có hồ sơ, mua gói PT giá 11.200.000 đồng, không giảm giá, thu ban đầu 5.000.000 đồng. Kết quả nghiệp vụ mong đợi theo luồng code: có một lượt đăng ký, một khoản công nợ ban đầu, một phiếu thu đầu tiên, số dư nợ 6.200.000 đồng và một gói buổi PT nếu plan có loại PT. Không đồng nhất `MembershipPlan` với `MemberMembership`, `DebtRecord` hay `Payment`: mỗi entity đại diện một khái niệm khác.

## 2. Đường đi từ UI tới service

Danh mục trong khu vực quản trị dùng endpoint nội bộ theo quyền. Trang chủ không sao chép bảng giá này vào mã nguồn: [`PublicMembershipPlanController`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/PublicMembershipPlanController.java) chỉ trả các `MembershipPlan` có `active=true` dưới dạng `PublicMembershipPlanResponse`. DTO công khai không mang các trường cấu hình/quản trị ngoài nhu cầu hiển thị giá, thời hạn, số buổi và mô tả. Vì vậy tắt gói trong quản trị làm gói biến mất ở lần tải bảng giá công khai tiếp theo mà không làm mất lịch sử `MemberMembership`.

Đọc [`MembershipAssignmentModal.tsx`](../../../frontend/src/features/members/components/MembershipAssignmentModal.tsx): người dùng chọn plan, ngày bắt đầu, giá, giảm giá, tiền thu ban đầu. Nếu tiền thu bằng 0, dữ liệu ngày thu và phương thức được đặt `null` trong payload modal. [`MemberDetailPage.tsx`](../../../frontend/src/features/members/pages/MemberDetailPage.tsx) chuyển thành các trường `initialPaidAmount`, `initialPaymentMethod`, `initialPaymentDate`, `initialPaymentNote` rồi gọi API.

Endpoint backend ở [`MemberMembershipController`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/MemberMembershipController.java): `POST /api/v1/members/{memberId}/memberships`, cho OWNER/PT ở tầng method. Body được kiểm tra bởi [`CreateMemberMembershipRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/dto/CreateMemberMembershipRequest.java). Đừng coi quyền tại controller là kiểm tra cuối cùng: service còn gọi policy kiểm tra quyền trên hội viên.

## 3. Đọc từng bước trong `create`

Mở [`MemberMembershipService`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MemberMembershipService.java), tìm method `create()`:

1. Lấy member và plan; plan không tồn tại hoặc inactive bị từ chối. Gọi `ensureCanCreateMembership` với hội viên và loại plan.
2. Tính ngày bắt đầu thực tế bằng `resolveStartDate`, sau đó ngày kết thúc bằng `resolveEndDate` và kiểm tra trùng nếu là gói lịch sử.
3. Nếu `actualPrice` không gửi, dùng `plan.defaultPrice`; nếu `discountAmount` null thì bằng 0. Giảm giá không được lớn hơn giá bán. `payableAmount = actualPrice - discountAmount`, tối thiểu 0.
4. `initialPaidAmount` null thành 0. Nếu thu trước lớn hơn cần thu thì từ chối; nếu thu trước > 0 mà không gửi phương thức thì từ chối.
5. Tạo `MemberMembership`: lưu giá, giảm giá, `paidAmount=0`, `debtAmount=payableAmount`, trạng thái lưu ban đầu `ACTIVE`; ghi nhận người bán, người tạo.
6. Lưu membership, gọi `createDebtIfNeeded`, `createInitialPaymentIfNeeded`, `createPtPackageIfNeeded` trong cùng method có `@Transactional`.
7. Trả DTO bằng trạng thái tính qua `MembershipLifecyclePolicy.effectiveStatus(..., today)`, thay vì chỉ đưa trạng thái lưu thô ra ngoài.

Khi cần > 0, `createDebtIfNeeded` tạo debt với `originalAmount=remainingAmount=payableAmount`, đã trả 0, `OPEN`, `dueDate=startDate`. Nếu khoản cần thu bằng 0, hàm trả `null` và không tạo debt. Khi có thu trước, service tạo Payment, rồi đồng bộ lại số đã thu/nợ của debt và membership. Stage 4 giải thích phép tính và đồng thời cập nhật.

Với plan PT, `createPtPackageIfNeeded` tạo `PtSessionPackage` theo tổng số buổi và ngày của lượt đăng ký; không nên nhầm gói buổi với bản ghi phân công PT. Việc có `ptUser` trên gói và quy tắc assignment/lịch là hai phần cần đọc riêng tại module PT.

## 4. Ngày bắt đầu và ngày kết thúc

`resolveStartDate` có hai nhánh:

- Ngày được yêu cầu trước hôm nay: giữ ngày đó, sau đó kiểm tra khoảng lịch sử không chồng lên một lượt chưa `CANCELLED`.
- Ngày yêu cầu là hôm nay hoặc tương lai: tìm ngày kết thúc lớn nhất của lượt chưa hủy có `endDate` không trước ngày yêu cầu. Nếu có, bắt đầu thực tế vào ngày sau ngày kết thúc đó; nếu không, giữ ngày yêu cầu.

Phải lưu ý đây là thuật toán đang có trong code, không phải lịch tự động tối ưu khoảng trống giữa mọi gói. Khi gia hạn sớm, ngày người dùng chọn có thể được đẩy về sau; hãy đọc response thực tế.

Nếu request không có `endDate`, code tính `startDate.plusDays(durationDays - 1)`: 30 ngày bắt đầu 01/10 kết thúc 30/10, bao gồm cả ngày bắt đầu và kết thúc. Nếu request có `endDate`, service chỉ kiểm tra nó không trước ngày bắt đầu **thực tế**. Nếu plan thiếu thời hạn hợp lệ và request không có ngày kết thúc, service từ chối.

Ví dụ gói cũ đến hết 30/10, ngày yêu cầu 20/10 và 20/10 chưa ở quá khứ so với ngày chạy: gói kế tiếp có thể bắt đầu 31/10. Với dữ liệu lịch sử, kiểm tra chồng thời hạn dùng cả hai đầu mút; bắt đầu đúng ngày gói cũ kết thúc vẫn chồng.

## 5. `ACTIVE` trong database và hiệu lực ở một ngày

[`MembershipLifecyclePolicy`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MembershipLifecyclePolicy.java) tách hai khái niệm:

- `effectiveStatus`: giữ `CANCELLED`; nếu endDate trước ngày xét thì trả `EXPIRED`; còn lại trả status đang lưu.
- `isEffective`: ngoài status `ACTIVE`, yêu cầu startDate ≤ ngày xét ≤ endDate.

Do đó một lượt lưu `ACTIVE` nhưng bắt đầu ngày mai có thể mang effective status `ACTIVE` mà **chưa hiệu lực hôm nay**. Lượt đã quá ngày kết thúc được trả `EXPIRED` khi tính trạng thái, không có nghĩa code này chạy scheduler để ghi enum EXPIRED vào database.

`preferredMembership` bỏ các lượt `CANCELLED`; ưu tiên lượt hiệu lực hiện tại, sau đó lượt tương lai gần nhất, sau đó lượt đã hết hạn gần nhất. Đọc đúng comparator và điều kiện của từng nhánh; không suy ra mọi status khác `CANCELLED` đều được chọn trong mọi tình huống.

## 6. Người bán và PT phụ trách

Trong cùng service, OWNER có thể chỉ định người bán hợp lệ hoặc mặc định người hiện tại. Với người không là OWNER nhưng có role PT, `resolveSoldByUser` và `resolvePtUserId` yêu cầu không mạo nhận ID của người khác; gói PT gắn user PT hiện tại theo nhánh đó. `findPtUserOrNull` kiểm tra role PT, trạng thái và profile active nếu tìm được user. Muốn xác minh chính xác việc người dùng được gán huấn luyện, cần đọc thêm module assignment; không đồng nhất `ptUserId` trong request với toàn bộ quy trình phân công.

## 7. Tự lần code và kiểm thử

1. Với giá 11,2 triệu, giảm 0, thu 5 triệu: ghi ra giá trị `originalAmount`, `paidAmount`, `remainingAmount` của debt sau đồng bộ và so với membership.
2. Thu trước 0: xác định đoạn code nào tạo hay không tạo Payment; kiểm tra vẫn có debt nếu cần thu > 0.
3. Thu trước > 0 nhưng `initialPaymentDate` null: tìm nơi chọn ngày hiện tại theo `AppClock`; thử ngày tương lai và đọc lỗi.
4. Tạo gói 30 ngày, so ngày bắt đầu/kết thúc ở response với phép tính `durationDays - 1`.
5. Lập danh sách một gói hết hạn, một gói đang hiệu lực và một gói tương lai; chạy tay từng nhánh `preferredMembership`.
6. Trường hợp nào transaction cần rollback? Kiểm tra annotation và thao tác trước/sau exception; đừng kết luận chỉ bằng việc UI đã đóng modal.

## 8. Tính ngày bắt đầu: đọc từng phép trong stream

Đoạn thực tế trong `MemberMembershipService`:

```java
private LocalDate resolveStartDate(Long memberId, LocalDate requestedStartDate) {
    if (requestedStartDate.isBefore(AppClock.today())) {
        return requestedStartDate;
    }
    return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
        .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
        .filter(membership -> !membership.getEndDate().isBefore(requestedStartDate))
        .map(MemberMembership::getEndDate)
        .max(LocalDate::compareTo)
        .map(endDate -> endDate.plusDays(1))
        .orElse(requestedStartDate);
}
```

Ngày cũ được giữ để nhập lịch sử; sau đó method riêng kiểm tra chồng thời hạn. Với ngày hiện tại/tương lai, hệ thống lọc gói chưa hủy có ngày kết thúc không trước ngày yêu cầu, lấy ngày kết thúc lớn nhất rồi cộng một ngày; nếu không có thì dùng ngày yêu cầu. Lưu ý thuật toán đang xét cả các gói thỏa điều kiện kết thúc, không chỉ một gói đang dùng: xem test và dữ liệu thật khi đánh giá gia hạn nối tiếp.

Ví dụ giả: hôm nay 16/10, gói hiện tại kết thúc 15/11, đăng ký bắt đầu 16/10 thì start thực tế là 16/11. Nếu không nhập ngày kết thúc, duration 30 ngày cho 16/11 đến 15/12, do code tính `startDate.plusDays(durationDays - 1L)` và tính cả ngày đầu. Nếu nhập ngày kết thúc thủ công trước start thực tế, backend từ chối. Nhập lịch sử chồng gói cũ cũng có nhánh từ chối, không tự lùi ngày lịch sử.

## 9. Khi lưu phát sinh những bản ghi nào?

Đoạn trích thứ tự thực tế trong `create`:

```java
MemberMembership saved = memberMembershipRepository.save(membership);
DebtRecord debtRecord = createDebtIfNeeded(saved, debtAmount);
createInitialPaymentIfNeeded(saved, debtRecord, initialPaidAmount, request);
createPtPackageIfNeeded(saved, resolvePtUserId(request.ptUserId(), plan.getPlanType()));
```

Đây là bốn lời gọi có điều kiện bên trong method tương ứng, không phải luôn sinh đủ bốn loại bản ghi. Ví dụ giá 11,2 triệu, giảm 0, thu 5 triệu: tạo lượt đăng ký và khoản nợ; ghi payment 5 triệu; đồng bộ số còn nợ 6,2 triệu; nếu plan là PT thì tạo gói buổi. Thu ngay 0 không tạo payment ban đầu. Có phiếu thu mới có doanh thu thực thu, không phải cứ đăng ký là coi như đã thu toàn bộ.

Method `create` được transaction bao quanh. Theo dõi các kiểm tra số tiền trước khi lưu: giảm không lớn hơn giá bán, trả trước không lớn hơn số phải thu, có trả trước thì phải có phương thức. Kiểm tra thêm DTO cho giới hạn âm và ngày để không quy hết validation về đoạn tính toán này.
