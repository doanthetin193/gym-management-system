# Ghi buổi, ôn tập, chỉ số và mục tiêu

## 1. Sau buổi tập ghi gì?

Tùy cách vận hành phòng tập, PT có thể ghi nội dung buổi, cân nặng và nhận xét, sau đó cập nhật chỉ số cơ thể khi thực sự đo. Đây là các bản ghi khác nhau: một `PtSessionLog` không tự thay thế `BodyMeasurement`; đặt lịch không tự tạo session log. Các request được khai báo trong [`PtController`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/web/PtController.java), phần chính xử lý trong [`PtService`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/service/PtService.java).

## 2. Ghi buổi PT 1-1

`POST /api/v1/pt/members/{memberId}/session-logs` → `createSessionLog`:

1. Kiểm tra quyền của người gọi đối với member tại ngày tập; ngày tập không được tương lai.
2. Lấy `PtSessionPackage` theo ID và kiểm tra thuộc member được chỉ ra. Đây là lý do API từ chối nếu nhầm ID gói của người khác.
3. `ensureUsableSessionPackage` yêu cầu gói hiệu lực tại ngày hoạt động và còn buổi PT khi `requirePtSession=true`.
4. Nếu request có scheduleId, kiểm tra lịch đang SCHEDULED, đúng member, đúng ngày, đúng PT của gói khi gói có PT, và chưa có log gắn lịch đó. Request không bắt buộc có scheduleId theo method này. Trên giao diện, khi có lịch phù hợp, PT phải chủ động chọn lịch hoặc chọn ghi buổi độc lập; hệ thống không tự đoán lịch từ ngày tập.
5. Nếu status null, mặc định `COMPLETED`. Kiểm tra trùng theo schedule hoặc quy tắc không có schedule; tạo log, ghi số buổi/nội dung/ghi chú và người tạo.
6. Chỉ hai status trong `CONSUMING_PT_SESSION_STATUSES` là `COMPLETED` và `MISSED` làm giảm một buổi PT. Nếu có lịch, đổi trạng thái lịch tương ứng status log. Lưu log trong transaction.

Với log không gắn lịch và status tiêu buổi, nếu có `sessionNumber`, kiểm tra trùng theo số buổi và gói; nếu không có số buổi, kiểm tra trùng theo ngày và gói. Khi có scheduleId, kiểm tra trùng theo schedule. Đừng diễn đạt đơn giản thành “hệ thống luôn chỉ cho một buổi PT mỗi ngày” vì code có các nhánh khác nhau.

`usePtSession` tăng used, giảm remaining, kiểm tra còn buổi trước khi trừ. `completePackageIfNeeded` đặt `COMPLETED` khi cả remaining PT và remaining practice đều ≤ 0. Vì vậy hết PT nhưng còn ôn tập không tự đánh dấu toàn bộ package completed.

## 3. Ghi buổi ôn tập và hướng dẫn

`POST /v1/pt/members/{memberId}/activity-logs` → `createActivityLog`. Code kiểm tra quyền, ngày không tương lai, và ID membership/session package đều thuộc member; nếu gửi cả hai thì package phải thuộc chính membership đó.

Với `PRACTICE`, bắt buộc có session package, kiểm tra hiệu lực, chống trùng theo package + ngày + loại, rồi `usePracticeSession`: tăng số đã dùng, giảm số còn lại, không cho giảm khi đã hết. Với `GUIDANCE_CHECKIN`, `ensureGuidanceMembershipCanBeLogged` yêu cầu membership thuộc member, plan type GUIDANCE và hiệu lực; nếu plan có số buổi hướng dẫn dương thì đếm log đã ghi và từ chối khi đã đủ. Sau đó kiểm tra trùng theo membership + ngày + loại.

Enum `ActivityType` hiện chỉ có đúng hai giá trị: `PRACTICE` và `GUIDANCE_CHECKIN`. Vì vậy không nên mô tả rằng API có một loại “hoạt động khác” chưa được định nghĩa. `PRACTICE` gắn với `PtSessionPackage` và có thể trừ lượt tự tập; `GUIDANCE_CHECKIN` gắn với `MemberMembership` loại `GUIDANCE`, có định mức theo gói nếu gói khai báo số buổi hướng dẫn dương. Đọc [`MemberActivityLogRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/web/dto/MemberActivityLogRequest.java) và enum [`ActivityType`](../../../backend/src/main/java/com/gymduongdouble/backend/common/enums/ActivityType.java) khi cần phân biệt.

## 4. Số đo cơ thể

`createBodyMeasurement` kiểm tra quyền theo ngày đo và không cho ngày tương lai; lưu các giá trị height, weight, chest, waist, abdomen, hip, thigh, arm và note vào [`BodyMeasurement`](../../../backend/src/main/java/com/gymduongdouble/backend/training/domain/BodyMeasurement.java). Ngày request `LocalDate` được chuyển về đầu ngày theo `AppClock.zone()` rồi lưu `Instant`. [`BodyMeasurementRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/web/dto/BodyMeasurementRequest.java) có validation yêu cầu ít nhất một chỉ số; xem annotation và điều kiện của từng trường để xác định giá trị chấp nhận.

