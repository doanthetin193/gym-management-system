# Công nợ và phiếu thu: đọc từng bước trong backend

## 1. Hai khái niệm không được gộp

`DebtRecord` là số tiền còn phải thu cho lượt đăng ký. `Payment` là một lần đã ghi nhận thu tiền, có ngày, số tiền và phương thức. Một khoản nợ có thể được thanh toán bằng nhiều phiếu thu. Trong scope hiện tại, hệ thống theo dõi các khoản thu gắn với gói tập, không đủ dữ liệu chi phí để suy ra lợi nhuận thực tế.

Mở [`DebtRecord`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/domain/DebtRecord.java) và [`Payment`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/domain/Payment.java). `DebtRecord` có `originalAmount`, `paidAmount`, `remainingAmount`, `status`, `dueDate`, quan hệ member/membership. `Payment` ánh xạ bảng `payment_transactions`, có `paymentDate`, `amount`, `paymentMethod`, `revenueCategory`, `description`, người tạo và liên kết debt/membership/member.

## 2. Ví dụ số tiền đầy đủ

Giả sử giá bán thực tế 11.200.000, giảm 0, trả trước 5.000.000 bằng chuyển khoản:

| Bước | Gốc nợ | Đã thu | Còn nợ | Số Payment |
| --- | ---: | ---: | ---: | ---: |
| Vừa tạo lượt đăng ký và debt | 11.200.000 | 0 | 11.200.000 | 0 |
| Ghi nhận thu ban đầu | 11.200.000 | 5.000.000 | 6.200.000 | 1 |
| Thu tiếp 6.200.000 tiền mặt | 11.200.000 | 11.200.000 | 0 | 2 |

Sau thu lần đầu, debt là `PARTIALLY_PAID`; sau lần hai, `PAID`. Hai phiếu vẫn giữ hai phương thức và có thể hai ngày khác nhau, không gộp thành một phương thức. Trên membership, service cũng đồng bộ số đã thu và nợ. Trường hợp giảm giá, số phải thu ban đầu là `actualPrice - discountAmount`, không phải mặc định `defaultPrice`.

## 3. API và DTO

[`PaymentController`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/web/PaymentController.java) có `POST /api/v1/payments` và `GET /api/v1/payments` cho OWNER/PT; GET có thể lọc member, ngày và phương thức. [`DebtController`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/web/DebtController.java) có `GET /api/v1/debts`, hỗ trợ member/status. Quyền role ở controller không bỏ qua `MemberAccessService` trong `PaymentService`.

