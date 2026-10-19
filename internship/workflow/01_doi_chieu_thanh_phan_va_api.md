# Danh mục đối chiếu thành phần, API và dữ liệu

Trang này giúp bạn không bỏ sót các **nhóm chức năng** khi review backend. Đây là bản đồ của source trong workspace, không phải bằng chứng mọi nhánh đã được kiểm thử. Các mapping dưới đây lấy từ controller; URL gọi local còn có tiền tố `/api`. Phân quyền ở annotation là lớp đầu tiên, còn phải đọc service/policy để biết quyền trên từng bản ghi.

## 1. Tài khoản, hội viên và gói

| Controller | Method và path sau `/api` | Quyền và bài đọc |
| --- | --- | --- |
| [`AuthController`](../../backend/src/main/java/com/gymduongdouble/backend/auth/web/AuthController.java) | `POST /v1/auth/login`; `GET /v1/auth/me`; `POST /v1/auth/change-password` | Login public; hai API còn lại cần xác thực. [Stage 2](stage_2/README.md). |
| [`MemberController`](../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberController.java) | `GET, POST /v1/members`; `GET, PUT /v1/members/{id}` | OWNER/PT, có kiểm tra nghiệp vụ trong service. [Hội viên](stage_3/01_ho_so_va_quyen_hoi_vien.md). |
| Cùng controller | `POST /v1/members/{id}/portal-account`; `PUT /v1/members/{id}/portal-account/status`; `POST /v1/members/{id}/portal-account/reset-password`; `DELETE /v1/members/{id}/portal-account` | OWNER. [Portal](stage_6/01_portal_hoi_vien.md). |
| [`MemberPortalController`](../../backend/src/main/java/com/gymduongdouble/backend/member/web/MemberPortalController.java) | `GET /v1/member-portal/me` | MEMBER; dữ liệu được chọn theo user đang xác thực. |
| [`MembershipPlanController`](../../backend/src/main/java/com/gymduongdouble/backend/membership/web/MembershipPlanController.java) | `GET, POST /v1/membership-plans`; `GET /v1/membership-plans/all`; `PUT /v1/membership-plans/{id}/active` | GET danh sách active cho OWNER/PT; các thao tác còn lại cho OWNER. [Danh mục gói](stage_3/02_danh_muc_goi_tap.md). |
| [`MemberMembershipController`](../../backend/src/main/java/com/gymduongdouble/backend/membership/web/MemberMembershipController.java) | `GET, POST /v1/members/{memberId}/memberships` | OWNER/PT, kèm policy hội viên. [Đăng ký gói](stage_3/03_dang_ky_va_vong_doi_goi.md). |

## 2. Tiền, PT và báo cáo

| Controller | Method và path sau `/api` | Quyền và bài đọc |
| --- | --- | --- |
| [`PaymentController`](../../backend/src/main/java/com/gymduongdouble/backend/finance/web/PaymentController.java) và [`DebtController`](../../backend/src/main/java/com/gymduongdouble/backend/finance/web/DebtController.java) | `GET, POST /v1/payments`; `GET /v1/debts` | OWNER/PT, có lọc quyền hội viên. [Stage 4](stage_4/README.md). |
| [`PublicMembershipPlanController`](../../backend/src/main/java/com/gymduongdouble/backend/membership/web/PublicMembershipPlanController.java) | `GET /v1/public/membership-plans` | Public; chỉ trả gói active và DTO gói tối thiểu cho bảng giá, không dùng response quản trị. [Stage 3](stage_3/README.md). |
| [`PtController`](../../backend/src/main/java/com/gymduongdouble/backend/pt/web/PtController.java) | `GET, POST /v1/pt/profiles`; `GET /v1/pt/my-members`; `POST /v1/pt/assignments`; `PUT /v1/pt/assignments/{assignmentId}/reassign` | Phần lớn OWNER/PT; đổi PT phụ trách yêu cầu OWNER. [Phân công](stage_5/01_phan_cong_va_lich_pt.md). |
| Cùng controller | `GET, POST /v1/pt/schedules`; `DELETE /v1/pt/schedules/{scheduleId}`; `GET /v1/pt/session-packages`; `GET /v1/pt/members/{memberId}` | OWNER/PT, service kiểm tra thêm PT, hội viên, ngày, gói và lịch tùy method. |
| Cùng controller | `POST /v1/pt/members/{memberId}/session-logs`, `/activity-logs`, `/body-measurements`, `/goals` | Mỗi path viết đầy đủ bằng tiền tố `/v1/pt/members/{memberId}`. OWNER/PT và kiểm tra từng bản ghi. [Ghi buổi và chỉ số](stage_5/02_ghi_buoi_chi_so_muc_tieu.md). |
| [`DashboardController`](../../backend/src/main/java/com/gymduongdouble/backend/dashboard/web/DashboardController.java) | `GET /v1/dashboard/owner`, `/v1/reports/finance`, `/v1/reports/members`, `/v1/notifications` | OWNER. [Dashboard](stage_7/01_dashboard_va_bao_cao.md). |
| [`AiAdvisorController`](../../backend/src/main/java/com/gymduongdouble/backend/ai/web/AiAdvisorController.java) | `POST /v1/ai/retention-revenue-advisor` | OWNER; nội dung rule và provider có giới hạn riêng. [AI](stage_7/02_ai_retention_revenue.md). |

