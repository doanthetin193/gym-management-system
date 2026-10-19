# 03 - Thiết Kế Database

Cập nhật lần cuối: 19/10/2026.

## 1. Nguyên tắc

- PostgreSQL là nguồn dữ liệu nghiệp vụ.
- Dữ liệu giao dịch và vận hành được chuẩn hóa theo quan hệ; báo cáo được tính từ bảng nguồn.
- Các entity kế thừa BaseEntity có id và deleted. Các entity kế thừa AuditableEntity có thêm createdAt và updatedAt.
- deleted hiện là nền tảng dự phòng cho soft delete trong tương lai. MVP chưa tự nhận là đã có soft delete hoàn chỉnh, vì chưa có filter truy vấn và luồng xóa đồng bộ trên toàn hệ thống.
- Schema local dev hiện do JPA Hibernate cập nhật. Flyway dependency được giữ, nhưng config đang tắt.

Lưu ý đối chiếu schema ngày 18/10/2026: năm cột nháp `pt_profiles.base_salary`, `pt_profiles.teaching_rate`, `pt_profiles.sales_commission_rate`, `membership_plans.price_ratio` và `membership_plans.content_access_level` đã được loại trực tiếp khỏi PostgreSQL local sau khi đã loại mapping khỏi mã nguồn. Hibernate `ddl-auto=update` không tự xóa cột cũ; đây là lần dọn schema local có kiểm tra metadata, không phải Flyway migration versioned.

Ngày 19/10/2026, schema PostgreSQL local đang dùng được đối chiếu trực tiếp với mapping JPA: có đúng 19 bảng gồm 18 bảng từ entity và bảng liên kết `user_roles`; không thiếu/thừa bảng hoặc cột so với mapping đã kiểm tra. Sau khi xác nhận không có dữ liệu trùng, ba ràng buộc UNIQUE còn thiếu từ lịch sử schema đã được bổ sung: `members.phone`, `members.user_id` và `pt_profiles.user_id`. Lượt đối chiếu đầy đủ cũng xác nhận khóa ngoại `body_measurements.member_id -> members.id` đã tồn tại theo mapping; không giữ bản sao constraint trùng. Việc này chỉ đồng bộ database local hiện tại với entity, không thêm thực thể hay chức năng nghiệp vụ mới và chưa phải migration Flyway versioned.

## 2. Nhóm tài khoản và quyền

### users

Tài khoản đăng nhập cho OWNER, PT và MEMBER.

- id, email, phone, password_hash, full_name.
- status: ACTIVE, INACTIVE, LOCKED.
- last_login_at.
- auth_version để thu hồi JWT cũ sau đổi/reset password.
- created_at, updated_at, deleted.

email là duy nhất. phone là duy nhất nếu có giá trị. Password chỉ lưu hash.

### roles và user_roles

- roles lưu mã role OWNER, PT, MEMBER.
- user_roles là quan hệ nhiều-nhiều giữa users và roles.

Một OWNER có thể đồng thời có role PT. TeamUserResponse hiển thị OWNER nếu tài khoản có OWNER, nhưng role PT vẫn tồn tại để chủ phòng dạy PT.

## 3. Hội viên và gói tập

### members

Hồ sơ khách hàng.

- user_id có thể null, liên kết 1-1 với tài khoản MEMBER nếu được cấp Portal.
- full_name, phone, date_of_birth, gender, address, zalo_phone, source, status, note.
- created_at, updated_at, deleted.

phone là duy nhất và được chuẩn hóa về định dạng số di động Việt Nam trước khi lưu. status gồm ACTIVE, INACTIVE, ARCHIVED.

### membership_plans

Bảng giá được quản lý bởi OWNER.

- name, plan_type, pt_level.
- duration_days, default_price.
- pt_session_count, practice_session_count, guidance_session_count.
- description, active.
- created_at, updated_at, deleted.

plan_type gồm SELF_TRAINING, PT, GUIDANCE, OTHER. Gói inactive được giữ lịch sử nhưng không bán mới.

### member_memberships

Mỗi dòng là một lượt đăng ký hoặc gia hạn.

