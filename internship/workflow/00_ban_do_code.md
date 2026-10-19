# Bản đồ tra cứu mã nguồn và tài liệu

## 1. Từ nghiệp vụ tới code

| Câu hỏi cần tìm hiểu | Điểm vào backend | Bài học |
| --- | --- | --- |
| Request được bảo vệ và trả lỗi thế nào? | `common/config`, `common/security`, `common/exception` | [Stage 1](stage_1/README.md), [Stage 2](stage_2/README.md) |
| Ai đăng nhập, đổi/reset mật khẩu, được cấp role gì? | `auth`, `user`, `common/security` | [Stage 2](stage_2/README.md), [nhân sự](stage_6/02_nhan_su_va_vietqr.md) |
| Ai là hội viên, tìm kiếm và phân quyền ra sao? | `member/web`, `member/service`, `member/repository` | [Hồ sơ hội viên](stage_3/01_ho_so_va_quyen_hoi_vien.md) |
| Gói mẫu, mua gói, gia hạn và hết hạn được tính ra sao? | `membership` | [Stage 3](stage_3/README.md) |
| Số nợ, phiếu thu, ngày thu và doanh thu thực thu? | `finance`, `dashboard/service` | [Stage 4](stage_4/README.md), [báo cáo](stage_7/01_dashboard_va_bao_cao.md) |
| Ai phụ trách, hẹn lịch, trừ buổi, lưu số đo/mục tiêu? | `pt`, `training` | [Stage 5](stage_5/README.md) |
| Hội viên đăng nhập xem dữ liệu của mình thế nào? | `member/web/MemberPortalController`, `member/service/MemberPortalService` | [Portal](stage_6/01_portal_hoi_vien.md) |
| Bài tập/video, VietQR, nhân sự? | `exercise`, `common/service`, `user` | [Stage 6](stage_6/README.md) |
| Chỉ số dashboard, nhắc việc, AI, XLSX/Sheets? | `dashboard`, `ai`, frontend `reports`/`reminders` | [Stage 7](stage_7/README.md) |
| Chạy local, test và theo dõi frontend gọi API? | `backend/pom.xml`, `backend/src/test`, `frontend/src` | [Stage 8](stage_8/README.md) |

Tên package trong bảng là đường dẫn tương đối dưới [`backend/src/main/java/com/gymduongdouble/backend`](../../backend/src/main/java/com/gymduongdouble/backend), trừ nơi đã ghi rõ frontend. Một nghiệp vụ có thể đi qua nhiều package: không nhất thiết class nào cùng tên tính năng cũng chứa toàn bộ logic.

## 2. Bản đồ dữ liệu để tự mở entity

```text
User ── user_roles ── Role
  │ (liên kết portal tùy trường hợp)
Member ── MemberMembership ── MembershipPlan
  │                │
  │                ├── DebtRecord ── Payment
  │                └── PtSessionPackage ── PtSessionLog
  ├── PtAssignment ── User (PT)
  ├── PtSchedule ──── User (PT)
  ├── MemberActivityLog
  ├── BodyMeasurement
  └── PtGoal
Exercise ── ExerciseCategory
SystemSetting: cấu hình theo key
PtProfile ── User
```

Sơ đồ chỉ giúp tìm đường, không phải ERD đầy đủ hoặc khẳng định cardinality/nullability ở mọi hướng. Ví dụ Payment có tham chiếu tới cả member, membership và debt; MemberActivityLog có thể liên kết membership/session package. Mở từng entity để kiểm tra `@ManyToOne`, `@OneToOne`, `@JoinColumn`, nullable, index và `@Version` thực tế. `deleted` nằm ở lớp cha nhiều entity nhưng không có nghĩa mọi thao tác xóa đều là soft delete.

## 3. Từ route UI tới bài học

| Màn hình | Route chính | Bài học liên quan |
| --- | --- | --- |
| Trang giới thiệu và bài tập công khai | `/`, `/exercises`, `/exercises/:slug` | [Thư viện](stage_6/03_thu_vien_bai_tap.md), [công khai](stage_7/04_nhac_viec_va_trang_cong_khai.md) |
| Đăng nhập và tài khoản | `/login`, `/profile` | [Đăng nhập](stage_2/01_tai_khoan_va_dang_nhap.md) |
| Hội viên và hồ sơ | `/members`, `/members/:memberId` | [Stage 3](stage_3/README.md) |
| Danh mục gói, thanh toán | `/membership-plans`, `/payments` | [Stage 3](stage_3/README.md), [Stage 4](stage_4/README.md) |
| Nhắc việc, báo cáo, tổng quan | `/reminders`, `/reports`, `/dashboard` | [Stage 7](stage_7/README.md) |
| Lịch PT, portal | `/pt-schedule`, `/my-progress` | [Stage 5](stage_5/README.md), [portal](stage_6/01_portal_hoi_vien.md) |
| Thư viện chủ phòng, cài đặt | `/owner/exercises`, `/settings` | [Stage 6](stage_6/README.md) |

Nguồn kiểm tra route là [`App.tsx`](../../frontend/src/app/App.tsx); quyền frontend chỉ là một lớp. Nếu cần biết client có thể truy cập API hay không, đọc controller và service tương ứng.

## 4. Một buổi review điển hình

Chọn “ghi buổi PT” làm ví dụ. Mở route `/pt-schedule` → tìm component/handler và API client → `PtController.createSessionLog` → request DTO → `PtService.createSessionLog` → các helper kiểm tra quyền, gói, lịch và trùng → entity/repository → response → UI nạp lại dữ liệu. Ghi lại các nhánh: sai member, gói hết hạn/hết buổi, lịch không khớp, status COMPLETED/MISSED/CANCELLED/RESCHEDULED. Cuối cùng thử với dữ liệu demo hoặc test độc lập, đối chiếu kết quả DB sau thành công và sau lỗi.

Để học sâu hơn, đặt breakpoint ở controller và service, quan sát giá trị sau mỗi nhánh; không ghi password, token hay thông tin thật vào screenshot. Luôn xác minh lại sau khi code thay đổi.
