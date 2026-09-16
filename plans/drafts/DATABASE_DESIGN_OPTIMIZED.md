# GYM DƯƠNG DOUBLE - THIẾT KẾ DATABASE TỐI ƯU

## 1. Mục tiêu thiết kế

Database không thiết kế theo từng file Excel, mà thiết kế theo dữ liệu gốc của nghiệp vụ.

Nguyên tắc:

- Chỉ lưu dữ liệu nguồn thật.
- Báo cáo như tổng thu, tổng chi, lợi nhuận, mục tiêu tháng, tài chính năm sẽ được hệ thống tự tính.
- Không tạo bảng riêng cho từng tháng như `khach_hang_thang_9` hoặc `tong_thu_2026`.
- Lưu lịch sử thay vì ghi đè.
- Ưu tiên đủ lõi để giải quyết bài toán thực tế trước.
- Chừa đường cho AI, payroll, import Excel và báo cáo nâng cao sau này.

## 2. Phạm vi MVP của database

MVP cần giải quyết:

- Quản lý tài khoản `OWNER`, `PT`, `MEMBER`.
- Quản lý khách hàng.
- Quản lý gói tập.
- Đăng ký/gia hạn gói.
- Theo dõi sắp hết hạn/hết hạn.
- Ghi nhận thanh toán và công nợ cơ bản.
- Ghi nhận thu/chi cơ bản.
- Quản lý khách PT.
- Ghi nhận buổi PT/check-in theo chương trình.
- Theo dõi chỉ số cơ thể.
- Quản lý bài tập, ảnh, video YouTube.
- Dashboard chủ phòng.

MVP chưa cần làm đầy đủ:

- Payroll/lương PT phức tạp.
- Hoa hồng sale nâng cao.
- AI/ML thật.
- Payment online.
- Zalo auto.
- Computer Vision.

## 3. Ước lượng số bảng

MVP tối ưu:

```text
Khoảng 20-24 bảng
```

Bản production đầy đủ theo các phase:

```text
Khoảng 32-40 bảng
```

Con số này hợp lý vì hệ thống có nhiều domain: member, membership, finance, PT, training, content, notification, report/AI.

## 3.1 Quy ước đọc file: entity, enum và report

Để tránh nhầm lẫn:

- `Entity/Table`: là bảng thật trong database.
- `Enum/Code`: là giá trị cố định dùng trong code, không phải bảng riêng.
- `Report/View`: là dữ liệu tổng hợp được tính từ các bảng thật, không nên lưu thành bảng chính nếu chưa cần cache.

Ví dụ:

```text
members                  -> Entity/Table
member_memberships       -> Entity/Table
payments                 -> Entity/Table

status: ACTIVE, EXPIRED  -> Enum/Code
plan_type: PT, SELF...   -> Enum/Code

Tổng thu tháng           -> Report, tính từ financial_transactions loại INCOME
Lợi nhuận năm            -> Report, tính từ financial_transactions
```

Nguyên tắc:

- Bảng là entity.
- Enum không tạo bảng nếu chỉ là danh sách cố định trong code.
- Chỉ tạo bảng danh mục khi OWNER cần tự thêm/sửa/xóa trên giao diện.

Các enum/code nên để trong code:

- `UserStatus`: ACTIVE, INACTIVE, LOCKED.
- `MemberStatus`: ACTIVE, INACTIVE, ARCHIVED.
- `PlanType`: SELF_TRAINING, PT, GUIDANCE, OTHER.
- `ContentAccessLevel`: NONE, BASIC, PREMIUM.
- `MembershipStatus`: ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT.
- `PaymentMethod`: CASH, BANK_TRANSFER, CARD, OTHER.
- `RevenueCategory`: SELF_TRAINING, GUIDANCE, PT_MAIN, PT_NEW, OTHER_INCOME.
- `FinancialCategoryType`: INCOME, EXPENSE.
- `FinancialTransactionType`: INCOME, EXPENSE.
- `DebtStatus`: OPEN, PARTIALLY_PAID, PAID, CANCELLED.
- `PtAssignmentStatus`: ACTIVE, ENDED, PAUSED.
- `ScheduleStatus`: SCHEDULED, COMPLETED, CANCELLED, MISSED, RESCHEDULED.
- `SessionPackageStatus`: ACTIVE, COMPLETED, CANCELLED, EXPIRED.
- `PtSessionStatus`: COMPLETED, CANCELLED, MISSED, RESCHEDULED.
- `ActivityType`: PRACTICE, GUIDANCE_CHECKIN.
- `GoalType`: FAT_LOSS, MUSCLE_GAIN, STRENGTH, FITNESS, HEALTH, OTHER.
- `ExerciseVisibility`: PUBLIC, MEMBER_ONLY, PREMIUM.
- `MediaType`: IMAGE, VIDEO.
- `MediaProvider`: YOUTUBE, TIKTOK, EXTERNAL_IMAGE, LOCAL_UPLOAD.
- `BusinessGoalCategory`: FINANCE, SELF_TRAINING_MEMBER, GUIDED_CUSTOMER, NEW_PT_CUSTOMER, MAIN_PT_CUSTOMER, OTHER.
- `BusinessGoalMetric`: REVENUE, PROFIT, CUSTOMER_COUNT, NEW_CUSTOMER_COUNT, PT_CUSTOMER_COUNT.
- `NotificationType`: MEMBERSHIP_EXPIRING, MEMBERSHIP_EXPIRED, BIRTHDAY, DEBT_REMINDER, PT_LOW_SESSIONS, PT_PROGRESS_WARNING.
- `SalaryItemType`: BASE_SALARY, TEACHING_COMMISSION, SALES_COMMISSION, BONUS, PENALTY.
- `AiScoreType`: PT_PROGRESS, PT_DROP_OFF_RISK, RENEWAL_RISK, CUSTOMER_SEGMENT.

Các bảng danh mục thật nên giữ trong database:

- `roles`: vì liên quan phân quyền.
- `financial_categories`: vì chủ phòng có thể muốn quản lý danh mục thu/chi.
- `exercise_categories`: vì chủ phòng/PT có thể quản lý nhóm bài tập.

## 3.2 Danh sách entity/table thật trong thiết kế

Nhóm MVP lõi:

```text
users
roles
user_roles

members
member_notes

membership_plans
member_memberships

payments
financial_categories
financial_transactions
debt_records

pt_profiles
pt_assignments
pt_schedules
pt_session_packages
pt_session_logs
member_activity_logs
body_measurements
pt_goals

exercise_categories
exercises
exercise_media

business_goals

notifications
audit_logs
system_settings
```

Nhóm optional/phase sau:

```text
member_import_batches
membership_status_snapshots
pt_exercise_logs
training_programs
training_program_weeks
business_goal_progress
salary_periods
salary_items
commission_rules
customer_ai_scores
ai_score_runs
```

Các tên nằm trong danh sách enum/code ở mục 3.1 không tính là bảng.

## 4. Nhóm bảng cốt lõi MVP

## 4.1 Auth và phân quyền

### 4.1.1 `users`

Dùng cho tài khoản đăng nhập của chủ phòng, PT và member.

```text
users
  id
  username
  email
  phone
  password_hash
  full_name
  status
  last_login_at
  created_at
  updated_at
```

Gợi ý:

- `username` unique.
- `email` nullable nếu không bắt buộc.
- `phone` nên unique nếu dùng số điện thoại để đăng nhập.
- Enum/code `UserStatus`: ACTIVE, INACTIVE, LOCKED.

### 4.1.2 `roles`

```text
roles
  id
  code
  name
```

Role ban đầu là dữ liệu trong bảng `roles`:

- OWNER.
- PT.
- MEMBER.

### 4.1.3 `user_roles`

```text
user_roles
  user_id
  role_id
```

Một user có thể có nhiều role nếu sau này cần.

## 4.2 Member và hồ sơ khách hàng

### 4.2.1 `members`

Thông tin khách hàng/member.

```text
members
  id
  user_id
  full_name
  phone
  date_of_birth
  gender
  address
  zalo_phone
  note
  source
  status
  created_at
  updated_at
```

Enum/code `SessionPackageStatus`:

- ACTIVE.
- COMPLETED.
- CANCELLED.
- EXPIRED.

