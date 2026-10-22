# Dashboard, báo cáo và nhắc việc

## 1. Bắt đầu từ API, không bắt đầu từ màu của thẻ

[`DashboardController`](../../../backend/src/main/java/com/gymduongdouble/backend/dashboard/web/DashboardController.java) áp dụng role OWNER cho toàn class. Các GET gồm `/v1/dashboard/owner`, `/v1/reports/finance`, `/v1/reports/members`, `/v1/notifications`. Tham số năm/tháng tùy chọn được `@Validated` kiểm tra phạm vi. Các đường dẫn trên có context `/api` khi gọi local.

[`DashboardService`](../../../backend/src/main/java/com/gymduongdouble/backend/dashboard/service/DashboardService.java) lấy dữ liệu từ membership, member, payment, debt, session package; trả các DTO trong `dashboard/web/dto`. Frontend ở [`DashboardPage.tsx`](../../../frontend/src/features/dashboard/pages/DashboardPage.tsx), [`ReportsPage.tsx`](../../../frontend/src/features/reports/pages/ReportsPage.tsx) và [`RemindersPage.tsx`](../../../frontend/src/features/reminders/pages/RemindersPage.tsx). Trang nhắc việc có cả xử lý frontend, nên không nên mặc định mỗi dòng nhắc của UI đều đến trực tiếp từ một database table notifications.

## 2. Doanh thu theo kỳ

`financeReport(year, month)`: nếu có tháng thì dùng `YearMonth` để lấy ngày đầu/cuối, gọi `revenueBetween`; nếu không có tháng, tạo 12 dòng theo năm và cộng tổng. `revenueBetween` gọi `paymentRepository.sumAmountByPaymentDateBetween(start, end)`. Do đó đây là tổng tiền `Payment` theo ngày thu trong khoảng, không phải tổng giá trị gói đã đăng ký và không phải lợi nhuận sau chi phí.

Nếu phiếu 5 triệu có paymentDate tháng 7 nhưng được nhập vào tháng 10, kiểm tra repository và báo cáo tháng 7. Để kiểm tra đúng, đối chiếu paymentDate và phạm vi truy vấn; đừng lấy thời điểm createdAt làm kỳ doanh thu. Nếu chọn năm nhưng không chọn tháng, service trả 12 dòng chứ không mặc định chỉ sáu tháng; frontend có thể chọn sáu dòng để vẽ.

## 3. Số hội viên: xem cách mỗi chỉ số được tính

`ownerDashboard` lấy `memberRepository.count()` cho tổng member; dùng `currentMembershipsByMember` và `isEffective(today)` cho số có gói hiệu lực; lấy công nợ mở từ `openDebts`. Vì các chỉ số có điều kiện khác nhau, tổng member không nhất thiết bằng tổng một vài nhóm trạng thái hiển thị. Đọc DTO và query trước khi tự chia nhóm.

`memberReport` dùng [`MembershipPeriodStatistics`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MembershipPeriodStatistics.java) để đếm khách mới/gia hạn. Policy bỏ lượt CANCELLED, nhóm mọi lượt theo member, sắp theo ngày bắt đầu và ID, sau đó đếm member phân biệt: lượt đầu thuộc kỳ là khách mới, lượt sau thuộc kỳ là gia hạn. Dashboard và AI gọi cùng policy nên hai nơi cùng quy tắc; một member có thể nằm trong cả hai nhãn nếu mua lần đầu rồi gia hạn tiếp ngay trong tháng. Trong cùng report, số sắp hết hạn/hết hạn lại dựa trên **ngày hôm nay** và `currentMembershipsByMember`, không phải snapshot lịch sử cuối tháng đã chọn. Đây là phân biệt rất quan trọng khi thuyết trình báo cáo các tháng cũ.

`currentMembershipsByMember` lọc member ACTIVE và membership chưa CANCELLED, nhóm theo member rồi gọi `preferredMembership(today)`: ưu tiên gói hiện tại, gói tương lai gần, sau đó gói hết hạn gần. Đọc stage 3 để hiểu sự khác nhau giữa effective status và `isEffective`.

## 4. Nhắc việc được tổng hợp thế nào?

`notifications()` ghép bốn nhóm: membership sắp hết hạn trong ngưỡng 7 ngày, sinh nhật của member ACTIVE, nợ còn mở và gói PT còn ít buổi với ngưỡng 2. Sau đó sắp theo `dueDate`, đưa null về cuối. Những dòng này là kết quả tính từ dữ liệu hiện có, không có nghĩa hệ thống tự gửi Zalo hoặc tự động liên hệ khách.

