# Stage 6: Portal, tài khoản nhân sự, thư viện và cài đặt

1. [Portal hội viên và quyền xem dữ liệu của chính mình](01_portal_hoi_vien.md)
2. [Tài khoản nhân sự và cấu hình VietQR](02_nhan_su_va_vietqr.md)
3. [Thư viện bài tập và video TikTok](03_thu_vien_bai_tap.md)

## Cách học stage này

Ba nhóm chức năng trong stage 6 đều chạm vào `User`, nhưng mục đích hoàn toàn khác nhau. Portal hội viên là màn hình tự xem dữ liệu cá nhân; quản lý nhân sự tạo tài khoản `OWNER`/`PT` để vận hành; VietQR chỉ là cấu hình thông tin nhận tiền; thư viện bài tập là nội dung công khai do chủ phòng quản lý. Đừng gom chúng thành “một module user” rồi bỏ qua các giới hạn quyền rất khác nhau.

Khi đọc, hãy luôn trả lời bốn câu: ai được gọi endpoint, ID nào được lấy từ JWT, service tra bản ghi theo khóa nào, và dữ liệu nào frontend chỉ hiển thị chứ không được quyền sửa. Đây là cách nhanh nhất để nhận ra một chức năng là read-only thật sự hay chỉ bị ẩn nút ở giao diện.