[`CreatePaymentRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/web/dto/CreatePaymentRequest.java) bắt buộc memberId, amount và method; `@DecimalMin("1.0")` với amount. `debtRecordId` và `membershipId` có thể không gửi đồng thời: logic resolve và validate trong service quyết định khoản nợ nào hợp lệ. Khi gửi trực tiếp API, `paymentDate` null được service thay bằng ngày hiện tại theo `AppClock`.

## 4. Đọc `PaymentService.create` từng dòng

Mở [`PaymentService`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/service/PaymentService.java):

1. `ensureCanAccessMember` kiểm tra quyền trên hội viên; tìm member và membership nếu có ID.
2. `resolveDebtRecord`: nếu có debtRecordId thì tìm trực tiếp; nếu không và có membership thì tìm nợ theo membership, bỏ PAID/CANCELLED và lấy bản phù hợp đầu tiên. Nếu không resolve được thì từ chối.
3. Nếu membership do request chỉ ra không thuộc member thì từ chối. `validateDebtRecord` kiểm tra nợ thuộc member, khớp membership nếu có, và chưa PAID/CANCELLED. Sau đó membership được lấy từ debt; debt không gắn membership bị từ chối.
4. Kiểm tra tiền thu không vượt `remainingAmount`. Validation ở controller cũng yêu cầu amount hợp lệ; test trực tiếp service không đi qua controller cần hiểu sự khác biệt này.
5. `inferRevenueCategory` xác định loại doanh thu dựa vào plan; `resolvePaymentDate` thay null bằng hôm nay và từ chối ngày tương lai.
6. Tạo/lưu Payment, cập nhật số đã thu, còn nợ, trạng thái debt và số trên membership. `@Transactional` đặt các thao tác database trong cùng ranh giới transaction.

Status `OPEN` khi chưa trả, `PARTIALLY_PAID` khi đã trả một phần, `PAID` khi còn nợ ≤ 0. Trong `listDebts`, filter `OPEN` bao gồm cả `PARTIALLY_PAID`; đây là ý nghĩa filter đang được code triển khai, không phải phép so sánh enum chính xác duy nhất.

## 5. Hai người thu đồng thời

`DebtRecord.version` có `@Version`, tức Hibernate dùng optimistic locking để phát hiện xung đột cập nhật cùng debt. Khi một transaction thất bại vì xung đột, đọc [`GlobalExceptionHandler`](../../../backend/src/main/java/com/gymduongdouble/backend/common/exception/GlobalExceptionHandler.java) để thấy xử lý `ObjectOptimisticLockingFailureException` thành 409. Cần kiểm thử với transaction/database thật trước khi khẳng định mọi biến thể cạnh tranh đều đã được chứng minh; annotation không thay thế kiểm thử đồng thời.

## 6. Bài tập

1. Vẽ quan hệ 1 hội viên → nhiều lượt đăng ký → khoản nợ → nhiều phiếu thu, rồi kiểm tra chính xác annotation entity thay vì chỉ dựa sơ đồ.
2. Tìm nơi chặn thu quá số nợ; tìm thêm điều kiện chặn thu cho debt đã hủy.
3. Nhập 2 lần thu khác phương thức, đối chiếu Payment và `remainingAmount` sau mỗi lần.
4. Giải thích `@Transactional`, `@Version` và `@DecimalMin` bảo vệ các vấn đề khác nhau thế nào.

## 7. Đọc luồng ghi phiếu từ mã thật

Trích `PaymentService.create`, lược bỏ phần tra cứu và kiểm tra trước đó:

```java
LocalDate paymentDate = resolvePaymentDate(request.paymentDate());

Payment payment = new Payment();
payment.setMember(member);
payment.setMembership(membership);
payment.setDebtRecord(debtRecord);
payment.setPaymentDate(paymentDate);
payment.setAmount(request.amount());
payment.setPaymentMethod(request.paymentMethod());
payment.setRevenueCategory(revenueCategory);
payment.setDescription(request.note());
payment.setCreatedBy(currentUserOrNull());

Payment savedPayment = paymentRepository.save(payment);
syncDebtAndMembership(debtRecord, membership, request.amount());
```

Trước đoạn này, service kiểm tra quyền với member; tìm khoản nợ, kiểm tra liên kết giữa member, membership và debt; kiểm tra số tiền hợp lệ; suy ra nhóm doanh thu. Đoạn trên tạo **một payment cho lần thu này**, lưu rồi cập nhật tổng liên quan trong transaction. Phương thức của lần thu được gắn với `Payment`, không phải một thuộc tính duy nhất đại diện cho mọi lần thanh toán của hội viên.

Ví dụ gói 11.200.000 đồng: lần đầu chuyển khoản 5.000.000, còn 6.200.000; sau đó thu tiền mặt 6.200.000 thì có hai phiếu riêng, mỗi phiếu có ngày/phương thức riêng. Tổng thực thu của cả hai là 11.200.000, tổng nợ còn 0. Muốn biết doanh thu của từng tháng, đặt mỗi phiếu vào tháng theo `paymentDate`; ví dụ hai phiếu khác tháng thì không dồn cả giá gói vào tháng đầu.

Lưu ý QR chỉ tạo thông tin để người dùng chuyển khoản; nhìn thấy QR không chứng minh ngân hàng đã báo giao dịch thành công. Người vận hành xác nhận thực tế rồi mới ghi phiếu. Nếu request gán khoản nợ của người khác, backend phải từ chối; thử trên hai hội viên test khác nhau để kiểm tra đúng ID, không dùng dữ liệu thật.