- member_id, plan_id, sold_by_user_id, created_by.
- start_date, end_date.
- actual_price, paid_amount, discount_amount, debt_amount.
- status và note.
- created_at, updated_at, deleted.

Trạng thái có thể ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT. Trạng thái hiệu lực được MembershipLifecyclePolicy tính theo ngày hiện tại và dữ liệu thanh toán; không chỉ dựa vào enum đã lưu.

## 4. Thu tiền và công nợ

### payment_transactions

Đây là tên bảng thực tế của entity Payment và là nguồn doanh thu thực thu.

- member_id, membership_id, debt_record_id, created_by.
- payment_date, amount, payment_method, revenue_category, description.
- created_at, deleted.

payment_method gồm CASH và BANK_TRANSFER. revenue_category gồm SELF_TRAINING, GUIDANCE, PT_MAIN, PT_NEW, OTHER_INCOME.

Một membership có thể có nhiều payment_transactions, vì khách có thể trả trước bằng chuyển khoản và trả nợ đợt sau bằng tiền mặt.

### debt_records

Công nợ gắn với hội viên và có thể gắn với một membership.

- member_id, membership_id.
- original_amount, paid_amount, remaining_amount, due_date.
- status, note, version.
- created_at, updated_at, deleted.

status gồm OPEN, PARTIALLY_PAID, PAID, CANCELLED. version là optimistic locking, tránh cập nhật đồng thời làm sai số dư.

Không có bảng expense, profit hay cashbook chi phí trong MVP.

## 5. PT và điều phối lịch

### pt_profiles

Hồ sơ PT liên kết 1-1 với users.

- user_id, pt_level, specialty, bio, active.
- created_at, updated_at, deleted.

Hồ sơ PT chỉ lưu dữ liệu phục vụ phân công và vận hành. MVP không lưu lương cứng, tỷ lệ dạy hoặc hoa hồng; việc trả lương nằm ngoài scope.

### pt_assignments

Phân công học viên cho PT.

- pt_user_id, member_id.
- start_date, end_date, status, note.
- created_at, updated_at, deleted.

status gồm ACTIVE, ENDED, PAUSED. Hiệu lực cần đồng thời thỏa trạng thái, khoảng ngày phân công và gói PT hợp lệ.

### pt_schedules

Lịch hẹn dạy PT.

- pt_user_id, member_id.
- schedule_date, start_time, end_time, status, note, created_by.
- created_at, updated_at, deleted.

status gồm SCHEDULED, COMPLETED, CANCELLED, MISSED, RESCHEDULED. Lịch chỉ điều phối thời gian, không tự trừ buổi.

### pt_session_packages

Số buổi được tạo từ membership có plan_type PT.

- member_id, pt_user_id, membership_id.
- tổng, đã dùng và còn lại của PT sessions.
- tổng, đã dùng và còn lại của practice sessions.
- start_date, end_date, status, version.
- created_at, updated_at, deleted.

status gồm ACTIVE, COMPLETED, CANCELLED, EXPIRED. version dùng optimistic locking khi trừ buổi.

### pt_session_logs

Nhật ký buổi PT 1-1.

- session_package_id, member_id, pt_user_id, schedule_id.
- session_date, session_number, weight, status, content, note, created_by.
- created_at, updated_at, deleted.

Buổi có status COMPLETED mới tiêu thụ một PT session. CANCELLED, MISSED và RESCHEDULED được lưu theo trạng thái và không tiêu thụ buổi.

### member_activity_logs

Nhật ký tự ôn tập hoặc check-in hướng dẫn.

- member_id, membership_id, session_package_id, created_by.
- activity_type, activity_date, session_number, weight, note.
- created_at, deleted.

activity_type gồm PRACTICE và GUIDANCE_CHECKIN. PRACTICE phải dùng session package của cùng membership PT. GUIDANCE_CHECKIN dùng membership guidance phù hợp.

## 6. Theo dõi cơ thể và mục tiêu

### body_measurements

- member_id, recorded_by, recorded_at.
- height, weight, chest, waist, abdomen, hip, thigh, arm, note.
- created_at, deleted.

Backend yêu cầu ít nhất một chỉ số và chặn ngày đo tương lai.

### pt_goals