Ghi chú:

- `user_id` nullable, vì không phải khách nào cũng cần tài khoản đăng nhập ngay.
- `zalo_phone` có thể trùng `phone`, nhưng tách riêng để linh hoạt.
- `source`: WALK_IN, FACEBOOK, ZALO, REFERRAL, OTHER.
- Enum/code `MemberStatus`: ACTIVE, INACTIVE, ARCHIVED.

### 4.2.2 `member_notes`

Lưu ghi chú/chăm sóc khách, thay vì nhét mọi ghi chú vào một cột duy nhất.

```text
member_notes
  id
  member_id
  note_type
  content
  created_by
  created_at
```

Ví dụ `note_type`:

- GENERAL.
- RENEWAL.
- DEBT.
- PT_PROGRESS.
- CUSTOMER_CARE.

### 4.2.3 `member_import_batches`

Phục vụ import dữ liệu cũ từ Excel/CSV sau này nếu chủ phòng đổi nhu cầu. MVP hiện tại không cần import dữ liệu cũ vì chủ phòng muốn bắt đầu bằng dữ liệu mới.

```text
member_import_batches
  id
  file_name
  source
  total_rows
  success_rows
  failed_rows
  status
  error_summary
  imported_by
  imported_at
```

Không đưa bảng này vào schema MVP nếu chưa triển khai import. Chỉ mở lại khi có file lịch sử đủ sạch và thật sự cần nhập.

## 4.3 Gói tập và lịch sử đăng ký

### 4.3.1 `membership_plans`

Danh mục gói tập.

```text
membership_plans
  id
  name
  plan_type
  pt_level
  duration_days
  default_price
  pt_session_count
  practice_session_count
  guidance_session_count
  content_access_level
  price_ratio
  description
  active
  created_at
  updated_at
```

Enum/code `PlanType`:

- SELF_TRAINING.
- PT.
- GUIDANCE.
- OTHER.

Ghi chú:

- `pt_level` nullable, dùng cho gói PT: MAIN hoặc NEW.
- `pt_session_count` dùng cho số buổi PT trực tiếp.
- `practice_session_count` dùng cho số buổi Ôn tập đi kèm gói PT.
- `guidance_session_count` dùng cho gói Giáo án/Hướng Dẫn 30, 60, 90 buổi.
- `content_access_level` xác định quyền xem thư viện bài tập/chương trình trả phí.
- `price_ratio` có thể dùng để cấu hình PT mới bằng khoảng 65% gói PT chính.
- Không dùng `STUDENT` trong `PlanType`; cột Sinh viên trong Excel cũ thực chất là doanh thu/gói PT mới.

### 4.3.2 `member_memberships`

Lưu từng lần khách đăng ký/gia hạn gói.

```text
member_memberships
  id
  member_id
  plan_id
  sold_by_user_id
  start_date
  end_date
  actual_price
  paid_amount
  discount_amount
  debt_amount
  status
  note
  created_by
  created_at
  updated_at
```

Enum/code `MembershipStatus`:

- ACTIVE.
- EXPIRED.
- CANCELLED.
- PENDING_PAYMENT.

Ghi chú:

- Không ghi đè gói cũ khi gia hạn.
- Mỗi lần gia hạn tạo một bản ghi mới.
- `debt_amount` có thể tính từ payment, nhưng lưu cache ở đây cũng được nếu cần dashboard nhanh. Nếu lưu cache thì phải đảm bảo đồng bộ bằng transaction.
- `sold_by_user_id` nullable, dùng để ghi nhận ai sale/phụ trách bán gói để phase payroll tính hoa hồng sale.
- Nếu plan là `PT`, backend tạo/cập nhật `pt_session_packages` tương ứng.
- Nếu plan là `GUIDANCE`, không tạo `pt_session_packages`; số buổi Giáo án đã dùng tính từ `member_activity_logs` theo `membership_id`.

### 4.3.3 `membership_status_snapshots`

Bảng này không bắt buộc cho MVP. Chỉ dùng nếu sau này muốn lưu snapshot trạng thái theo ngày.

```text
membership_status_snapshots
  id
  member_id
  membership_id
  snapshot_date
  status
  days_until_expiration
```