Không có quy định trong method rằng phải đo mọi ngày hay mọi buổi. Số đo là dữ liệu được người vận hành ghi nhận; không tự kết luận một chỉ số sức khỏe chính xác nếu chưa được đo đúng cách.

## 5. Mục tiêu

`createGoal` kiểm tra quyền trên hội viên; nếu có PT thì kiểm tra PT hoạt động và người gọi được quản lý PT đó. `ensureGoalDates` không cho targetDate trước startDate khi cả hai được cung cấp. Service tạo [`PtGoal`](../../../backend/src/main/java/com/gymduongdouble/backend/training/domain/PtGoal.java) với loại, mô tả, ngày, targetWeight, targetBodyFat, targetWaist, status ACTIVE và note. Những trường entity/request có thể rộng hơn những ô mà giao diện hiện đang cho nhập; khi thuyết trình cần phân biệt API có trường gì với UI thật sự hiển thị gì.

## 6. Kịch bản tự kiểm tra

1. Dùng member và package test đúng quan hệ; tạo lịch SCHEDULED cùng ngày, chọn lịch trong form rồi ghi COMPLETED. Quan sát remaining PT giảm một và lịch đổi trạng thái. Lặp với lựa chọn ghi buổi độc lập để kiểm tra nhánh không có schedule và điều kiện chống trùng.
2. Ghi MISSED rồi CANCELLED/RESCHEDULED bằng API test phù hợp: đối chiếu bảng status tiêu buổi, không giả định tất cả đều trừ.
3. Ghi PRACTICE và quan sát remaining practice; thử lại cùng ngày và gói, kiểm tra lỗi trùng.
4. Gửi measurement chỉ có ngày và không có chỉ số; đọc validator và response. Gửi ngày tương lai dù UI đã chặn để kiểm tra backend.
5. So mục tiêu với chỉ số thực đo: hai loại bản ghi có mục đích khác nhau; mục tiêu không tự thay số đo gần nhất.

## 7. Trạng thái buổi và tác động trừ định mức

Trong `PtService`, danh sách trạng thái tính tiêu buổi được khai báo:

```java
private static final List<PtSessionStatus> CONSUMING_PT_SESSION_STATUSES = List.of(
    PtSessionStatus.COMPLETED,
    PtSessionStatus.MISSED
);
```

Đây là quy tắc **đang được code áp dụng**: cả `COMPLETED` và `MISSED` thuộc nhóm tiêu buổi; `CANCELLED` và `RESCHEDULED` không thuộc danh sách này. Không tự kết luận khách vắng phải trả phí theo mọi mô hình phòng gym: đó là chính sách đang triển khai và cần được chủ phòng xác nhận khi vận hành thực tế.

Khi ghi buổi, service còn xét gói thuộc hội viên, thời hạn/hiệu lực, định mức, ngày, quyền và khả năng trùng; nếu gắn lịch phải kiểm tra lịch tương ứng. Có thể ghi buổi không gắn lịch, nên “tạo lịch” và “ghi nhận đã tập” là hai hành động khác. Đọc đầy đủ `createSessionLog`, `ensureScheduleCanBeLogged` và các method trừ buổi trước khi nói thao tác nào thay đổi lịch hay định mức.

## 8. Một ví dụ tiến trình và hai loại dữ liệu

Ví dụ giả: gói có 40 PT và 40 ôn tập. Khi ghi một buổi PT `COMPLETED` hợp lệ, dự kiến PT còn 39; sau một lượt `PRACTICE` hợp lệ, ôn tập còn 39, PT vẫn 39. Code có kiểm tra trùng ôn tập theo gói/ngày/loại hoạt động; nếu thử lần nữa cùng điều kiện phải kiểm tra response và số còn lại, không dựa vào việc nút có thể bấm.