`MemberReportResponse.expiringSoon` và logic nhắc hạn dùng số ngày theo code; để phân biệt đúng ranh giới ngày cuối cùng, đọc các so sánh `isBefore`/`isAfter` và test với ngày cố định. Với lịch sử, `AppClock.today()` làm kết quả phụ thuộc ngày chạy.

## 5. Thực hành đối soát

1. Liệt kê phiếu thu test theo `paymentDate`; cộng tay một tháng và so `financeReport`.
2. Có một member gói đang tập và một gói tương lai: theo dõi gói được policy chọn hôm nay.
3. Chọn tháng cũ, phân biệt số membership bắt đầu trong kỳ với số đang/sắp hết hạn tính hôm nay.
4. Tạo khoản nợ còn dư ở dữ liệu test và đối chiếu danh sách notification. Không đánh đồng số khoản nợ với số khách nợ.
5. So API report với logic frontend trước khi giải thích nhãn bất kỳ trên biểu đồ.

## 6. Lần từ tháng báo cáo xuống phép cộng database

Trích `DashboardService.financeReport` và helper, bỏ các dòng dựng response khác:

```java
YearMonth period = YearMonth.of(resolvedYear, month);
BigDecimal revenue = revenueBetween(period.atDay(1), period.atEndOfMonth());

private BigDecimal revenueBetween(LocalDate start, LocalDate end) {
    return paymentRepository.sumAmountByPaymentDateBetween(start, end);
}
```

Hai đoạn trên đến từ hai vị trí khác nhau của file, không phải một method hoàn chỉnh. `YearMonth` giúp xác định ngày đầu/cuối tháng, kể cả tháng 2; helper yêu cầu repository tổng hợp theo **ngày phiếu thu**. Muốn xác nhận biên bao gồm ngày đầu/cuối, đọc query repository chứ không chỉ đoán từ tên method.

Giả sử phiếu 5 triệu ngày 30/09 và phiếu 6 triệu ngày 01/10: báo cáo tháng 9 và 10 dựa trên từng phiếu, không chuyển toàn bộ giá gói sang ngày đăng ký. `BigDecimal` tránh dùng `double` cho tiền; `reduce(BigDecimal.ZERO, BigDecimal::add)` là phép cộng các giá trị. Khoản nợ còn mở không tự là tiền đã thu; doanh thu không phải lợi nhuận sau chi phí.

## 7. Nhận diện mẫu số và thời điểm

Khi thấy “hội viên đang tập”, hỏi: đếm hồ sơ active hay gói có hiệu lực? Khi thấy “3 khoản nợ”, hỏi: ba `DebtRecord` hay ba người? Với báo cáo kỳ cũ, phân biệt số tính theo kỳ đăng ký/payment và tình trạng lấy theo ngày hiện tại. Đọc từng response DTO và phương thức xây nó; cùng chữ “tháng” không bảo đảm mọi chỉ số là snapshot cuối tháng.

Để tự kiểm thử, tạo phiếu demo ở hai tháng khác nhau, một khoản nợ chưa thu và một lượt đăng ký tương lai; so report với danh sách bản ghi. Ghi công thức, thời điểm và bộ lọc của từng chỉ số trước khi nhận xét sự chênh lệch.

## 8. Đọc `DashboardService` theo từng câu hỏi nghiệp vụ

`DashboardController` gom bốn endpoint OWNER-only: `/v1/dashboard/owner`, `/v1/reports/finance`, `/v1/reports/members` và `/v1/notifications`. Các query parameter `year`/`month` được Bean Validation giới hạn năm 2020–2100 và tháng 1–12. Nếu không truyền, `resolvePeriod` dùng tháng hiện tại của `AppClock.today()`.

| Câu hỏi trên UI | Method/nguồn chính | Ý nghĩa đúng |
| --- | --- | --- |
| Doanh thu tháng là bao nhiêu? | `revenueBetween` -> `PaymentRepository.sumAmountByPaymentDateBetween` | Tổng phiếu thu theo **ngày thu tiền**, không phải tổng giá niêm yết gói. |
| Còn bao nhiêu công nợ? | `openDebts()` | `DebtRecord` `OPEN`/`PARTIALLY_PAID` có `remainingAmount > 0`. |
| Có bao nhiêu khách đang tập? | `currentMembershipsByMember()` + lifecycle policy | Mỗi member active chọn membership ưu tiên tại ngày hiện tại; không đơn giản đếm tất cả membership `ACTIVE` trong database. |
| Sắp hết hạn/hết hạn? | membership ưu tiên của từng member | So sánh `endDate` với hôm nay; sắp hết hạn trong tối đa 7 ngày. |
| Khách mới/gia hạn kỳ báo cáo? | `MembershipPeriodStatistics` | Thống kê theo khoảng start/end của kỳ, cần đọc policy để hiểu quy tắc phân loại. |

