# 03 - THIẾT KẾ DATABASE

## 1. Mục tiêu thiết kế

Database của hệ thống không sao chép nguyên các file Excel hiện tại.
Các bảng Excel/phiếu giấy được phân tích để tìm ra dữ liệu nguồn thật, sau đó chuẩn hóa thành entity.

Mục tiêu:

- Đủ dữ liệu để thay thế cách quản lý thủ công hiện tại.
- Không tạo quá nhiều bảng dư thừa.
- Không lược bỏ các nghiệp vụ quan trọng của chủ phòng.
- Báo cáo được tự tính từ dữ liệu nguồn.
- Lưu lịch sử gia hạn, thanh toán, buổi tập và tiến độ.
- Chừa đường cho payroll, import Excel và AI sau này.

Nguyên tắc:

- `Entity/Table`: bảng thật trong database.
- `Enum/Code`: giá trị cố định xử lý trong code, không tạo bảng nếu không cần quản trị động.
- `Report/View`: dữ liệu tổng hợp, ưu tiên tính từ bảng nguồn.

## 2. Quy mô bảng đề xuất

MVP hiện tại tối ưu nhưng đủ nghĩa:

```text
20 bảng nghiệp vụ/runtime
```

Full phase sau:

```text
Khoảng 34-42 bảng
```

Thiết kế giữ đúng dữ liệu nguồn cho hội viên, gói tập, thanh toán/công nợ, lịch PT, chỉ số cơ thể và mục tiêu tập luyện.

## 3. Nhóm bảng MVP đề xuất

```text
users
roles
user_roles

members

membership_plans
member_memberships

payments
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

system_settings
```

Tổng hiện tại: 19 bảng, gồm 18 entity và bảng nối `user_roles`. Các bảng `business_goals`, `financial_categories`, `financial_transactions`, `member_notes`, `notifications`, `audit_logs` từng nằm trong thiết kế sơ khai nhưng đã được loại khỏi DB dev vì implementation hiện tại không dùng.

Nếu cần giảm scope MVP, ưu tiên hoãn UI/báo cáo nâng cao chứ không bỏ dữ liệu nguồn cốt lõi:

- Không nên bỏ `member_activity_logs` vì bảng này giữ buổi Ôn tập và check-in Giáo án/Hướng Dẫn.
- Không làm `training_programs`/`training_program_weeks` trong Sprint 5 vì nhu cầu thực tế hiện tại là thư viện video TikTok public, không phải LMS/giáo án theo tuần.
- Notification nâng cao/persistence riêng được hoãn. Dashboard và trang nhắc việc hiện tính động danh sách sắp hết hạn, sinh nhật, công nợ và khách PT còn ít buổi từ dữ liệu nguồn.

## 4. Auth và phân quyền

### 4.1 `users`

Tài khoản đăng nhập cho OWNER, PT, MEMBER.

```text
users
  id
  email
  phone
  password_hash
  full_name
  status
  last_login_at
  created_at
  updated_at
```

Enum/code:

- `UserStatus`: ACTIVE, INACTIVE, LOCKED.

### 4.2 `roles`

```text
roles
  id
  code
  name
```

Dữ liệu ban đầu:

- OWNER.
- PT.
- MEMBER.

### 4.3 `user_roles`

```text
user_roles
  user_id
  role_id
```

## 5. Member và ghi chú khách hàng

### 5.1 `members`

Lưu hồ sơ khách hàng.

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
  source
  status
  note
  created_at
  updated_at
```

Ghi chú:

- `user_id` nullable vì không phải member nào cũng cần tài khoản đăng nhập ngay.
- `zalo_phone` phục vụ mở nhanh Zalo/chat sau này.

Enum/code:

- `MemberStatus`: ACTIVE, INACTIVE, ARCHIVED.
- `MemberSource`: WALK_IN, FACEBOOK, ZALO, REFERRAL, OTHER.

### 5.2 Ghi chú hội viên

Không dùng bảng `member_notes` trong implementation hiện tại. Ghi chú được lưu trực tiếp ở đúng ngữ cảnh nghiệp vụ:

- `members.note`: ghi chú tổng quan.
- `member_memberships.note`: ghi chú đăng ký/gia hạn gói.
- `payment_transactions.description`: ghi chú phiếu thu.
- `pt_session_logs.note`, `member_activity_logs.note`, `pt_goals.note`: ghi chú PT/chỉ số/mục tiêu.

## 6. Gói tập và lịch sử gia hạn

### 6.1 `membership_plans`

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
  price_ratio
  description
  active
  created_at
  updated_at
```