MVP có thể tính trực tiếp từ `member_memberships.end_date`.

## 4.4 Thanh toán, thu chi, công nợ

### 4.4.1 `payments`

Ghi nhận tiền khách trả cho gói/dịch vụ.

```text
payments
  id
  member_id
  membership_id
  payment_date
  amount
  payment_method
  revenue_category
  description
  created_by
  created_at
```

Enum/code `PaymentMethod`:

- CASH.
- BANK_TRANSFER.
- CARD.
- OTHER.

Enum/code `RevenueCategory`:

- SELF_TRAINING.
- GUIDANCE.
- PT_MAIN.
- PT_NEW.
- OTHER_INCOME.

Mapping từ Excel `TỔNG THU`:

- Tự tập -> SELF_TRAINING.
- Giáo án -> GUIDANCE.
- Sinh viên -> PT_NEW.
- PT -> PT_MAIN hoặc PT_NEW tùy gói/nhân sự phụ trách.

### 4.4.2 `financial_categories`

Danh mục thu/chi.

```text
financial_categories
  id
  type
  code
  name
  active
```

Enum/code `FinancialCategoryType`:

- INCOME.
- EXPENSE.

Ví dụ expense category:

- RENT.
- MARKETING.
- ELECTRICITY.
- WATER.
- WASTE.
- INTERNET.
- DRINKING_WATER.
- PT_SALARY.
- BONUS.
- OTHER_EXPENSE.

Ghi chú sau khi làm rõ nghiệp vụ:

- `Kiệt` là tên nhân sự/PT.
- `Tiên PT` là khoản liên quan chị Tiên với vai trò PT.
- `Tiên MKT` là khoản liên quan chị Tiên với vai trò marketing.
- Danh mục chi có thể phát sinh linh hoạt, nên `financial_categories` là bảng để OWNER tự quản lý, không phải enum cứng.
- Phase sau nếu làm payroll/nhân sự chuẩn hơn thì khoản chi theo tên người có thể liên kết sang employee/PT.

### 4.4.3 `financial_transactions`

Ghi nhận thu/chi tổng quát.

```text
financial_transactions
  id
  type
  category_id
  amount
  transaction_date
  member_id
  membership_id
  payment_id
  description
  created_by
  created_at
  updated_at
```

Ghi chú:

- `payments` có thể tạo tự động một transaction loại `INCOME`.
- Chi phí từ Excel `TỔNG CHI` tạo transaction loại `EXPENSE`.
- Report năm/tháng tự tính từ bảng này.
- Báo cáo tài chính tổng hợp từ `financial_transactions` để tránh double-count.
- Không nhập tay lại một khoản thu khách hàng vào `financial_transactions` nếu khoản đó đã được tạo từ `payments`.

### 4.4.4 `debt_records`

Không bắt buộc nếu công nợ tính được từ `member_memberships.actual_price - payments`.  
Tuy nhiên nên có nếu muốn theo dõi công nợ rõ ràng.

```text
debt_records
  id
  member_id
  membership_id
  original_amount
  paid_amount
  remaining_amount
  due_date
  status
  note
  created_at
  updated_at
```

Enum/code `DebtStatus`:

- OPEN.
- PARTIALLY_PAID.
- PAID.
- CANCELLED.

## 4.5 PT và lịch dạy

### 4.5.1 `pt_profiles`

Thông tin riêng của PT.

```text
pt_profiles
  id
  user_id
  specialty
  bio
  base_salary
  active
  created_at
  updated_at
```

### 4.5.2 `pt_assignments`

Gán PT phụ trách khách.

```text
pt_assignments
  id
  pt_user_id
  member_id
  start_date
  end_date
  status
  note
  created_at
  updated_at
```

Enum/code `PtAssignmentStatus`:

- ACTIVE.
- ENDED.
- PAUSED.

### 4.5.3 `pt_schedules`

Chuyển từ bảng Excel `LỊCH DẠY TUẦN`.

```text
pt_schedules
  id
  pt_user_id
  member_id
  schedule_date
  start_time
  end_time
  status
  note
  created_by
  created_at
  updated_at
```

Enum/code `ScheduleStatus`:

- SCHEDULED.
- COMPLETED.
- CANCELLED.
- MISSED.
- RESCHEDULED.

Ghi chú:

- Sheet Excel dạng ma trận `giờ x thứ` chỉ là cách hiển thị.
- Database nên lưu mỗi lịch là một dòng.

## 4.6 PT session, check-in và tiến độ tập

### 4.6.1 `pt_session_packages`

Theo dõi gói PT theo số buổi.

```text
pt_session_packages
  id
  member_id
  pt_user_id
  membership_id
  total_pt_sessions
  used_pt_sessions
  remaining_pt_sessions
  total_practice_sessions
  used_practice_sessions
  remaining_practice_sessions
  start_date
  end_date
  status
  created_at
  updated_at
```

Ghi chú:

- Gói PT hiện tại gồm `20 PT + 20 Ôn tập`, `40 PT + 40 Ôn tập`, `60 PT + 60 Ôn tập`.
- Có thể tính `used_pt_sessions` từ `pt_session_logs`, nhưng lưu cache cũng được nếu cần dashboard nhanh.
- Nếu lưu cache, phải cập nhật bằng transaction khi thêm/sửa/xóa session.
- Lương dạy PT chỉ tính từ buổi PT, không tính buổi Ôn tập.
- Phiếu CHECK IN 24 dòng chỉ là mẫu in sẵn, không cố định số buổi trong database.

### 4.6.2 `pt_session_logs`

Ghi nhận từng buổi PT.

```text
pt_session_logs
  id
  session_package_id
  member_id
  pt_user_id
  schedule_id
  session_date
  session_number
  weight
  status
  content
  note
  created_by
  created_at
  updated_at
```

Enum/code `PtSessionStatus`:

- COMPLETED.
- CANCELLED.
- MISSED.
- RESCHEDULED.

Mapping từ phiếu `CHECK IN`:

- Tập PT: ngày -> `session_date`.
- Tập PT: cân nặng -> `weight`.
- STT -> `session_number`.

### 4.6.3 `member_activity_logs`

Dùng cho các buổi Ôn tập đi kèm gói PT và check-in Giáo án/Hướng Dẫn.

```text
member_activity_logs
  id
  member_id
  membership_id
  session_package_id
  activity_type
  activity_date
  session_number
  weight
  note
  created_by
  created_at
```

Enum/code `ActivityType`:

- PRACTICE.
- GUIDANCE_CHECKIN.

Ghi chú:

- Bảng này phản ánh cột `Ôn tập` trong phiếu check-in.
- Khách Giáo án/Hướng Dẫn cũng check-in tại đây với `activity_type = GUIDANCE_CHECKIN`.
- Khách tự tập không check-in, nên không sinh dữ liệu ở bảng này.
- `membership_id` giúp tính số buổi Giáo án đã dùng/còn lại theo đúng gói 30, 60, 90.
- `session_package_id` nullable, dùng khi log là buổi Ôn tập đi kèm một gói PT cụ thể.
- Với `PRACTICE`, hệ thống cập nhật `used_practice_sessions/remaining_practice_sessions` trên `pt_session_packages`.
- Với `GUIDANCE_CHECKIN`, hệ thống tính số buổi đã dùng bằng số log theo `membership_id`.

### 4.6.4 `pt_exercise_logs`

Ghi chi tiết bài tập trong từng buổi.

```text
pt_exercise_logs
  id
  session_log_id
  exercise_id
  sets
  reps
  weight
  duration_minutes
  note
  created_at
```

MVP có thể để optional.  
Nếu PT chưa muốn nhập chi tiết, chỉ cần `pt_session_logs.content/note`.

### 4.6.5 `body_measurements`

Mapping từ phiếu `THÔNG TIN KHÁCH HÀNG / THEO DÕI KHÁCH HÀNG`.

```text
body_measurements
  id
  member_id
  recorded_by
  recorded_at
  height
  weight
  chest
  waist
  abdomen
  hip
  thigh
  arm
  note
  created_at
```

Mapping:

- Cao -> `height`.
- Nặng -> `weight`.
- V1 -> `chest`.
- Eo -> `waist`.
- Bụng -> `abdomen`.
- V3 -> `hip`.
- Đùi -> `thigh`.
- Tay -> `arm`.