`BodyMeasurement` lưu số đo **đã quan sát**, ví dụ 92 kg, eo 102 cm, kèm ngày đo. `PtGoal` lưu điều **mong muốn**, ví dụ 80 kg, eo 94 cm. Lưu mục tiêu không tự tạo số đo 80 kg; lưu số đo cũng không tự kết luận khách đạt mục tiêu. Code còn có những field ở DTO/entity mà form hiện tại có thể không hiển thị, vì vậy so cả API lẫn frontend trước khi khẳng định mọi field đều nhập được qua UI.

**Tự thực hành:** trên hội viên demo, ghi số đo đầu, tạo mục tiêu, ghi một buổi, tạo số đo sau đó; ở từng bước đối chiếu lịch sử, định mức, portal và ngày. Nếu thấy dữ liệu không khớp, ghi nhận API response và xác định lỗi trước khi sửa dữ liệu; đây là kịch bản, không phải kết quả đã chạy sẵn.

## 9. Bản đồ dữ liệu: một thao tác làm thay đổi bảng nào?

Đây là cách hữu ích để đọc service thay vì chỉ nhìn tên nút trên giao diện.

| Thao tác | Bản ghi chính được tạo/cập nhật | Có thay đổi số lượt không? | Có tự tạo số đo hay mục tiêu không? |
| --- | --- | --- | --- |
| Đặt lịch | Tạo `PtSchedule` với `SCHEDULED` | Không | Không |
| Ghi buổi PT `COMPLETED` hoặc `MISSED` | Tạo `PtSessionLog`; nếu chọn lịch thì cập nhật `PtSchedule.status` | Có, giảm `remainingPtSessions` | Không |
| Ghi buổi PT `CANCELLED` hoặc `RESCHEDULED` qua API | Tạo `PtSessionLog`; nếu chọn lịch thì đổi trạng thái lịch tương ứng | Không | Không |
| Điểm danh `PRACTICE` | Tạo `MemberActivityLog` | Có, giảm `remainingPracticeSessions` | Không |
| Ghi `GUIDANCE_CHECKIN` | Tạo `MemberActivityLog` | Không dùng bộ đếm PT/tự tập; kiểm soát bằng định mức guidance của membership nếu có | Không |
| Cập nhật chỉ số | Tạo `BodyMeasurement` | Không | Không |
| Thiết lập mục tiêu | Tạo `PtGoal` trạng thái `ACTIVE` | Không | Không |

Điểm cần nhớ: hệ thống không ghi đè số đo cũ hay mục tiêu cũ khi tạo bản ghi mới. Các response được sắp xếp để frontend chọn bản gần nhất cho thẻ tổng quan, còn lịch sử vẫn cần thiết để theo dõi tiến trình. Vì thế “cân nặng hiện tại” trên UI là một **cách trình bày dữ liệu gần nhất**, không phải một cột `currentWeight` trên hồ sơ hội viên.

## 10. Trạng thái buổi PT và ảnh hưởng đến định mức

`PtSessionStatus` có bốn giá trị. Điều thường gây nhầm là trạng thái log không chỉ để hiển thị: nó quyết định có gọi `usePtSession` hay không.

| Trạng thái log | Backend trừ một lượt PT? | Khi có `scheduleId`, trạng thái lịch sau lưu |
| --- | ---: | --- |
| `COMPLETED` | Có | `COMPLETED` |
| `MISSED` | Có | `MISSED` |
| `CANCELLED` | Không | `CANCELLED` |
| `RESCHEDULED` | Không | `RESCHEDULED` |

Trong [`PtSchedulePage.tsx`](../../../frontend/src/features/pt-schedule/pages/PtSchedulePage.tsx), form ghi buổi hiện gửi cố định `status: 'COMPLETED'`. Bảng trên mô tả **contract API/service**, không phải lời khẳng định UI hiện có bốn nút thao tác. Khi review, hãy tách hai câu hỏi: backend có hỗ trợ gì và người dùng hiện có thể chọn gì qua giao diện.

`PtSessionLogRequest` cho phép `sessionNumber` và `weight` là tùy chọn. Khi ghi độc lập không gắn lịch và trạng thái có tiêu buổi, service chống trùng theo `(sessionPackage, sessionNumber, status tiêu buổi)` nếu có số buổi; nếu không có số buổi, dùng `(sessionPackage, sessionDate, status tiêu buổi)`. Khi có `scheduleId`, chính schedule đã là khóa nghiệp vụ để chống ghi hai lần. Đây là lý do không được nói ngắn gọn “một khách chỉ được tập một buổi mỗi ngày” trong mọi trường hợp.

## 11. Tại sao `@Transactional` và `@Version` quan trọng ở luồng này?