Enum/code:

- `PlanType`: SELF_TRAINING, PT, GUIDANCE, OTHER.
- `PtLevel`: MAIN, NEW.

Ghi chú:

- `pt_level` chỉ dùng khi `plan_type = PT`.
- `pt_session_count` là số buổi PT có PT trực tiếp.
- `practice_session_count` là số buổi Ôn tập đi kèm gói PT, khách tự ôn bài không có PT trực tiếp.
- `guidance_session_count` dùng cho gói Giáo án/Hướng Dẫn 30, 60, 90 buổi.
- `price_ratio` hỗ trợ cấu hình gói PT mới bằng khoảng 65% gói PT chính nếu cần.
- Scope hiện tại không còn `content_access_level`; thư viện TikTok là public, không làm premium content/LMS.
- Không tạo `PlanType.STUDENT`. Cột `Sinh viên` trong Excel cũ thực chất là khoản thu của gói PT mới.

Ví dụ plan:

- `Tự tập 1 tháng`: `plan_type = SELF_TRAINING`.
- `PT chính 20 + 20`: `plan_type = PT`, `pt_level = MAIN`, `pt_session_count = 20`, `practice_session_count = 20`.
- `PT mới 20 + 20`: `plan_type = PT`, `pt_level = NEW`, `pt_session_count = 20`, `practice_session_count = 20`, `price_ratio = 0.65`.
- `Giáo án 30 buổi`: `plan_type = GUIDANCE`, `guidance_session_count = 30`.

### 6.2 `member_memberships`

Lưu từng lần khách đăng ký/gia hạn.

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

Enum/code:

- `MembershipStatus`: ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT.

Quy tắc:

- Gia hạn tạo record mới.
- Không ghi đè gói cũ.
- Trạng thái sắp hết hạn có thể tính từ `end_date`, không nhất thiết lưu thành field.
- `sold_by_user_id` nullable, dùng để ghi nhận ai sale/phụ trách bán gói. Field này phục vụ hoa hồng sale PT ở phase payroll sau này.
- Nếu plan là `PT`, backend tạo/cập nhật `pt_session_packages` tương ứng để quản lý số buổi PT và Ôn tập.
- Nếu plan là `GUIDANCE`, không tạo `pt_session_packages`; số buổi Giáo án đã dùng được tính từ `member_activity_logs` theo `membership_id`.

## 7. Thanh toán, thu chi, công nợ

### 7.1 `payments`

Ghi nhận tiền khách trả.

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

Enum/code:

- `PaymentMethod`: CASH, BANK_TRANSFER, CARD, OTHER.
- `RevenueCategory`: SELF_TRAINING, GUIDANCE, PT_MAIN, PT_NEW, OTHER_INCOME.

Mapping từ Excel `TỔNG THU`:

- Tự tập -> SELF_TRAINING.
- Giáo án -> GUIDANCE.
- Sinh viên -> PT_NEW.
- PT -> PT_MAIN hoặc PT_NEW tùy gói/nhân sự phụ trách.

Ghi chú:

- `Sinh viên` không còn được dùng như category nghiệp vụ mới. Đây là tên cột Excel cũ của khoản thu gói PT mới.
- Nếu sau này có gói giảm giá thật cho sinh viên, nên xử lý bằng discount trên `member_memberships`, không tạo lẫn với revenue category hiện tại.

`payments` là nguồn doanh thu duy nhất. Hệ thống không có sổ chi phí hoặc bảng transaction trung gian vì mọi khoản thu trong scope đều là tiền hội viên thanh toán cho gói tập.

### 7.2 `debt_records`

Theo dõi công nợ rõ ràng.

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

Enum/code:

- `DebtStatus`: OPEN, PARTIALLY_PAID, PAID, CANCELLED.