## 4.7 Mục tiêu và chương trình tập

### 4.7.1 `pt_goals`

Lưu mục tiêu ban đầu của khách PT/chương trình.

```text
pt_goals
  id
  member_id
  pt_user_id
  goal_type
  goal_description
  start_date
  target_date
  target_weight
  target_body_fat
  target_waist
  status
  note
  created_at
  updated_at
```

Enum/code `GoalType`:

- FAT_LOSS.
- MUSCLE_GAIN.
- STRENGTH.
- FITNESS.
- HEALTH.
- OTHER.

### 4.7.2 `training_programs`

Mapping từ phiếu `CHƯƠNG TRÌNH TẬP LUYỆN THEO MỤC TIÊU`.

```text
training_programs
  id
  member_id
  pt_user_id
  goal_id
  name
  goal
  duration_weeks
  start_date
  end_date
  status
  note
  created_at
  updated_at
```

### 4.7.3 `training_program_weeks`

Theo dõi mục tiêu và thực tế từng tuần.

```text
training_program_weeks
  id
  program_id
  week_number
  week_start_date
  week_end_date
  target_sessions
  target_description
  actual_sessions
  actual_result
  note
  created_at
  updated_at
```

Mapping từ Excel:

- Tuần -> `week_number`.
- Mục tiêu: số buổi -> `target_sessions`.
- Mục tiêu: mục tiêu -> `target_description`.
- Thực tế: số buổi -> `actual_sessions`.
- Thực tế: kết quả -> `actual_result`.
- Ghi chú -> `note`.

## 4.8 Thư viện bài tập và media

### 4.8.1 `exercise_categories`

```text
exercise_categories
  id
  name
  slug
  description
  active
  created_at
  updated_at
```

### 4.8.2 `exercises`

```text
exercises
  id
  category_id
  name
  slug
  description
  instruction
  common_mistakes
  difficulty
  primary_muscle
  equipment
  visibility
  active
  created_at
  updated_at
```

Enum/code `ExerciseVisibility`:

- PUBLIC.
- MEMBER_ONLY.
- PREMIUM.

### 4.8.3 `exercise_media`

Ảnh/video minh họa cho bài tập.

```text
exercise_media
  id
  exercise_id
  media_type
  provider
  url
  thumbnail_url
  sort_order
  created_at
```

Enum/code `MediaType`:

- IMAGE.
- VIDEO.

Enum/code `MediaProvider`:

- YOUTUBE.
- TIKTOK.
- EXTERNAL_IMAGE.
- LOCAL_UPLOAD.

Nguyên tắc:

- Video bài tập ưu tiên embed YouTube.
- Không upload/stream video bằng VPS.
- Database chỉ lưu URL và metadata.

## 4.9 Business goals và dashboard

### 4.9.1 `business_goals`

Mapping từ bảng `MỤC TIÊU THÁNG`.

```text
business_goals
  id
  year
  month
  category
  metric_name
  target_value
  unit
  note
  created_by
  created_at
  updated_at
```

Enum/code `BusinessGoalCategory`:

- FINANCE.
- SELF_TRAINING_MEMBER.
- GUIDED_CUSTOMER.
- NEW_PT_CUSTOMER.
- MAIN_PT_CUSTOMER.
- OTHER.

Enum/code `BusinessGoalMetric`:

- REVENUE.
- PROFIT.
- CUSTOMER_COUNT.
- NEW_CUSTOMER_COUNT.
- PT_CUSTOMER_COUNT.

### 4.9.2 `business_goal_progress`

Có thể tính động từ dữ liệu thật, nhưng nếu muốn lưu snapshot thì dùng bảng này.

```text
business_goal_progress
  id
  goal_id
  period_start
  period_end
  actual_value
  progress_percent
  calculated_at
```

Giai đoạn MVP có thể chưa cần lưu bảng này, chỉ tính realtime hoặc cache nhẹ.

## 4.10 Notification và audit

### 4.10.1 `notifications`

```text
notifications
  id
  recipient_user_id
  member_id
  notification_type
  title
  content
  status
  scheduled_at
  sent_at
  read_at
  created_at
```