## 3. Cài đặt, video và public

| Controller | Method và path sau `/api` | Quyền và bài đọc |
| --- | --- | --- |
| [`TeamUserController`](../../backend/src/main/java/com/gymduongdouble/backend/user/web/TeamUserController.java) | `GET, POST /v1/settings/team-users`; `PUT /v1/settings/team-users/{id}/role`, `/{id}/status`; `POST /v1/settings/team-users/{id}/reset-password` | Các path rút gọn sau dấu `;` dùng tiền tố `/v1/settings/team-users`; OWNER. [Nhân sự](stage_6/02_nhan_su_va_vietqr.md). |
| [`SettingsController`](../../backend/src/main/java/com/gymduongdouble/backend/common/web/SettingsController.java), [`PublicSettingsController`](../../backend/src/main/java/com/gymduongdouble/backend/common/web/PublicSettingsController.java) | `GET, PUT /v1/settings/vietqr`; `GET /v1/public/vietqr-setting` | Settings cần OWNER; endpoint public được phép truy cập công khai. Client công khai chỉ dựng QR khi cấu hình trả về đang bật và đủ dữ liệu nhận tiền. |
| [`OwnerExerciseController`](../../backend/src/main/java/com/gymduongdouble/backend/exercise/web/OwnerExerciseController.java) | `GET, POST /v1/owner/exercise-categories`; `PUT /v1/owner/exercise-categories/{id}`; `GET, POST /v1/owner/exercises`; `PUT, DELETE /v1/owner/exercises/{id}`; `PATCH /v1/owner/exercises/{id}/published` | OWNER. [Thư viện](stage_6/03_thu_vien_bai_tap.md). |
| [`PublicExerciseController`](../../backend/src/main/java/com/gymduongdouble/backend/exercise/web/PublicExerciseController.java) | `GET /v1/public/exercise-categories`, `/v1/public/exercises`, `/v1/public/exercises/{slugOrId}` | Public; danh sách/chi tiết vẫn áp điều kiện active. |
| [`HealthController`](../../backend/src/main/java/com/gymduongdouble/backend/common/web/HealthController.java) | `GET /v1/health` | Public theo cấu hình security. Actuator health là endpoint khác: `/actuator/health` sau context path. |

Nhóm đường dẫn ở trên chỉ là mục lục; muốn biết query parameter, request body, response và trường hợp lỗi, mở method và DTO liên quan. Không suy ra API sửa/xóa tồn tại nếu controller không khai báo.

## 4. Entity trong source và bảng được khai báo

Các tên sau là `@Table(name=...)` của entity hiện tại, **không phải kết quả kiểm tra schema PostgreSQL đang chạy**. Database local đã có lịch sử riêng có thể chứa bảng/cột dư; `ddl-auto: update` không chứng minh nó sẽ tự xóa tất cả schema cũ.