- member_id, pt_user_id.
- goal_type, goal_description, start_date, target_date.
- target_weight, target_body_fat, target_waist.
- status, note.
- created_at, updated_at, deleted.

goal_type gồm FAT_LOSS, MUSCLE_GAIN, STRENGTH, FITNESS, HEALTH, OTHER. UI PT/Portal hiển thị theo dõi trực quan cho cân nặng và vòng eo; target_body_fat được dự trữ trong data model/API nhưng chưa là chỉ số tiến độ được hiển thị trong UI MVP.

## 7. Thư viện TikTok

### exercise_categories

- name, slug, description, icon_name, sort_order, active.
- created_at, updated_at, deleted.

slug là duy nhất.

### exercises

- category_id, name, slug.
- description, instruction, common_mistakes.
- difficulty, primary_muscle, equipment.
- tiktok_url, tiktok_video_id, thumbnail_url.
- featured, active.
- created_at, updated_at, deleted.

slug là duy nhất. Hệ thống không lưu view_count, author_name hay author_tiktok_url.

## 8. Cấu hình hệ thống

### system_settings

Bảng key-value cho cấu hình VietQR.

- setting_key, value, description, updated_at.

Keys đang được sử dụng:

- payment.vietqr.enabled
- payment.vietqr.bank_code
- payment.vietqr.bank_name
- payment.vietqr.account_number
- payment.vietqr.account_name
- payment.vietqr.transfer_prefix
- payment.vietqr.template

Không có bảng riêng cho notification, audit log, business goal, expense, payroll, import job, AI history hay training program.

## 9. Quan hệ chính

- User 1-1 PtProfile khi tài khoản là PT; `pt_profiles.user_id` là UNIQUE.
- User 1-1 Member khi tài khoản là Portal MEMBER; `members.user_id` là UNIQUE khi có giá trị.
- Member 1-n MemberMembership, Payment, DebtRecord, PtAssignment, PtSchedule, PtSessionPackage, PtSessionLog, MemberActivityLog, BodyMeasurement và PtGoal; `body_measurements.member_id` là khóa ngoại bắt buộc trỏ đến `members.id`.
- MembershipPlan 1-n MemberMembership.
- MemberMembership 1-n Payment, có thể 1-n DebtRecord và 1-n PtSessionPackage theo luồng nghiệp vụ.
- PtSessionPackage 1-n PtSessionLog và MemberActivityLog PRACTICE.
- PtSchedule có thể được tham chiếu bởi tối đa một PtSessionLog.
- ExerciseCategory 1-n Exercise.

## 10. Ràng buộc nghiệp vụ được service bảo vệ

- Số điện thoại hội viên được chuẩn hóa trước khi lưu và được bảo vệ thêm bằng UNIQUE `members.phone`; email và số điện thoại tài khoản cũng được mapping UNIQUE trong `users`.
- Một tài khoản Portal chỉ liên kết tối đa một Member và một tài khoản PT chỉ có tối đa một PtProfile nhờ UNIQUE trên hai cột `user_id` tương ứng.
- Ngày kết thúc không trước ngày bắt đầu.
- Ngày thu tiền và ngày ghi nhận không ở tương lai.
- Giá, giảm giá, tiền thu và số đo phải không âm; các chỉ số đo/mục tiêu phải dương khi có nhập.
- Payment thu nợ phải gắn đúng member, debt và membership.
- PT session package, membership và member phải khớp nhau trước khi trừ buổi.
- Gói PT chưa thanh toán, hủy, hết hạn hoặc hết buổi không được ghi buổi.
- Phân công PT và lịch hẹn chỉ có hiệu lực khi PT, hội viên và gói PT hợp lệ.

## 11. Migration và bảo trì schema

Local dev hiện dùng Hibernate ddl-auto=update để dễ phát triển. Flyway đã có dependency và thư mục migration, nhưng đang tắt. Khi cần thay đổi schema trên môi trường dài hạn, cần:

1. Chốt schema đang dùng.
2. Tạo migration versioned bằng Flyway.
3. Backup database trước khi áp dụng.
4. Bật Flyway và chuyển JPA sang validate hoặc chế độ phù hợp.

Không nên tự nhận đã có lịch sử migration production khi Flyway chưa được kích hoạt.