Enum/code `NotificationType`:

- MEMBERSHIP_EXPIRING.
- MEMBERSHIP_EXPIRED.
- BIRTHDAY.
- DEBT_REMINDER.
- PT_LOW_SESSIONS.
- PT_PROGRESS_WARNING.

Ghi chú:

- Ban đầu notification hiển thị trong app.
- Zalo auto để phase sau sau khi xác minh API/chính sách.

### 4.10.2 `audit_logs`

```text
audit_logs
  id
  actor_user_id
  action
  entity_type
  entity_id
  old_value_json
  new_value_json
  ip_address
  created_at
```

Nên log:

- Tạo/sửa member.
- Gia hạn gói.
- Ghi nhận thanh toán.
- Sửa/xóa giao dịch.
- Sửa buổi PT.
- Sửa dữ liệu lương sau này.

### 4.10.3 `system_settings`

```text
system_settings
  key
  value
  description
  updated_at
```

Ví dụ:

- `membership.expiring_soon_days = 7`.
- `churn.grace_days = 30`.
- `notification.birthday_time = 06:00`.

## 5. Bảng chừa cho phase sau

## 5.1 Payroll / lương PT

Không nên đưa vào MVP dù công thức cốt lõi đã rõ, vì payroll cần thêm luồng duyệt và kiểm tra cuối kỳ.

### `salary_periods`

```text
salary_periods
  id
  pt_user_id
  month
  year
  base_salary
  teaching_commission_total
  sales_commission_total
  bonus_total
  penalty_total
  final_salary
  status
  approved_by
  approved_at
  created_at
  updated_at
```

### `salary_items`

```text
salary_items
  id
  salary_period_id
  type
  description
  member_id
  reference_id
  quantity
  rate
  amount
  total
  created_at
```

Enum/code `SalaryItemType`:

- BASE_SALARY.
- TEACHING_COMMISSION.
- SALES_COMMISSION.
- BONUS.
- PENALTY.

### `commission_rules`

```text
commission_rules
  id
  rule_type
  plan_type
  rate_type
  rate_value
  active
  effective_from
  effective_to
```

Ghi chú:

- Chỉ làm sau MVP.
- Công thức lương dạy đã chốt: `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale đã chốt: `10% * số tiền khách đã thanh toán`.
- Nếu khách thanh toán nhiều đợt, hoa hồng sale phát sinh theo số tiền thực nhận từng đợt.

## 5.2 AI / Analytics

### `customer_ai_scores`

```text
customer_ai_scores
  id
  member_id
  score_type
  score_value
  risk_level
  segment
  explanation_json
  calculated_at
```

Enum/code `AiScoreType`:

- PT_PROGRESS.
- PT_DROP_OFF_RISK.
- RENEWAL_RISK.
- CUSTOMER_SEGMENT.

### `ai_score_runs`

```text
ai_score_runs
  id
  score_type
  model_version
  run_type
  started_at
  finished_at
  status
  note
