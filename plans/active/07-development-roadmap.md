# 07 - ROADMAP TRIỂN KHAI

## 1. Nguyên tắc triển khai

- Làm theo MVP, không làm toàn bộ phase cùng lúc.
- Ưu tiên nghiệp vụ chủ phòng cần ngay.
- Dữ liệu nguồn chuẩn trước, báo cáo sau.
- Mỗi sprint phải có kết quả demo được.
- Không làm payroll/AI/Zalo auto quá sớm.

## 2. Sprint 1 - Nền tảng

Trạng thái cập nhật ngày 22/09/2026:

- Backend Sprint 1 đã hoàn thành và kiểm thử pass 36/36 API checks.
- File kiểm thử chính: `backend/http/sprint1.http`.
- Tài liệu review: `plans/active/08-sprint-1-review.md`.
- Phần frontend của Sprint 1 chưa triển khai; sẽ bắt đầu sau khi backend core flow được chốt.

Mục tiêu:

- Có app chạy end-to-end với auth và layout cơ bản.

Backend:

- Tạo Spring Boot project.
- Cấu hình PostgreSQL.
- Cấu hình Flyway.
- Tạo users/roles/user_roles.
- Login JWT.
- Current user API.
- RBAC cơ bản.

Frontend:

- Tạo React project.
- Cấu hình Tailwind.
- Router.
- Login page.
- Layout theo role.

Done khi:

- OWNER login được.
- Route bảo vệ theo role.
- Backend/frontend chạy local.

## 3. Sprint 2 - Member và Membership

Mục tiêu:

- Thay thế phần quản lý khách/gói cơ bản trong Excel.

Backend:

- members.
- member_notes.
- membership_plans.
- member_memberships.
- API tạo/sửa/tìm member.
- API tạo/gia hạn gói.
- Logic tính hết hạn/sắp hết hạn.

Frontend:

- Member list.
- Member detail.
- Member form.
- Membership plan page.
- Renew membership flow.

Done khi:

- Tạo khách được.
- Bán/gia hạn gói được.
- Xem lịch sử gói.
- Lọc khách sắp hết hạn/hết hạn.

## 4. Sprint 3 - Finance và Dashboard

Mục tiêu:

- Số hóa thu/chi/công nợ cơ bản.

Backend:

- payments.
- financial_categories.
- financial_transactions.
- debt_records.
- Finance summary API.
- Owner dashboard API.
- Audit log cho payment/expense.

Frontend:

- OWNER dashboard.
- Payment form.
- Expense form.
- Finance page.
- Debt list.

Done khi:

- Nhập thu được.
- Nhập chi được.
- Dashboard hiển thị tổng thu/tổng chi/lợi nhuận.
- Công nợ cơ bản hoạt động.

## 5. Sprint 4 - PT MVP

Mục tiêu:

- PT cập nhật được khách, buổi tập và chỉ số.

Backend:

- pt_profiles.
- pt_assignments.
- pt_schedules cơ bản dạng list/tuần.
- pt_session_packages.
- pt_session_logs.
- member_activity_logs.
- body_measurements.
- pt_goals.
- Permission PT chỉ xem khách được gán.

Frontend:

- PT dashboard.
- My members.
- PT schedule list/tuần.
- PT member detail.
- Add session log.
- Add activity/ôn tập.
- Add body measurement.
- Goal form.

Done khi:

- OWNER gán PT cho khách.
- PT thấy khách được gán.
- OWNER/PT xem được lịch dạy cơ bản theo ngày/tuần.
- PT thêm session/body measurement.
- Số buổi còn lại cập nhật đúng.

## 6. Sprint 5 - Public TikTok Exercise Library

Mục tiêu:

- Xây dựng thư viện video bài tập public bằng TikTok để khách, người xem bên ngoài và học viên đều xem/chia sẻ được.
- Tập trung tăng giá trị hướng dẫn kỹ thuật và kéo tương tác về kênh TikTok của phòng gym.
- Không làm Training Program theo tuần, không làm khóa học/LMS, không phân quyền VIP/premium ở sprint này.

Backend:

- exercise_categories.
- exercises.
- TikTok video URL/video id.
- Public read API cho thư viện.
- Owner/admin write API để thêm/sửa/xuất bản video.
- View count cơ bản nếu cần thống kê mức độ quan tâm.

