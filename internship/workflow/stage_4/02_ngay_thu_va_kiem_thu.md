# Ngày thu, đối soát và kiểm thử luồng tài chính

## 1. Ba loại ngày khác nhau

- `startDate`/`endDate` của membership mô tả thời hạn tập.
- `paymentDate` của Payment mô tả ngày nghiệp vụ đã thu tiền; báo cáo thực thu cần xét ngày này.
- `createdAt` là thời điểm record được tạo trong hệ thống, có thể khác ngày thu khi nhập dữ liệu lịch sử.

Ví dụ ngày 16/10 nhập lại một khoản thực sự đã thu 15/07: paymentDate nên là 15/07, còn createdAt là thời điểm nhập vào hệ thống. Không được lấy thời điểm nhập thay cho ngày thu để tự cho rằng khoản đó thuộc doanh thu tháng 10. Trường hợp nhập sai, cần xem hệ thống có workflow sửa/xóa thực tế hay không; không tự giả định có chức năng chỉnh mọi giao dịch.

## 2. Kiểm tra từng nhánh ngày

Đọc `resolveInitialPaymentDate` trong [`MemberMembershipService`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MemberMembershipService.java) và `resolvePaymentDate` trong [`PaymentService`](../../../backend/src/main/java/com/gymduongdouble/backend/finance/service/PaymentService.java): cả hai dùng hôm nay theo `AppClock` khi input null và từ chối ngày tương lai. Ngày thu đầu tiên chỉ được resolve khi amount > 0, vì amount ≤ 0 thì không tạo phiếu thu.

Frontend dùng [`MembershipAssignmentModal`](../../../frontend/src/features/members/components/MembershipAssignmentModal.tsx), [`PaymentFormModal`](../../../frontend/src/features/payments/components/PaymentFormModal.tsx) và [`DatePartsSelect`](../../../frontend/src/shared/components/DatePartsSelect.tsx). Kiểm tra giới hạn ngày ở UI để thuận tiện, nhưng kiểm tra backend mới là ranh giới nghiệp vụ khi gọi API trực tiếp.

## 3. Từ phiếu thu đến thống kê

[`DashboardService`](../../../backend/src/main/java/com/gymduongdouble/backend/dashboard/service/DashboardService.java) và các repository tài chính là nơi cần đọc để biết từng báo cáo cộng, lọc và nhóm dữ liệu như thế nào. Đừng mặc định mọi thẻ UI đều có cùng điều kiện lọc. Khi đối soát một thẻ cụ thể: tìm API của trang, method service, khoảng ngày, trạng thái, nguồn dữ liệu và các phép cộng trước khi so với tổng hiển thị.

`Payment.revenueCategory` được suy ra từ loại plan trong service thu tiền; `Payment.paymentMethod` do người ghi nhận chọn. VietQR ở UI giúp tạo thông tin chuyển khoản, không phải bằng chứng ngân hàng tự xác nhận đã nhận tiền. Phiếu thu là kết quả của thao tác lưu khi người vận hành xác nhận, không phải chỉ vì một mã QR đã xuất hiện.

## 4. Kịch bản test local có thể lặp lại

Sử dụng hồ sơ và gói test, ghi lại ID và số dư trước khi thao tác. Không sử dụng thông tin khách thật hoặc thực hiện chuyển khoản thật chỉ để thử.

1. Tạo lượt đăng ký cần thu 11.200.000, thu ban đầu 0: kiểm tra membership có debt 11.200.000, không có phiếu thu ban đầu.
2. Với lượt khác hoặc dữ liệu test được chuẩn bị riêng, thu 5.000.000 chuyển khoản khi đăng ký: kiểm tra một Payment, nợ còn 6.200.000.
3. Thu 6.200.000 tiền mặt từ màn hình công nợ: kiểm tra hai Payment khác phương thức, nợ bằng 0 và trạng thái PAID.
4. Thử thu nhiều hơn nợ hoặc thu lại sau khi PAID: ghi status và message, xác nhận backend từ chối.
5. Nhập khoản thu lịch sử ở tháng trước: so `paymentDate`, `createdAt` và báo cáo đúng kỳ. Tránh nhập gói lịch sử chồng hạn vì service sẽ kiểm tra.
6. Gửi ngày thu tương lai trực tiếp API thử nghiệm: mong đợi lỗi 400; không chỉ kiểm tra việc date picker giới hạn lựa chọn.
7. Với tài khoản PT thử nghiệm, kiểm tra quyền theo hội viên trước khi kết luận PT có thể xem hoặc thu nợ cho mọi người.

