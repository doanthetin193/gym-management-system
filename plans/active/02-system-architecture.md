# 02 - KIẾN TRÚC HỆ THỐNG

## 1. Mục tiêu kiến trúc

Kiến trúc phải phù hợp với phòng gym nhỏ, dễ triển khai và dễ bảo trì.

Ưu tiên:

- Đơn giản.
- Production-ready ở mức vừa đủ.
- Dễ deploy trên VPS.
- Dễ backup.
- Có module rõ để mở rộng.
- Không over-engineer.

## 2. Kiến trúc tổng thể

```text
Browser
  |
Cloudflare
  |
Nginx
  |
  |-- React Static App
  |
  |-- /api -> Spring Boot Modular Monolith
                  |
                  -> PostgreSQL
```

## 3. Lý do chọn Modular Monolith

Không chọn microservices vì:

- Quy mô phòng gym nhỏ.
- Traffic không lớn.
- Team triển khai nhỏ.
- Microservices tăng chi phí deploy/monitoring.

Modular monolith vẫn đảm bảo:

- Một backend deployable.
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
- Flyway.
- Spring Scheduler.
- Caffeine Cache.

Database:

- PostgreSQL.

Deploy:

- VPS Ubuntu.
- Docker Compose.
- Nginx.
- Cloudflare.

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
notification
common
```

## 6. Boundary từng module

### `auth`

Trách nhiệm:

- Login.
- Refresh token.
- Logout.
- Password hashing.
- Current user.

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
- Thu/chi.
- Công nợ.
- Tính doanh thu/chi phí/lợi nhuận.

Không lưu bảng tổng thu/tổng chi riêng nếu có thể tính từ transaction.

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
- Training program.
- Weekly target vs actual.
- Báo cáo tiến độ.

### `exercise`

Trách nhiệm:

- Nhóm bài tập.
- Bài tập.
- Media.
- YouTube embed URL.

### `dashboard`

Trách nhiệm:

- Tổng hợp số liệu cho OWNER/PT/MEMBER.
- Không sở hữu dữ liệu nguồn.

### `notification`

Trách nhiệm:

- Nhắc hết hạn.
- Sinh nhật.
- Công nợ.
- Khách PT còn ít buổi.

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
  -> dashboard + notification
```

### 7.3 Ghi nhận buổi PT

```text
PT chọn khách
  -> thêm session log
  -> cập nhật used/remaining sessions
  -> ghi cân nặng/ghi chú
  -> dùng cho progress report
```

### 7.4 Ghi nhận thu/chi

```text
Payment/Expense
  -> financial_transactions
  -> finance summary
  -> dashboard lợi nhuận
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

- Tổng thu: từ `financial_transactions` loại INCOME.
- Tổng chi: từ `financial_transactions`.
- Lợi nhuận: tổng thu - tổng chi.
- Khách sắp hết hạn: từ `member_memberships.end_date`.
- Tiến độ PT: từ `pt_session_logs`, `body_measurements`, `training_program_weeks`.

Quy tắc tài chính:

- `payments` là bảng nghiệp vụ ghi tiền khách trả.
- Khi tạo payment, backend sinh transaction INCOME tương ứng.
- Dashboard/báo cáo tài chính tổng hợp từ `financial_transactions` để tránh double-count.

Nếu performance cần, có thể thêm snapshot/cache sau.

## 10. Scheduler

Spring Scheduler dùng cho:

- Tạo notification hết hạn.
- Nhắc sinh nhật.
- Cập nhật cảnh báo khách PT còn ít buổi.
- Tính score rule-based sau này.

## 11. Media

Video:

- Embed YouTube.
- Database lưu URL, provider, thumbnail.
- Không stream video bằng VPS.

Ảnh:

- MVP có thể lưu URL ngoài hoặc local upload.
- Phase sau có thể dùng Cloudinary/S3-compatible storage.

## 12. Logging và audit

Cần audit:

- Tạo/sửa member.
- Gia hạn gói.
- Ghi/sửa payment.
- Ghi/sửa expense.
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

Các phần này là module mở rộng, không làm thay đổi lõi member/membership/finance/PT.