| Entity | Bảng khai báo | Đọc cùng |
| --- | --- | --- |
| `User`, `Role` | `users`, `roles`; quan hệ role qua `user_roles` | [Đăng nhập](stage_2/01_tai_khoan_va_dang_nhap.md), [nhân sự](stage_6/02_nhan_su_va_vietqr.md) |
| `Member` | `members` | [Hội viên](stage_3/01_ho_so_va_quyen_hoi_vien.md), [portal](stage_6/01_portal_hoi_vien.md) |
| `MembershipPlan`, `MemberMembership` | `membership_plans`, `member_memberships` | [Stage 3](stage_3/README.md) |
| `DebtRecord`, `Payment` | `debt_records`, `payment_transactions` | [Stage 4](stage_4/README.md) |
| `PtProfile`, `PtAssignment`, `PtSchedule` | `pt_profiles`, `pt_assignments`, `pt_schedules` | [Phân công và lịch](stage_5/01_phan_cong_va_lich_pt.md) |
| `PtSessionPackage`, `PtSessionLog`, `MemberActivityLog` | `pt_session_packages`, `pt_session_logs`, `member_activity_logs` | [Buổi tập](stage_5/02_ghi_buoi_chi_so_muc_tieu.md) |
| `BodyMeasurement`, `PtGoal` | `body_measurements`, `pt_goals` | [Chỉ số và mục tiêu](stage_5/02_ghi_buoi_chi_so_muc_tieu.md) |
| `Exercise`, `ExerciseCategory` | `exercises`, `exercise_categories` | [Thư viện](stage_6/03_thu_vien_bai_tap.md) |
| `SystemSetting` | `system_settings` | [Cấu hình VietQR](stage_6/02_nhan_su_va_vietqr.md) |

`BaseEntity` và `AuditableEntity` là mapped superclass, không phải hai bảng entity riêng. `@Table` cũng chưa mô tả đầy đủ constraint, index, schema cũ hay tình trạng dữ liệu; muốn đối chiếu thực tế phải kiểm tra database một cách chỉ đọc và không công bố bí mật.

## 5. Kiểm tra frontend và tích hợp ngoài

[`App.tsx`](../../frontend/src/app/App.tsx) là nguồn đối chiếu route: public gồm `/`, `/exercises`, `/exercises/:slug`, `/login`; MEMBER có `/my-progress`; OWNER có dashboard, reports, settings và owner exercises; OWNER/PT có members, membership plans, payments, reminders và pt-schedule; `/profile` nằm trong protected route. Quyền từng API vẫn lấy từ backend, không mặc định giống guard UI.

Những chức năng không chỉ nằm ở backend: xuất XLSX và gọi Apps Script chạy từ frontend, nhắc việc có logic frontend, nhúng TikTok phụ thuộc bên thứ ba, còn Groq được gọi từ backend. Đọc [xuất và đồng bộ](stage_7/03_xuat_du_lieu_va_dong_bo.md), [nhắc việc/public](stage_7/04_nhac_viec_va_trang_cong_khai.md) và [AI](stage_7/02_ai_retention_revenue.md) để phân biệt ranh giới.

## 6. Cách tự chứng minh một luồng

1. Chọn một dòng trong các bảng trên; mở controller, request/response DTO, service, repository, entity và UI gọi nó.
2. Ghi method, quyền, tham số, điều kiện nghiệp vụ, dữ liệu thay đổi và transaction. Đánh dấu chỗ nào mới là giả định.
3. Thiết kế case thành công, sai quyền, ID không khớp và các giá trị biên; dùng dữ liệu demo, không dùng mật khẩu hay thông tin khách thật.
4. Sau khi chạy, đối chiếu response và database test, ghi bằng chứng. Bài chưa chạy chỉ được ghi là kịch bản dự kiến, không ghi PASS.

Tham khảo [kiểm thử backend](stage_8/01_kiem_thu_backend.md) và [chạy local](stage_8/02_chay_local_va_doc_loi.md). Bản đồ này cần được cập nhật khi code thay đổi.
