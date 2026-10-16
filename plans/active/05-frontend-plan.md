# 05 - Kế Hoạch Frontend

Cập nhật lần cuối: 16/10/2026.

Tài liệu này mô tả giao diện đã được implement. Frontend là ứng dụng React SPA, phục vụ local development qua Vite và gọi backend REST tại http://localhost:8080/api.

## 1. Stack và nguyên tắc

- React 19, TypeScript, Vite 8, React Router 7, Axios, Tailwind CSS 4 và Lucide React.
- AppShell cung cấp sidebar, header, theme và điều hướng theo role.
- Trang được lazy-load theo feature.
- Mỗi form hiển thị loading, validation, lỗi API và trạng thái submit.
- API client tự động gắn Bearer token, xử lý 401 và hiển thị lỗi rate-limit có Retry-After.
- Ngày nghiệp vụ dùng DatePartsSelect và helper local date để tránh lệch ngày UTC.
- Không dùng state management library, React Query, React Hook Form hay Zod trong code hiện tại.

## 2. Route thực tế

| Route | Quyền | Màn hình |
| --- | --- | --- |
| / | Public | Trang giới thiệu, thông tin liên hệ và bảng giá. |
| /exercises | Public | Thư viện TikTok public. |
| /exercises/:slug | Public | Chi tiết video/bài tập. |
| /login | Public only | Đăng nhập. |
| /my-progress | MEMBER | Portal tiến độ cá nhân. |
| /dashboard | OWNER | Tổng quan vận hành. |
| /members | OWNER, PT | Danh sách hội viên. |
| /members/:memberId | OWNER, PT | Hồ sơ hội viên, gói, thu tiền và Portal. |
| /membership-plans | OWNER, PT | Xem bảng giá; thao tác quản trị chỉ hiện với OWNER. |
| /payments | OWNER, PT | Thanh toán và công nợ. |
| /reminders | OWNER, PT | Nhắc việc. |
| /reminders/:type | OWNER, PT | Nhắc việc theo nhóm. |
| /reports | OWNER | Báo cáo và AI Advisor. |
| /pt-schedule | OWNER, PT | Lịch PT và vận hành học viên PT. |
| /owner/exercises | OWNER | Quản lý thư viện TikTok. |
| /settings | OWNER | Tài khoản nhân sự và VietQR. |
| /profile | Authenticated | Hồ sơ đăng nhập và đổi mật khẩu. |

RoleGuard chặn route ở frontend; backend vẫn là lớp quyết định quyền cuối cùng.

## 3. Luồng giao diện OWNER

### Dashboard

- KPI hội viên, doanh thu, công nợ, nhắc việc và lịch PT cần xử lý.
- Không hiển thị chi phí, lợi nhuận hay mục tiêu vận hành.

### Hội viên và chi tiết hội viên

- Tìm kiếm, lọc đang tập/sắp hết hạn/hết hạn.
- Form tạo và sửa hồ sơ.
- Modal đăng ký/gia hạn gói tách rõ ngày bắt đầu gói và ngày thu tiền.
- Khi thu ngay bằng 0, frontend vô hiệu hóa ngày thu và phương thức thu để người dùng biết không có phiếu thu được tạo.
- Modal thu nợ lập phiếu thu riêng, hỗ trợ trả từng phần và phương thức thu riêng.
- OWNER cấp và quản lý Portal ngay trên hồ sơ hội viên.

### Bảng giá, thanh toán và báo cáo

- Bảng giá phân biệt gói đang bán và gói đã ngừng bán.
- Payments hiển thị công nợ, phiếu thu, VietQR và thao tác thu nợ.
- Reports hiển thị chỉ số tài chính, biểu đồ doanh thu, XLSX, Google Sheet và AI Cố vấn Giữ chân và Doanh thu.
- Xuất XLSX được tạo ở trình duyệt từ dữ liệu report; không có endpoint export riêng.
- Apps Script URL và token Google Sheet được lưu trong localStorage của trình duyệt hiện tại, không lưu ở backend.

### Cài đặt và thư viện

- Settings quản lý tài khoản PT/nhân sự và VietQR.
- Owner Exercises quản lý category, TikTok URL, thông tin bài tập và trạng thái hiển thị.

## 4. Luồng giao diện PT

PT dùng cùng AppShell nhưng không thấy trang OWNER như Dashboard, Reports, Settings và quản lý thư viện.

### Hội viên

- PT thao tác hồ sơ trong phạm vi backend cho phép.
- PT không thấy màn hình quản lý tài khoản Portal hay thông tin tài chính của PT.

### Lịch PT

Trang pt-schedule có năm khu vực rõ ràng:

1. Khách PT: tổng quan gói, buổi còn lại, lịch hẹn, ghi chú và tiến độ.
2. Lịch dạy: đặt/xóa/đổi lịch và kiểm tra trùng giờ.
3. Ghi buổi tập: ghi buổi PT đã diễn ra hoặc tự ôn tập; chỉ bước này mới trừ buổi.
4. Chỉ số: ghi đo lường định kỳ.
5. Mục tiêu: tạo mục tiêu theo loại, mô tả, hạn, cân nặng mục tiêu và vòng eo mục tiêu.

Khi đổi học viên ở cột trái, form lịch dạy được đồng bộ sẵn theo đúng học viên được chọn.

## 5. Luồng giao diện MEMBER

Portal my-progress có chế độ chỉ đọc:

- Thông tin cơ bản và nút đổi mật khẩu.
- Gói hiện tại, hạn gói, công nợ và buổi còn lại.
- Biểu đồ/lịch sử số đo cơ thể được PT nhập.
- Mục tiêu hiện tại và tiến độ cân nặng/vòng eo khi có đủ dữ liệu.
- Lịch PT sắp tới và lịch sử gói/thanh toán.
- Liên hệ Zalo phòng gym.

Portal không hiển thị hay thu thập giáo án tự động, không cho mua gói, thu nợ hay sửa dữ liệu PT.

## 6. Public experience

- Trang chủ là web giới thiệu và bảng giá.
- Thư viện TikTok có lọc và trang chi tiết bài tập.
- Video được nhúng để xem, không hiển thị view count hay thống kê TikTok.

## 7. Quy tắc UI quan trọng

- Giấy phép nghiệp vụ không chỉ dựa vào UI. Các nút có thể bị ẩn/disabled để hướng dẫn người dùng, nhưng backend luôn kiểm tra lại.
- Dữ liệu không có giá trị được hiển thị bằng trạng thái rỗng rõ ràng, không giả lập số liệu.
- Trạng thái gói, công nợ và buổi còn lại được tải lại từ API sau thao tác thành công.
- Lỗi API dùng message từ backend nếu có; lỗi hệ thống dùng thông điệp ngắn gọn để tránh gây nhiễu.
- Đây là UI desktop-first có responsive, không phải mobile native app.

Tài liệu đối chiếu hiện trạng chi tiết: 08-current-implementation-alignment.md.
