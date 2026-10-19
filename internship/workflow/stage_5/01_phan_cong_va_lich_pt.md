# Phân công PT và lịch hẹn: từ nghiệp vụ đến code

## 1. Ba bản ghi khác nhau

- `PtSessionPackage`: số buổi còn lại, thời hạn và liên kết lượt đăng ký. Gói PT được khởi tạo khi tạo membership PT.
- `PtAssignment`: ai phụ trách một hội viên, từ ngày nào đến ngày nào.
- `PtSchedule`: lịch hẹn vào ngày, giờ, có trạng thái và có thể gắn hội viên.

Đăng ký gói không tự đồng nghĩa đã có một lịch hẹn. Một lịch hẹn cũng không mặc nhiên là buổi đã hoàn thành; muốn ghi kết quả còn có `PtSessionLog`. Mở [`PtController`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/web/PtController.java), [`PtService`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/service/PtService.java) và các entity trong [`pt/domain`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/domain) khi đọc.

## 2. PT và chủ phòng kiêm PT

Danh sách profile lấy user có role PT. `ensureActivePtUser` yêu cầu user có role PT, trạng thái ACTIVE, có `PtProfile` active. Vì vậy OWNER muốn trực tiếp đứng tên huấn luyện trong các thao tác kiểm tra này cũng cần thỏa các điều kiện PT tương ứng, không chỉ có role OWNER.

`PtProfileResponse` chỉ trả dữ liệu vận hành gồm cấp PT, chuyên môn, giới thiệu và trạng thái hoạt động. Khi lưu profile, PT chỉ được thao tác hồ sơ của chính mình; `ensurePtCanOnlyUpdateOwnProfile` vẫn từ chối thay đổi trạng thái hoạt động khi người gọi không là OWNER. MVP không lưu hoặc tính lương, tỷ lệ dạy và hoa hồng.

## 3. Tạo phân công

`POST /api/v1/pt/assignments` được controller cho OWNER/PT; `PtService.assignMember()` tiếp tục kiểm tra:

1. Tìm user PT, kiểm tra active và quyền quản lý user đó (`ensureCanManagePtUser`: OWNER được qua; PT chỉ thao tác chính mình).
2. Tìm hội viên, yêu cầu trạng thái ACTIVE.
3. `assignablePtPackages` tìm gói PT hiệu lực vào ngày bắt đầu và còn ít nhất một buổi PT **hoặc** ôn tập. Nếu rỗng thì từ chối.
4. Tính hạn gói muộn nhất trong các gói phù hợp. Nếu request không gửi endDate, dùng hạn này; không cho endDate trước startDate hoặc sau hạn gói.
5. Kiểm tra chưa có assignment hiệu lực tại ngày bắt đầu mới, tạo assignment ACTIVE, đặt PT cho các gói phù hợp, lưu và trả response có trạng thái tính theo ngày hiện tại.

Những kiểm tra trên được thực hiện ở backend. UI ẩn chọn sai không đủ thay thế chúng. Cần đọc cả `PtAssignmentRequest` để biết trường bắt buộc.

## 4. Khi đổi PT phụ trách

`PUT /v1/pt/assignments/{assignmentId}/reassign` chỉ OWNER theo controller và service. Phân công cũ phải hiệu lực hôm nay; PT mới phải hợp lệ, khác PT cũ; member active và có gói PT phù hợp. Code chuyển assignment cũ thành ENDED, đặt endDate hôm nay, tạo assignment mới từ hôm nay đến hạn gói, chuyển PT trên các gói phù hợp. Các lịch `SCHEDULED` chưa qua của hội viên cũng được đổi PT. Đây là cập nhật dữ liệu lịch, không tự gửi tin nhắn thông báo cho khách.

## 5. Policy quyền theo thời điểm

[`PtAssignmentPolicy`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/service/PtAssignmentPolicy.java) xét `isEffective` theo status và ngày bắt đầu/kết thúc. Nếu endDate assignment null, `effectiveStatus` có logic suy ra ngày kết thúc từ gói PT khớp điều kiện; nếu không tìm được, cần đọc kết quả thực tế thay vì giả sử luôn có hạn.

`canAccessMember` trước hết yêu cầu `hasAccessiblePtPackage` ở ngày xét: gói hiệu lực, loại PT và PT trên gói là null hoặc đúng user. Sau đó code cho qua nếu danh sách assignment của member **rỗng**, hoặc có assignment hiệu lực cho chính PT. Chú ý `assignments.isEmpty()` nghĩa là không có bản ghi assignment nào, không phải chỉ không có assignment đang hiệu lực. Đây là chi tiết nhỏ nhưng quan trọng khi review quyền.

## 6. Đặt lịch và xung đột