`createSessionLog` và `createActivityLog` đều là transaction ghi. Một lần ghi buổi PT có thể gồm: kiểm tra gói, tạo log, thay đổi bộ đếm trong `PtSessionPackage`, và đổi trạng thái lịch. Nếu một bước ném exception trước khi transaction hoàn tất, Spring rollback các thay đổi đang quản lý trong transaction thay vì để lại log có nhưng số buổi không đổi, hoặc ngược lại.

`PtSessionPackage` có trường `@Version`. Hibernate dùng nó để phát hiện xung đột cập nhật lạc quan: hai request cùng đọc một gói cùng version, request commit sau có thể bị từ chối thay vì âm thầm ghi đè bộ đếm của request trước. Đây không phải khóa bi quan giữ database trong suốt buổi tập; nó là cơ chế phát hiện dữ liệu đã bị người khác thay đổi trước lúc ghi. Global exception handler chuyển xung đột optimistic lock thành phản hồi lỗi để client không hiểu nhầm thao tác đã thành công.

Ví dụ tư duy: gói còn 1 lượt PT. Hai màn hình cùng bấm lưu gần như đồng thời. Cả hai không được phép kết thúc bằng “gói còn -1”. Validation `remaining > 0`, transaction và version là các lớp bảo vệ khác nhau; khi test đồng thời thật sự, phải kiểm tra response của cả hai request và dữ liệu sau commit, không suy ra chỉ từ một unit test đơn luồng.

## 12. Số đo và mục tiêu: dữ liệu quan sát khác dữ liệu kỳ vọng

`BodyMeasurementRequest` bắt buộc `recordedAt` và method `hasMeasurement()` yêu cầu ít nhất một trong các chỉ số chiều cao, cân nặng, ngực, eo, bụng, mông, đùi hoặc tay. Các giá trị đã gửi phải dương theo annotation `@DecimalMin`. Service còn chặn ngày ở tương lai rồi chuyển `LocalDate` sang đầu ngày tại múi giờ `AppClock.zone()` trước khi lưu `Instant`. Vì vậy cùng một ngày chọn trên form phải được hiểu theo múi giờ ứng dụng, không phải tùy ý theo UTC của trình duyệt.

`PtGoalRequest` yêu cầu `goalType`, còn ngày bắt đầu, hạn mục tiêu và các đích số đo là tùy chọn. Nếu cả `startDate` và `targetDate` có mặt, `ensureGoalDates` không cho hạn mục tiêu trước ngày bắt đầu. Mục tiêu mới được lưu `ProgramStatus.ACTIVE`; service hiện không tự đánh dấu `COMPLETED` khi cân nặng hoặc vòng eo chạm ngưỡng. Đó là chủ ý của scope: hệ thống ghi nhận dữ liệu và cho PT/chủ phòng đánh giá, không tự đưa ra kết luận y khoa hay điều chỉnh giáo án bằng AI.

## 13. Bài tập lần vết một buổi tập hoàn chỉnh

1. Từ UI chọn học viên. Xem `selectMember`: nó đặt lại `sessionForm.scheduleId` để tránh gắn nhầm lịch của học viên trước.
2. Đặt lịch cho ngày mai. Xem request `POST /v1/pt/schedules`, sau đó kiểm tra chỉ có một `PtSchedule` mới và bộ đếm gói không đổi.
3. Sang form ghi buổi, chọn đúng gói của học viên và chọn lịch vừa tạo. Theo dõi payload có `memberId` ở path, `sessionPackageId`, `scheduleId`, `sessionDate`, `weight`, `content`, `note` và `status`.
4. Lần theo `createSessionLog`: quyền theo ngày, gói thuộc hội viên, gói còn hiệu lực, lịch khớp, chống trùng, trừ lượt, đổi trạng thái lịch, lưu log.
5. Sau khi thành công, đối chiếu bốn nơi: `sessionLogs`, `PtSessionPackage.remainingPtSessions`, `PtSchedule.status` và phần portal của chính hội viên. Nếu không chọn lịch, mục 3 vẫn có log và trừ buổi nhưng không có schedule nào đổi trạng thái.

Kỹ năng cần rút ra là đọc **invariant** (điều kiện dữ liệu luôn phải đúng), thay vì học thuộc endpoint. Ví dụ: “log chỉ được tham chiếu gói của cùng hội viên”; “một lịch chỉ có tối đa một log”; “bộ đếm không được âm”; “ngày ghi nhận không ở tương lai”. Khi thêm tính năng sau này, hãy giữ các invariant đó ở service/backend.