```

Ghi chú:

- Giai đoạn đầu có thể chỉ dùng rule-based scoring trong Spring Boot.
- Sau này đủ dữ liệu mới chạy ML batch bằng Python.

## 6. Bảng nào là dữ liệu nguồn, bảng nào là báo cáo?

## 6.1 Dữ liệu nguồn cần lưu

- `members`.
- `membership_plans`.
- `member_memberships`.
- `payments`.
- `financial_transactions`.
- `pt_schedules`.
- `pt_session_logs`.
- `member_activity_logs`.
- `body_measurements`.
- `training_programs`.
- `training_program_weeks`.
- `exercises`.
- `exercise_media`.

## 6.2 Báo cáo nên tính từ dữ liệu nguồn

Không nên tạo bảng riêng cho:

- Tổng thu ngày.
- Tổng thu tháng.
- Tổng chi tháng.
- Lợi nhuận tháng/năm.
- Tài chính năm.
- Số khách mới/cũ.
- Số khách sắp hết hạn.
- % hoàn thành mục tiêu.
- Bảng lương PT cuối tháng, nếu có thể tính từ `salary_items`.

Các báo cáo này nên được query/tính từ dữ liệu nguồn, hoặc cache/snapshot sau nếu performance cần.

## 7. Index quan trọng

Nên có index cho:

```text
users.phone
users.username
members.phone
members.full_name
member_memberships.member_id
member_memberships.plan_id
member_memberships.end_date
member_memberships.status
payments.member_id
payments.payment_date
financial_transactions.transaction_date
financial_transactions.type
financial_transactions.category_id
pt_schedules.pt_user_id
pt_schedules.schedule_date
pt_session_logs.member_id
pt_session_logs.pt_user_id
pt_session_logs.session_date
body_measurements.member_id
body_measurements.recorded_at
training_programs.member_id
training_program_weeks.program_id
notifications.recipient_user_id
notifications.status
```

## 8. Ràng buộc dữ liệu quan trọng

Nên có:

- Unique phone cho member nếu chủ phòng xác nhận một khách chỉ dùng một số điện thoại.
- Foreign key đầy đủ giữa member, membership, payment, PT session.
- Không xóa cứng dữ liệu đã có lịch sử tài chính.
- Gói tập đã từng bán chỉ được inactive, không xóa.
- Thanh toán đã ghi nhận chỉ được sửa/xóa bởi OWNER và cần audit log.
- PT chỉ được xem khách được gán cho mình.
- MEMBER chỉ được xem dữ liệu của chính mình.

## 9. Mapping từ 10 bảng Excel/phiếu giấy sang database

| Excel/Phiếu | Bảng database chính |
| --- | --- |
| Lịch dạy tuần | `pt_schedules` |
| Quản lý khách hàng tháng | `members`, `member_memberships`, `payments`, `member_notes` |
| Tính lương PT | `salary_periods`, `salary_items`, `commission_rules` |
| Mục tiêu tháng | `business_goals`, `business_goal_progress` |
| Tài chính năm | report từ `financial_transactions` |
| Tổng thu | report từ `financial_transactions`; `payments` là bảng nghiệp vụ sinh transaction INCOME |
| Tổng chi | `financial_transactions`, `financial_categories` |
| Theo dõi khách hàng theo tuần | `body_measurements`, `pt_goals` |
| Check in hằng ngày | `pt_session_logs`, `member_activity_logs` |
| Chương trình tập luyện theo mục tiêu | `training_programs`, `training_program_weeks` |

## 10. MVP schema đề xuất

Nếu muốn làm gọn nhất mà vẫn đủ giải quyết bài toán chính, MVP nên bắt đầu với các bảng:

```text
users
roles
user_roles

members
member_notes

membership_plans
member_memberships

payments
financial_categories
financial_transactions
debt_records

pt_profiles
pt_assignments
pt_schedules
pt_session_packages
pt_session_logs
member_activity_logs
body_measurements
pt_goals

exercise_categories
exercises
exercise_media

business_goals

notifications
audit_logs
system_settings
```

Tổng MVP:

```text
Khoảng 27 bảng nếu làm đủ lịch PT, tài chính, activity log, business goals.
```

Nếu muốn MVP nhẹ hơn nữa, có thể tạm hoãn:

- `member_import_batches`.
- `membership_status_snapshots`.
- `member_activity_logs`.
- `business_goal_progress`.
- `business_goals`.
- `pt_exercise_logs`.

MVP siêu gọn còn khoảng:

```text
20-22 bảng
```

## 11. Kết luận thiết kế

Thiết kế tối ưu nên đi theo hướng:

- Dữ liệu nguồn chuẩn trước.
- Báo cáo sinh tự động sau.
- Không bê nguyên cấu trúc Excel vào database.
- Khách tự tập tập trung vào hạn gói, gia hạn, doanh thu.
- Khách PT tập trung vào session, chỉ số cơ thể, mục tiêu, tiến độ.
- Finance dùng chung `financial_transactions` để sinh tổng thu/tổng chi/lợi nhuận.
- Payroll và AI để phase sau, nhưng database đã chừa đường.

Với schema này, hệ thống đủ giải quyết các yêu cầu chính từ đầu tới giờ, đồng thời vẫn giữ được kiến trúc gọn cho phòng gym nhỏ và dễ deploy trên VPS.