## 5. Các câu hỏi khi trình bày với mentor

1. Vì sao đăng ký gói không đồng nghĩa đã thu đủ tiền?
2. `originalAmount`, `paidAmount`, `remainingAmount` khác gì nhau? Giảm giá được áp dụng ở bước nào?
3. Tại sao một giao dịch thực thu không nên ghi ngày tương lai?
4. Vì sao nói “doanh thu thực thu” chính xác hơn “lợi nhuận” trong phạm vi này?
5. UI hiển thị QR có đồng nghĩa hệ thống đã nhận xác nhận chuyển khoản từ ngân hàng không?

## 6. Ngày thu và ngày bắt đầu: hai trục thời gian

Method thật trong `PaymentService`:

```java
private LocalDate resolvePaymentDate(LocalDate requestedDate) {
    LocalDate paymentDate = requestedDate == null ? AppClock.today() : requestedDate;
    if (paymentDate.isAfter(AppClock.today())) {
        throw new BadRequestException("Ngày lập phiếu thu không được ở tương lai.");
    }
    return paymentDate;
}
```

`requestedDate == null` chọn ngày hiện tại theo `AppClock`; quá khứ được phép để nhập lịch sử; tương lai bị từ chối. Lưu ý cả luồng thu ngay lúc tạo gói và thu nợ sau đó đều phải kiểm tra tại service tương ứng: chỉ nhìn một method không chứng minh mọi đường ghi payment đều dùng chung method này.

Ví dụ kiểm thử: gói bắt đầu 10/06, thanh toán 5 triệu ngày 10/06 và 2 triệu ngày 05/07. Khi nhập lại đúng hai ngày thu, báo cáo tháng 6 nhận 5 triệu và tháng 7 nhận 2 triệu, không lấy ngày người dùng đang nhập dữ liệu làm ngày thu. So sánh tổng hai tháng với danh sách phiếu, không suy luận từ giá plan. Nếu trước đây chưa có dữ liệu phiếu thu chính xác thì nhập lại chỉ phản ánh thông tin mà người vận hành cung cấp, không tự kiểm chứng được giao dịch ngân hàng.

## 7. Bộ kiểm thử bằng tay gợi ý

| Trường hợp | Dữ liệu test | Mong đợi |
|---|---|---|
| Không thu khi tạo gói | Thu ngay 0 | Có đăng ký/nợ theo số phải thu, không có payment 0 đồng |
| Thu một phần | Giá phải thu 1 triệu, thu 400 nghìn | Payment 400 nghìn, còn nợ 600 nghìn |
| Thu nợ sai số | Còn 600 nghìn, nhập 700 nghìn | Bị từ chối, không phát sinh phiếu mới |
| Ngày thu tương lai | Chọn ngày sau hôm nay | Bị từ chối; kiểm tra dữ liệu không đổi |
| Hai hình thức | Chuyển khoản rồi tiền mặt | Hai payment, tổng và phương thức theo từng phiếu |
| Hai người cùng thu | Cùng khoản nợ, thao tác gần đồng thời | Kiểm tra transaction/version và response thực tế; tải lại dữ liệu |

Đây là mục tiêu kiểm thử, không phải tuyên bố tất cả đã chạy trong lượt viết tài liệu này. Dùng database test và lưu lại điều kiện trước, response, dữ liệu sau để kiểm tra.