Frontend:

- Public exercise library page.
- Filter theo nhóm cơ/chủ đề, cấp độ, từ khóa.
- Exercise/video detail page.
- TikTok embed hoặc nút mở TikTok nếu embed không khả dụng.
- Nút copy link/chia sẻ để gửi cho học viên qua Zalo/Facebook.
- Owner/admin exercise management page.

Done khi:

- Người dùng không cần đăng nhập vẫn xem được thư viện bài tập public.
- Owner thêm/sửa/xuất bản được bài tập bằng link TikTok.
- Hệ thống tự nhận diện/lưu thông tin TikTok cần thiết từ URL.
- Xem được preview/video TikTok hoặc fallback mở TikTok trong tab mới.
- Copy/chia sẻ link từng bài tập được.

## 7. Sprint 6 - Business Goals và báo cáo vận hành

Mục tiêu:

- Số hóa mục tiêu tháng và báo cáo vận hành.

Backend:

- business_goals.
- notifications cơ bản cho sắp hết hạn, sinh nhật, công nợ, khách PT còn ít buổi.
- Goal progress API.
- Finance monthly/yearly report.
- Expiring/birthday/debt report.
- New vs renewed/returning member monthly report.
- Chuẩn hóa category mục tiêu: tài chính, khách tự tập, khách Giáo án/Hướng Dẫn, khách PT mới, khách PT chính.

Frontend:

- Business goals page.
- Notification list/unread count cơ bản.
- Monthly progress view.
- Finance report page.
- Report filters.

Done khi:

- OWNER tạo mục tiêu tháng.
- Hệ thống hiển thị actual/progress.
- Xem báo cáo tài chính theo tháng/năm.
- Các nhóm mục tiêu trong Excel được biểu diễn được trên UI, kể cả nhóm chưa tự tính thì nhập actual thủ công được.

## 8. Sprint 7 - Production Hardening và Deploy

Mục tiêu:

- Chuẩn bị deploy production trên VPS và làm chắc các flow chính.

Backend:

- Global exception handler.
- Validation đầy đủ.
- Audit log hoàn thiện.
- Index database.
- Actuator health.

DevOps:

- Docker Compose.
- Nginx.
- Production env.
- Backup script.
- Deploy VPS.

Frontend:

- Error state.
- Empty state.
- Loading state.
- UI polish các flow chính.

Done khi:

- Hệ thống deploy trên VPS.
- Backup chạy được.
- Smoke test pass.

## 9. Phase 2 sau MVP

- PT schedule nâng cao.
- Export Excel/PDF.
- Notification nâng cao.
- Báo cáo tiến độ khách PT.
- Import dữ liệu Excel/CSV nếu sau này chủ phòng đổi nhu cầu và muốn nhập lịch sử cũ.

## 10. Phase 3

- HR/chấm công PT nếu chủ phòng cần.
- Báo cáo doanh số/hoa hồng theo PT, không làm role lễ tân riêng khi phòng vẫn không có lễ tân.
- Payroll PT.
- Salary periods.
- Salary items.
- Commission rules.
- Thưởng/phạt.
- Duyệt lương.
- Công thức lương dạy: `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale: `10% * số tiền khách đã thanh toán`.

## 11. Phase 4

- AI/analytics.
- PT Progress Analysis.
- PT Drop-off Risk.
- Customer Segmentation.
- Revenue Forecasting.

## 12. Thứ tự ưu tiên nếu thiếu thời gian

Giữ lại:

1. Auth.
2. Member.
3. Membership/renewal.
4. Payment/finance basic.
5. OWNER dashboard.
6. PT session.
7. Body measurement.

Có thể hoãn:

1. Business goals.
2. Training program weekly.
3. Payroll PT.
4. Premium content nâng cao.
5. Notification nâng cao.

## 13. Tiêu chí MVP đạt yêu cầu

MVP đạt khi:

- OWNER quản lý được khách/gói/gia hạn.
- OWNER xem được khách hết hạn/sắp hết hạn.
- OWNER nhập được thu/chi.
- Dashboard có số liệu chính.
- PT cập nhật được buổi tập/chỉ số.
- Public TikTok exercise library xem/chia sẻ được.
- App deploy được trên VPS.