`currentMembershipsByMember()` nhóm membership theo `memberId`, bỏ membership `CANCELLED` và hội viên không `ACTIVE`, sau đó gọi `preferredMembership`. Đây là phần bảo vệ trường hợp khách mua gia hạn trước: hệ thống ưu tiên gói hiệu lực hôm nay thay vì vô tình lấy gói tương lai có `endDate` xa nhất rồi làm khách đang tập biến mất khỏi thống kê.

## 9. Notification là danh sách gợi ý, không phải hàng đợi gửi tin

`notifications()` tạo bốn loại bằng code mỗi lần endpoint được gọi: `EXPIRING_MEMBERSHIP`, `BIRTHDAY`, `OPEN_DEBT`, `LOW_PT_SESSIONS`. Chúng không được lưu thành bảng notification, không có cờ “đã gửi” bền vững và không kích hoạt Zalo/SMS/email. Field `read=false` trong `NotificationResponse` hiện là dữ liệu response, không phải workflow đọc/đánh dấu đã xử lý.

Ngưỡng hiện có là 7 ngày cho gói sắp hết hạn/sinh nhật và 2 buổi cho PT sắp cạn. Gói PT lọc `SessionPackageStatus.ACTIVE`, hội viên active và lifecycle policy hiệu lực hôm nay. Những ngưỡng này là hằng số trong `DashboardService`, không phải setting mà Owner đang chỉnh được trên UI.

Khi mentor hỏi “hệ thống có tự gửi nhắc không?”, câu trả lời đúng là: hệ thống **tổng hợp danh sách cần chú ý**; trang Nhắc việc soạn nội dung và hỗ trợ sao chép/mở Zalo thủ công. Không được gọi đây là scheduler hay marketing automation.

## 10. Vì sao số dashboard, ReportsPage và danh sách chi tiết có thể khác cách đếm?

Backend Owner Dashboard và báo cáo thành viên có contract rõ ràng. [`ReportsPage.tsx`](../../../frontend/src/features/reports/pages/ReportsPage.tsx) còn tải danh sách hội viên, gói, nợ và payment để dựng bảng, biểu đồ 6 tháng, tỷ trọng phương thức thu và export. Một vài khối presentation tự phân loại dựa trên `endDate` và dữ liệu list để hiển thị nhanh.

Vì vậy khi đối chiếu chênh lệch phải hỏi khối UI đang dùng nguồn nào, không mặc định tất cả nhãn “đang tập” trên mọi widget gọi cùng endpoint. Cách debug chuẩn:

1. Mở Network, ghi response `ownerDashboard`, `memberReport`, `financeReport`.
2. Xác định widget lấy state nào trong `ReportsPage`.
3. Đối chiếu ngày local frontend với `AppClock.today()` backend.
4. Kiểm tra gói mua trước, membership bị hủy, member inactive và payment có ngày thu cũ.

Đây không phải lý do để sửa số bằng tay ở UI. Hãy sửa policy/source nếu phát hiện sai nghiệp vụ, rồi để mọi màn hình dùng contract phù hợp.

## 11. Những giới hạn chủ động của báo cáo tài chính

Hệ thống chỉ quản lý dòng **thu từ khách hàng** qua `Payment` và các khoản phải thu qua `DebtRecord`. Không có transaction `EXPENSE`, form nhập chi phí, lợi nhuận sau chi phí, lương PT hoặc phân bổ hoa hồng. Vì thế phải gọi chỉ số là “doanh thu hệ thống/tiền đã thu”, không gọi là “lợi nhuận”.

Khoản nợ cũng không phải tiền âm. Nó là nghĩa vụ thanh toán còn lại của một lượt đăng ký; khi tạo phiếu thu mới, `PaymentService` đồng bộ paid/remaining/status trong transaction. Bảng báo cáo có thể hiển thị công nợ cùng doanh thu để chủ phòng ưu tiên thu, nhưng không được trừ công nợ khỏi doanh thu đã thu để tạo ra một “lợi nhuận” không có cơ sở.

## 12. Bài tập review

1. Tạo một membership tương lai cho khách vẫn còn gói hiện tại; đọc `preferredMembership` và quan sát dashboard không làm mất khách đang hoạt động.
2. Tạo hai phiếu thu cho cùng membership ở hai tháng khác nhau; so sánh finance report từng tháng với giá gói.
3. Để gói PT còn 2 lượt; kiểm tra notification. Ghi thêm buổi để còn 1 lượt và xác nhận nguyên tắc vẫn theo bộ đếm gói/lifecycle.
4. Đánh dấu một member inactive và quan sát điều gì còn/không còn ở dashboard, report và notification. Ghi lại đúng API nào đã lọc chứ không chỉ ảnh chụp UI.