## 8. PT, lịch dạy và gán khách

### 8.1 `pt_profiles`

Thông tin riêng của PT.

```text
pt_profiles
  id
  user_id
  pt_level
  specialty
  bio
  base_salary
  teaching_rate
  sales_commission_rate
  active
  created_at
  updated_at
```

Enum/code:

- `PtLevel`: MAIN, NEW.

Ghi chú:

- `MAIN` là PT chính theo bảng giá chuẩn của phòng; hiện là chủ phòng.
- `NEW` là PT mới/học việc, gói bán bằng khoảng 65% giá PT chính; hiện là Kiệt.
- `teaching_rate` mặc định có thể là `0.30` theo công thức lương dạy đã chốt.
- `sales_commission_rate` mặc định có thể là `0.10` theo công thức hoa hồng sale đã chốt.

### 8.2 `pt_assignments`

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

Enum/code:

- `PtAssignmentStatus`: ACTIVE, ENDED, PAUSED.

### 8.3 `pt_schedules`

Số hóa bảng `LỊCH DẠY TUẦN`.

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

Enum/code:

- `ScheduleStatus`: SCHEDULED, COMPLETED, CANCELLED, MISSED, RESCHEDULED.

Ghi chú:

- Excel hiển thị dạng ma trận giờ x thứ.
- Database lưu mỗi lịch là một dòng.

## 9. PT session, check-in và hoạt động

### 9.1 `pt_session_packages`

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

Enum/code:

- `SessionPackageStatus`: ACTIVE, COMPLETED, CANCELLED, EXPIRED.

Ghi chú:

- Gói PT hiện tại có 3 mẫu chính: `20 PT + 20 Ôn tập`, `40 PT + 40 Ôn tập`, `60 PT + 60 Ôn tập`.
- Lương dạy PT chỉ tính theo `used_pt_sessions`, không tính `used_practice_sessions`.
- Phiếu `CHECK IN` 24 dòng chỉ là mẫu in sẵn, không dùng để cố định số buổi trong database.

### 9.2 `pt_session_logs`

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

Enum/code:

- `PtSessionStatus`: COMPLETED, CANCELLED, MISSED, RESCHEDULED.

Mapping từ phiếu `CHECK IN`:

- Tập PT ngày -> `session_date`.
- Tập PT cân nặng -> `weight`.
- STT -> `session_number`.

### 9.3 `member_activity_logs`

Dùng cho buổi Ôn tập đi kèm gói PT và check-in Giáo án/Hướng Dẫn.

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

Enum/code:

- `ActivityType`: PRACTICE, GUIDANCE_CHECKIN.

Ghi chú:

- Bảng này phản ánh cột `Ôn tập` trong phiếu check-in.
- Khách Giáo án/Hướng Dẫn cũng check-in tại đây với `activity_type = GUIDANCE_CHECKIN`.
- Khách tự tập không check-in, nên không sinh dữ liệu ở bảng này.
- `membership_id` giúp tính số buổi Giáo án đã dùng/còn lại theo đúng gói 30, 60, 90.
- `session_package_id` nullable, dùng khi log là buổi Ôn tập đi kèm một gói PT cụ thể.
- Với `PRACTICE`, hệ thống cập nhật `used_practice_sessions/remaining_practice_sessions` trên `pt_session_packages`.
- Với `GUIDANCE_CHECKIN`, hệ thống tính số buổi đã dùng bằng số log theo `membership_id`.
- Nếu cần MVP gọn hơn, có thể tạm hoãn UI nhưng vẫn nên giữ trong thiết kế.

## 10. Chỉ số cơ thể

### 10.1 `body_measurements`

Số hóa phiếu `THEO DÕI KHÁCH HÀNG`.

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

## 11. Mục tiêu và chương trình tập

### 11.1 `pt_goals`

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

Enum/code:

- `GoalType`: FAT_LOSS, MUSCLE_GAIN, STRENGTH, FITNESS, HEALTH, OTHER.

### 11.2 Training Program theo tuần

Không triển khai trong Sprint 5.

Lý do:

- Chủ phòng hiện không cần quản lý khóa học/giáo án theo tuần trên web.
- PT/chủ phòng không có thời gian nhập chi tiết từng tuần như LMS.
- Tiến độ PT hiện đã đủ dữ liệu cốt lõi qua `pt_session_logs`, `member_activity_logs`, `body_measurements` và `pt_goals`.

Phase sau chỉ mở lại nếu có nhu cầu thật về giáo án cá nhân hóa theo tuần cho từng khách PT.

## 12. Thư viện bài tập/video TikTok public

### 12.1 `exercise_categories`

```text
exercise_categories
  id
  name
  slug
  description
  icon_name
  sort_order
  active
  created_at
  updated_at
```

### 12.2 `exercises`

Mỗi dòng là một bài tập/chủ đề hướng dẫn có thể gắn một video TikTok chính.

```text
exercises
  id
  category_id
  title
  slug
  description
  instruction
  common_mistakes
  level
  muscle_group
  equipment
  tiktok_url
  tiktok_video_id
  thumbnail_url
  author_name
  author_tiktok_url
  featured
  published
  view_count
  created_at
  updated_at
```

Enum/code:

- `ExerciseLevel`: BEGINNER, INTERMEDIATE, ADVANCED.

Nguyên tắc:

- Sprint 5 chỉ dùng TikTok, không hỗ trợ provider video khác.
- Thư viện bài tập là public; không dùng `MEMBER_ONLY`/`PREMIUM` trong sprint này.
- Không cần bảng `exercise_media` trong Sprint 5 nếu mỗi bài tập chỉ gắn một video TikTok chính.
- Nếu phase sau cần nhiều ảnh/video cho một bài tập, mới tách thêm bảng media riêng.
- Không upload/stream video bằng VPS.
- Frontend ưu tiên TikTok embed; nếu embed bị chặn hoặc không tải được thì hiển thị thumbnail/nút mở TikTok.

## 13. Nhắc việc động và audit

Không dùng entity/table `notifications` riêng trong MVP hiện tại. API nhắc việc được tính động từ:

- Hạn gói tập.
- Sinh nhật.
- Công nợ mở.
- Gói PT còn ít buổi.

Không dùng table `audit_logs` trong MVP hiện tại. Nếu cần truy vết thay đổi đầy đủ khi triển khai thực tế, mở lại ở phase hardening.

### 13.4 `system_settings`

```text
system_settings
  key
  value
  description
  updated_at
```

Ví dụ:

- `membership.expiring_soon_days = 7`.
- `notification.birthday_time = 06:00`.

## 14. Bảng phase sau

### Import dữ liệu cũ

```text
member_import_batches
```

Chỉ dùng nếu phase sau muốn nhập dữ liệu lịch sử. MVP hiện tại không cần import dữ liệu cũ vì chủ phòng đã chốt bắt đầu với dữ liệu mới.

Nếu import dữ liệu tài chính/khách/PT sau này, có thể mở rộng thêm:

```text
import_rows
  id
  batch_id
  row_number
  status
  raw_data_json
  error_message
```

Không đưa `member_import_batches` và `import_rows` vào schema MVP nếu chưa triển khai import.

### Payroll/lương PT

```text
salary_periods
salary_items
commission_rules
```

Mapping từ Excel `LƯƠNG PT`:

- Lương cố định -> `salary_periods.base_salary`.
- Lương dạy khách -> `salary_items` type TEACHING_COMMISSION.
- Lương sale -> `salary_items` type SALES_COMMISSION.
- Thưởng -> `salary_items` type BONUS.
- Phạt -> `salary_items` type PENALTY.

Quy tắc đã chốt để triển khai ở phase sau:

- Lương dạy PT chỉ tính trên số buổi PT thực dạy, lấy từ `pt_session_logs`.
- Không tính lương dạy cho buổi Ôn tập vì đây là buổi khách tự tập lại.
- Công thức lương dạy: `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale: `10% * số tiền khách đã thanh toán`.
- Nếu khách thanh toán nhiều đợt, hoa hồng sale phát sinh theo số tiền thực nhận từng đợt.

### AI/Analytics

```text
customer_ai_scores
ai_score_runs
```

Dùng cho:

- PT Progress.
- PT Drop-off Risk.
- Renewal Risk.
- Customer Segment.

## 15. Bảng nào là dữ liệu nguồn, bảng nào là báo cáo?

### Dữ liệu nguồn cần lưu

- `members`.
- `membership_plans`.
- `member_memberships`.
- `payments`.
- `pt_schedules`.
- `pt_session_logs`.
- `member_activity_logs`.
- `body_measurements`.
- `pt_goals`.
- `exercise_categories`.
- `exercises`.

### Báo cáo nên tự tính

- Tổng thu ngày/tháng/năm.
- Doanh thu gói tập theo tháng/năm.
- Số khách mới/cũ.
- Số khách tái tục/gia hạn theo tháng.
- Khách sắp hết hạn.
- Bảng lương PT cuối tháng.

## 16. Index quan trọng

```text
users.phone
users.email
members.phone
members.full_name
member_memberships.member_id
member_memberships.end_date
member_memberships.status
payments.member_id
payments.payment_date
pt_schedules.pt_user_id
pt_schedules.schedule_date
pt_session_logs.member_id
pt_session_logs.session_date
body_measurements.member_id
body_measurements.recorded_at
exercise_categories.slug
exercises.slug
exercises.category_id
exercises.published
```

## 17. Ràng buộc dữ liệu

- Gói đã từng bán không xóa cứng, chỉ inactive.
- Thanh toán đã ghi nhận không xóa cứng tùy tiện.
- Sửa dữ liệu tài chính trong MVP nên hạn chế qua UI; audit log đầy đủ để phase hardening.
- Gia hạn tạo dòng mới trong `member_memberships`.
- PT chỉ xem khách được phân công.
- MEMBER chỉ xem dữ liệu của mình.
- Báo cáo tài chính sinh từ transaction, không nhập tay bảng tổng.

## 18. Kết luận

Thiết kế này là bản tối ưu tối thiểu nhưng đủ ý nghĩa nghiệp vụ:

- Không quá nhiều bảng dư.
- Không lược bỏ PT tracking, body measurement, check-in, thư viện bài tập/video TikTok public và finance.
- Giữ đúng các nhu cầu chủ phòng đang làm bằng Excel/phiếu giấy.
- Có thể triển khai MVP theo từng sprint.
- Có đường mở rộng sang payroll, import Excel và AI sau này.

## 19. Cập nhật theo implementation hiện tại

Tài liệu chốt hiện trạng sau nâng cấp UI nằm tại `plans/active/10-current-implementation-alignment.md`.

Các điều chỉnh database/entity so với thiết kế sơ khai:

- Giữ mô hình `users`, `roles`, `user_roles`; role hiện hành chỉ gồm `OWNER`, `PT`, `MEMBER`.
- Không còn role/table riêng cho `STAFF`.
- Không dùng bảng `training_programs` và `training_program_weeks` trong scope hiện tại.
- Không dùng bảng `exercise_media`; mỗi `exercises` lưu trực tiếp thông tin video TikTok cần thiết.
- Không dùng `member_notes` trong implementation hiện tại; ghi chú chính nằm ở member/membership/payment/session theo từng nghiệp vụ.
- Không dùng entity `notifications` riêng; nhắc việc hiện tại được tính động từ hạn gói, công nợ và sinh nhật.
- Không dùng entity `audit_logs` riêng trong scope hiện tại; nếu cần audit đầy đủ sẽ mở lại ở phase hardening.
- `system_settings` được dùng cho cấu hình VietQR và các cấu hình hệ thống nhỏ.
- `body_measurements` và `pt_goals` là nguồn dữ liệu cho portal hội viên và theo dõi khách PT.

Danh sách entity hiện tại cần xem là nguồn chính:

- `User`, `Role`.
- `Member`.
- `MembershipPlan`, `MemberMembership`.
- `Payment`, `DebtRecord`.
- `PtProfile`, `PtAssignment`, `PtSchedule`, `PtSessionPackage`, `PtSessionLog`, `MemberActivityLog`.
- `BodyMeasurement`, `PtGoal`.
- `ExerciseCategory`, `Exercise`.
- `SystemSetting`.