`createSchedule` kiểm tra PT hợp lệ, quyền thao tác PT, và nếu lịch gắn hội viên thì hội viên/quan hệ gói phù hợp vào ngày lịch. Ngày quá khứ bị từ chối. Với ngày hiện tại, giờ bắt đầu không được trước thời điểm hiện tại trừ khoảng cho phép 2 phút. Nếu có giờ kết thúc, nó phải sau giờ bắt đầu.

`ensureScheduleDoesNotOverlap` tìm lịch cùng ngày của PT, rồi của hội viên nếu có; chỉ lịch `SCHEDULED` được coi là blocking. Hàm `overlaps` kiểm tra `nextStart < existingEnd && nextEnd > existingStart`; nếu thiếu endTime thì tạm tính kết thúc = bắt đầu + 1 giờ. Ví dụ 18:00–19:00 và 19:00–20:00 không chồng theo phép so sánh này; 18:30–19:30 thì chồng.

Xóa lịch: cần quyền phù hợp, không được có session log, lịch phải còn `SCHEDULED` và chưa qua theo `isPastSchedule`; code dùng repository delete chứ không phải cột deleted tự động chuyển true. Khi cần hiểu ranh giới đúng giờ hiện tại, đọc method đó trực tiếp.

## 7. Bài tập review

1. So sánh PT user, profile, session package, assignment và schedule: entity nào chứa thông tin gì?
2. Theo dõi một request gán PT: tìm điều kiện member active, gói hợp lệ, hạn tối đa và assignment trùng.
3. Vẽ timeline hai lịch 18:00–19:00 và 19:00–20:00, sau đó thử lịch chồng 18:30–19:30.
4. Tại sao `assignments.isEmpty()` không giống “không có assignment hiệu lực”?
5. Thử OWNER kiêm PT trên dữ liệu demo và kiểm tra role/profile trước khi kết luận đây là hai user riêng.

## 8. Phân quyền theo gói và phân công: phân tích boolean

Trích nguyên method `PtAssignmentPolicy.canAccessMember`:

```java
public boolean canAccessMember(Long memberId, Long ptUserId, LocalDate date) {
    List<PtAssignment> assignments = ptAssignmentRepository.findByMemberId(memberId);
    if (!hasAccessiblePtPackage(memberId, ptUserId, date)) {
        return false;
    }
    return assignments.isEmpty() || assignments.stream()
        .anyMatch(assignment -> assignment.getPtUser().getId().equals(ptUserId) && isEffective(assignment, date));
}
```

Trước tiên phải có gói PT được phép truy cập theo ngày và PT liên quan; nếu không thì trả `false` ngay. Sau đó nếu **danh sách phân công hoàn toàn rỗng**, nhánh đầu của OR cho phép; nếu có bản ghi phân công, cần ít nhất một bản ghi đúng PT và hiệu lực ngày xét. Danh sách chỉ có phân công đã hết hiệu lực vẫn không rỗng: không được thay câu điều kiện bằng “không có phân công đang hiệu lực”.

Ví dụ A: gói còn hiệu lực, PT trên gói để trống, chưa từng phân công: policy có thể cho PT truy cập theo nhánh rỗng; quyền endpoint và các kiểm tra khác vẫn áp dụng. Ví dụ B: có phân công cho PT X nhưng PT Y gọi: không thể chỉ dựa vào role PT để suy ra được quyền. Khi phân công hết hạn, cần đọc cả `effectiveStatus`, `inferredEndDate`, ngày của gói và PT gắn trên gói, không chỉ đọc enum `ACTIVE` trên database.

## 9. Hai lịch giao nhau được phát hiện thế nào?

Đây là method kiểm tra khoảng thời gian trong `PtService`:

```java
private boolean overlaps(LocalTime existingStart, LocalTime existingEnd, LocalTime nextStart, LocalTime nextEnd) {
    LocalTime safeExistingEnd = existingEnd == null ? existingStart.plusHours(1) : existingEnd;
    LocalTime safeNextEnd = nextEnd == null ? nextStart.plusHours(1) : nextEnd;
    return nextStart.isBefore(safeExistingEnd) && safeNextEnd.isAfter(existingStart);
}
```

Hai điều kiện cùng đúng mới coi là chồng: lịch mới bắt đầu trước khi lịch cũ kết thúc và kết thúc sau khi lịch cũ bắt đầu. Ví dụ 18:30–19:30 chồng 18:00–19:00; 19:00–20:00 chạm biên nhưng không chồng theo phép so sánh strict. Nếu giờ kết thúc `null`, code dùng bắt đầu cộng một giờ. Phép này chỉ là kiểm tra khoảng giờ; service gọi nó còn phải xét đúng ngày, PT/hội viên và trạng thái lịch liên quan.

Kịch bản tự test: tạo lịch demo 18:00–19:00, thử lịch trùng một phần và lịch sát biên; sau mỗi thao tác đối chiếu response và danh sách lịch. Hủy/đổi lịch có trạng thái riêng, không mặc nhiên là đã tập hay đã trừ buổi; cần đọc luồng ghi buổi.
