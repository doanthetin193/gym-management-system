# 02 - KIẾN TRÚC HỆ THỐNG

## 1. Mục tiêu kiến trúc

Kiến trúc phải phù hợp với phòng gym nhỏ, dễ triển khai và dễ bảo trì.

Ưu tiên:

- Đơn giản.
- Sẵn sàng mở rộng lên production ở phase sau.
- Chạy local dev ổn định cho phạm vi đồ án hiện tại.
- Dễ backup.
- Có module rõ để mở rộng.
- Không over-engineer.

## 2. Kiến trúc tổng thể

```text
Browser
  |
Vite React Dev Server
  |
  |-- Browser
  |
  |-- /api -> Spring Boot Modular Monolith
                  |
                  -> PostgreSQL local
```

## 3. Lý do chọn Modular Monolith

Không chọn microservices vì:

- Quy mô phòng gym nhỏ.
- Traffic không lớn.
- Team triển khai nhỏ.
- Microservices tăng chi phí deploy/monitoring.

Modular monolith vẫn đảm bảo:

- Một backend dễ đóng gói/deploy sau này.
- Module theo domain.
- Dễ tách module sau này nếu thật sự cần.

## 4. Stack kỹ thuật

Frontend:

- React.
- TypeScript.
- Tailwind CSS.
- React Router.
- TanStack Query.
- React Hook Form + Zod.
- Recharts.

Backend:

- Java 21.
- Spring Boot 3.
- Spring Security.
- Spring Data JPA.
- Bean Validation.
- Flyway dependency được giữ cho tư duy migration/phase sau, dev hiện dùng Hibernate `ddl-auto:update`.

Database:

- PostgreSQL.

Deploy:

- Chưa thuộc phạm vi hiện tại.
- Local dev dùng Vite + Spring Boot + PostgreSQL.
- Docker/Nginx/VPS/Cloudflare để phase sau.

## 5. Module backend

```text
auth
user
member
membership
finance
pt
training
exercise
dashboard
common
```

## 6. Boundary từng module

### `auth`

Trách nhiệm:

- Login.
- Logout.
- Password hashing.
- Current user.

MVP hiện tại dùng JWT access token. Refresh token để phase sau nếu triển khai production.

Không xử lý nghiệp vụ member/PT.

### `user`

Trách nhiệm:

- User account.
- Role.
- Mapping user với PT/member.

### `member`

Trách nhiệm:

- Hồ sơ khách.
- Ghi chú khách.
- Sinh nhật.
- Tìm kiếm/lọc.

Không xử lý gia hạn hoặc payment trực tiếp.

### `membership`

Trách nhiệm:

- Gói tập.
- Đăng ký/gia hạn.
- Lịch sử gói.
- Tính hết hạn/sắp hết hạn.
- Cấu hình loại gói: Tự tập, PT, Giáo án/Hướng Dẫn.
- Cấu hình cấp PT trong gói PT: PT chính hoặc PT mới.
- Cấu hình số buổi PT, số buổi Ôn tập và số buổi check-in Giáo án.

Khi bán/gia hạn gói có thể gọi `finance` để tạo payment.

### `finance`

Trách nhiệm:

- Payment.
- Công nợ.
- Tính doanh thu thực thu từ các payment gắn với gói tập.

Không lưu bảng tổng doanh thu riêng; báo cáo tổng hợp trực tiếp từ `payments.payment_date`.

### `pt`

Trách nhiệm:

- PT profile.
- Gán PT.
- Lịch dạy.
- Gói PT.
- Buổi PT.
- Activity/ôn tập.
- Check-in Giáo án/Hướng Dẫn.
- Body measurement.

### `training`

Trách nhiệm:

- Goal.
- Body measurement/progress support.
- Không triển khai Training Program theo tuần trong Sprint 5.
- Nếu sau này cần giáo án cá nhân hóa theo tuần thì mở phase riêng.

### `exercise`

Trách nhiệm:

- Nhóm bài tập.
- Bài tập/video hướng dẫn public.
- TikTok video URL/video id.
- Hỗ trợ chia sẻ link để kéo tương tác TikTok/phễu marketing.
- Không upload/stream video bằng VPS.

### `dashboard`

Trách nhiệm:

- Tổng hợp số liệu cho OWNER/PT/MEMBER.
- Không sở hữu dữ liệu nguồn.

### Nhắc việc động

Trách nhiệm:

- Nhắc hết hạn.
- Sinh nhật.
- Công nợ.
- Khách PT còn ít buổi.
- Không sở hữu bảng riêng trong MVP; dữ liệu được tính động trong dashboard/reminders từ các bảng nguồn.

## 7. Luồng nghiệp vụ quan trọng

### 7.1 Bán/gia hạn gói

```text
OWNER chọn member
  -> chọn membership plan
  -> tạo member_membership
  -> tạo payment nếu có trả tiền
  -> tạo debt nếu chưa trả đủ
  -> nếu plan_type = PT thì tạo pt_session_package
  -> nếu plan_type = GUIDANCE thì check-in sau này ghi qua member_activity_logs theo membership_id
  -> dashboard cập nhật doanh thu/công nợ
```

### 7.2 Theo dõi hết hạn

```text
member_memberships.end_date
  -> tính days_until_expiration
  -> phân loại active/sắp hết hạn/hết hạn
  -> dashboard + reminders/notification response động
```

### 7.3 Ghi nhận buổi PT

```text
PT chọn khách
  -> thêm session log
  -> cập nhật used/remaining sessions
  -> ghi cân nặng/ghi chú
  -> dùng cho progress report
```

### 7.4 Ghi nhận tiền gói tập

```text
Membership + DebtRecord
  -> Payment theo ngày thu thực tế
  -> giảm công nợ
  -> dashboard/báo cáo doanh thu
```

## 8. Phân quyền dữ liệu

OWNER:

- Toàn quyền.

PT:

- Chỉ xem khách được gán.
- Chỉ cập nhật session/body measurement cho khách được gán.
- Không xem toàn bộ tài chính.

MEMBER:

- Chỉ xem dữ liệu của chính mình.
- Không xem dữ liệu khách khác.

## 9. Xử lý báo cáo

Báo cáo ưu tiên tính từ dữ liệu nguồn:

- Doanh thu thực thu: tổng `payments.amount` theo `payments.payment_date`.
- Công nợ: từ `debt_records.remaining_amount` ở trạng thái OPEN/PARTIALLY_PAID.
- Khách sắp hết hạn: từ `member_memberships.end_date`.
- Tiến độ PT: từ `pt_session_logs`, `member_activity_logs`, `body_measurements`, `pt_goals`.

Quy tắc tài chính:

- `payments` là bảng nghiệp vụ ghi tiền khách trả.
- Mỗi payment phải gắn với một lượt đăng ký gói và khoản công nợ tương ứng.
- Dashboard/báo cáo tổng hợp trực tiếp từ `payments`, tránh lưu trùng cùng một khoản thu ở nhiều bảng.
- Chi phí vận hành và lợi nhuận nằm ngoài scope MVP.

Nếu performance cần, có thể thêm snapshot/cache sau.

## 10. Scheduler

MVP hiện tại chưa dùng scheduler. Nhắc việc và cảnh báo được tính động khi OWNER/PT mở dashboard/reminders. Scheduler để phase sau nếu cần gửi thông báo tự động.

## 11. Media

Video:

- Sprint 5 chỉ dùng TikTok URL/video id.
- Database lưu URL, video id/thumbnail nếu có.
- Frontend ưu tiên TikTok embed; nếu embed không khả dụng thì hiển thị nút mở TikTok.
- Không stream video bằng VPS.

Ảnh:

- MVP có thể lưu URL ngoài hoặc local upload.
- Phase sau có thể dùng Cloudinary/S3-compatible storage.

## 12. Logging và audit

Cần audit:

- Tạo/sửa member.
- Gia hạn gói.
- Ghi/sửa payment.
- Sửa session PT.
- Sửa payroll sau này.

## 13. Khả năng mở rộng

Sau MVP có thể thêm:

- Import Excel/CSV nếu sau này chủ phòng muốn nhập dữ liệu cũ; MVP hiện tại bắt đầu bằng dữ liệu mới.
- Payroll.
- Export PDF/Excel.
- AI scoring batch.
- RAG chatbot.
- Payment online.

## 14. Cập nhật kiến trúc theo implementation hiện tại

Tài liệu chốt hiện trạng sau nâng cấp UI nằm tại `plans/active/10-current-implementation-alignment.md`.

Điều chỉnh kiến trúc hiện tại:

- `user` module dùng `TeamUserController/TeamUserService` để OWNER quản lý tài khoản PT, không còn naming `StaffUser`.
- `member` module có thêm `MemberAccessService` để gom rule phân quyền dữ liệu theo OWNER/PT/MEMBER.
- `member` module có thêm `MemberPortalService` và `MemberPortalController` cho portal hội viên.
- `common` module có thêm `VietQrSettingService`, `SettingsController`, `PublicSettingsController` để tách cấu hình OWNER và cấu hình public read-only.
- `dashboard` module gom dashboard OWNER, finance/member reports và notification response tính động.
- `reports` xuất `.xlsx` và Google Sheet sync nằm ở frontend, dùng dữ liệu từ report API thay vì backend export file.
- `exercise` module chỉ xử lý TikTok public library, không còn module training program/LMS trong scope hiện tại.
- `pt` module là nơi xử lý assignment, schedule, session log, activity log, body measurement và goal.

Các module để phase sau:

- Audit log persistence riêng.
- Notification persistence/scheduler nâng cao.
- Payroll.
- Import Excel.
- Payment online.

Các phần này là module mở rộng, không làm thay đổi lõi member/membership/finance/PT.
