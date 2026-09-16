# GYM DƯƠNG DOUBLE - KẾ HOẠCH OFFICIAL

## 1. Mục tiêu hệ thống

GYM DƯƠNG DOUBLE là hệ thống quản lý phòng gym nhỏ, tập trung giải quyết các vấn đề thực tế:

- Chủ phòng phải theo dõi thủ công khách sắp hết hạn, đã hết hạn.
- PT mất thời gian tổng hợp số buổi tập, tiến độ và chỉ số khách hàng.
- Chủ phòng cần nắm được tình hình khách hàng, doanh thu, gói tập, công nợ và hiệu quả vận hành.
- Member cần có nơi xem thông tin gói tập, chương trình tập và nội dung kiến thức.

Hệ thống được định hướng là một web application production nhỏ/vừa, dễ deploy trên VPS giá hợp lý, dễ bảo trì và có thể mở rộng sau này.

## 1.1 Bối cảnh đã chốt

- Phòng gym nhỏ, hiện khoảng 50-70 khách mỗi tháng.
- Dữ liệu khách mới và khách cũ từ trước đến nay khá nhiều, nhưng chủ phòng đã chốt MVP bắt đầu bằng dữ liệu mới, không cần import Excel cũ.
- Khách tự tập không điểm danh, vì vậy hệ thống không theo dõi được hành vi đi tập hằng ngày của nhóm này.
- Khách PT có ghi lại ngày tập, bài tập, buổi tập và tiến độ, nên đây là nhóm dữ liệu quan trọng nhất cho báo cáo tiến độ và AI sau này.
- Khách Giáo án/Hướng Dẫn là khách từng tập PT rồi mua giáo án để tự duy trì; nhóm này vẫn có check-in theo gói 30, 60 hoặc 90 buổi.
- Gói PT hiện tại gồm `20 PT + 20 Ôn tập`, `40 PT + 40 Ôn tập`, `60 PT + 60 Ôn tập`.
- `PT chính` là PT theo bảng giá chuẩn; `PT mới` là PT mới/học việc, giá khoảng 65% PT chính. Cột `Sinh viên` trong Excel cũ thực chất là doanh thu PT mới.
- AI không nằm trong MVP bắt buộc, nhưng MVP phải lưu dữ liệu đúng để có thể làm AI nhẹ ở phase sau.

Nguồn đối chiếu hiện tại:

- `APP GYM DUONG DOUBLE.md`: requirement gốc đã đồng bộ.
- `data_bonus.md`: ghi chú nháp từ 10 ảnh Excel/phiếu giấy chủ phòng cung cấp.
- `DATABASE_DESIGN_OPTIMIZED.md`: thiết kế database tối ưu sinh ra từ requirement và dữ liệu Excel.
- `GYM_DUONG_DOUBLE_AI_ROADMAP.md`: định hướng AI mở rộng sau MVP.

10 bảng/phiếu thủ công đã phân tích:

- Lịch dạy PT.
- Quản lý khách hàng hằng tháng.
- Tính lương PT.
- Mục tiêu hằng tháng.
- Tài chính năm.
- Thu hằng ngày.
- Tổng chi.
- Theo dõi khách hàng theo tuần.
- Check-in khách PT/chương trình.
- Tổng kết mục tiêu và thực tế của khách hàng.

## 2. Nhóm người dùng

Hệ thống có 3 nhóm người dùng chính:

| Role | Mô tả |
| --- | --- |
| OWNER | Chủ phòng gym, có quyền quản lý toàn bộ hệ thống |
| PT | Personal Trainer, quản lý khách được phân công và cập nhật tiến độ tập |
| MEMBER | Khách hàng/member, xem thông tin cá nhân, gói tập, chương trình tập và nội dung được phép truy cập |

Không có role lễ tân trong giai đoạn hiện tại vì phòng gym nhỏ, chủ phòng và PT trực tiếp vận hành.

## 3. Công nghệ sử dụng

### 3.1 Frontend

- React
- TypeScript
- Tailwind CSS v4
- React Router
- TanStack Query cho server state/cache API
- React Hook Form + Zod cho form validation
- Recharts cho biểu đồ dashboard
- Axios hoặc fetch wrapper riêng cho API client

Lý do chọn:

- React phù hợp làm dashboard, form quản lý và bảng dữ liệu.
- Tailwind CSS v4 giúp làm UI nhanh, dễ responsive.
- TanStack Query giúp xử lý cache API, refetch, loading/error state gọn hơn.
- TypeScript giúp giảm lỗi khi project lớn dần.

### 3.2 Backend

- Java 21
- Spring Boot 3.x
- Spring Web
- Spring Security
- Spring Data JPA
- Bean Validation
- Flyway
- PostgreSQL Driver
- Spring Scheduler
- Caffeine Cache

Lý do chọn:

- Spring Boot phù hợp làm REST API production.
- Spring Security hỗ trợ authentication/authorization tốt.
- JPA phù hợp CRUD và domain quản lý.
- Flyway giúp version database rõ ràng.
- Spring Scheduler đủ dùng cho nhắc sinh nhật, nhắc hết hạn trong monolith.
- Caffeine đủ cho cache nội bộ ở quy mô phòng gym nhỏ/vừa.

### 3.3 Database

- PostgreSQL

Lý do chọn:

- Ổn định, mạnh, miễn phí.
- Hỗ trợ constraint, index, transaction tốt.
- Phù hợp với VPS nhỏ và production monolith.

### 3.4 Deploy

Giai đoạn đầu:

- VPS Ubuntu 22.04/24.04
- Nginx reverse proxy
- Docker Compose
- PostgreSQL
- Spring Boot backend container
- React build static serve qua Nginx
- Cloudflare DNS/CDN
- HTTPS qua Cloudflare hoặc Let's Encrypt

Khuyến nghị VPS ban đầu:

- 2 vCPU
- 2-4 GB RAM
- 40 GB SSD/NVMe trở lên

Không cần Kubernetes, microservices hoặc streaming server riêng trong giai đoạn đầu.

## 4. Kiến trúc tổng thể

Hệ thống dùng Modular Monolith:

```text
Internet
  |
Cloudflare
  |
Nginx
  |
  |-- React static files
  |
  |-- /api -> Spring Boot
                 |
                 -> PostgreSQL
```

Backend là một ứng dụng Spring Boot duy nhất, nhưng chia module theo domain:

```text
backend
  auth
  user
  member
  membership
  pt
  training
  exercise
  finance
  notification
  dashboard
  common
```

Nguyên tắc:

- Một deployable backend duy nhất.
- Module có ranh giới rõ.
- Không để toàn bộ logic lẫn vào một service lớn.
- Không tách microservice quá sớm.
- Thiết kế database ngay từ đầu để lưu lịch sử thay vì chỉ lưu trạng thái hiện tại.

## 5. Nguyên tắc thiết kế sản phẩm

### 5.1 Ưu tiên tác vụ hằng ngày

Màn hình đầu tiên sau khi OWNER đăng nhập phải trả lời được:

- Hôm nay có ai hết hạn?
- 7 ngày tới có ai sắp hết hạn?
- Khách PT nào còn ít buổi?
- Hôm nay có sinh nhật ai?
- Doanh thu tháng này đang như thế nào?

### 5.2 Lưu lịch sử, không ghi đè

Không nên chỉ lưu:

```text
member.package_name
member.start_date
member.end_date
```

Nên tách thành:

```text
members
membership_plans
member_memberships
payments
```

Khi khách gia hạn, hệ thống tạo record mới thay vì ghi đè mất dữ liệu cũ.

`member_memberships` nên lưu thêm `sold_by_user_id` nếu có người sale/phụ trách bán gói, để phase payroll sau này tính hoa hồng sale theo số tiền khách đã thanh toán.

`membership_plans` nên có `content_access_level` để kiểm soát member được xem nội dung cơ bản hay premium/VIP trong thư viện bài tập/chương trình.

### 5.3 Video bài tập không lưu trên VPS

Video bài tập sẽ embed từ YouTube là chính.

Database chỉ lưu:

```text
exercise_media
  exercise_id
  provider: YOUTUBE
  url
  thumbnail_url
```

Lợi ích:

- VPS không phải stream video.
- Tiết kiệm storage/bandwidth.
- Dễ deploy hơn.
- Nếu nhiều member xem video cùng lúc, tải video nằm ở YouTube, không nằm ở server gym.

TikTok có thể hỗ trợ sau, nhưng YouTube nên là provider mặc định vì embed ổn định hơn.

### 5.4 Ảnh bài tập không lưu binary trong database

Database chỉ lưu URL ảnh.

Giai đoạn đầu có thể:

- Lưu ảnh trên VPS trong thư mục static/upload nếu số lượng ít.
- Hoặc dùng Cloudinary/S3-compatible storage nếu muốn chuẩn hơn.

Không lưu binary image/video trực tiếp vào PostgreSQL nếu không có lý do đặc biệt.

### 5.5 Không bê nguyên Excel vào database

Các sheet Excel/phiếu giấy hiện tại là biểu hiện của quy trình nghiệp vụ, không phải thiết kế database cuối cùng.

Nguyên tắc chuyển đổi:

- Dữ liệu nguồn như khách hàng, gói tập, thanh toán, chi phí, buổi PT, chỉ số cơ thể sẽ được lưu thành entity/table thật.
- Báo cáo như tổng thu, tổng chi, lợi nhuận năm, mục tiêu tháng, phần trăm hoàn thành sẽ được hệ thống tự tính.
- Không tạo bảng riêng theo tháng/năm như `khach_hang_thang_9` hoặc `tong_2026`.
- Các enum như `status`, `plan_type`, `payment_method`, `goal_type` xử lý trong code, không tạo bảng riêng nếu không cần quản trị động.

## 6. MVP - Phiên bản đầu nên làm

MVP tập trung vào những tính năng có giá trị thực tế cao nhất và giảm việc thủ công cho chủ phòng/PT.

### 6.1 Auth và phân quyền

Chức năng:

- Đăng nhập.
- Đăng xuất.
- Đổi mật khẩu.
- Quản lý user nội bộ.
- Role-based access control.

Role:

- OWNER: toàn quyền.
- PT: chỉ xem/cập nhật khách được phân công.
- MEMBER: chỉ xem thông tin của mình và nội dung được phép.

Nên dùng:

- JWT access token + refresh token nếu frontend React tách riêng backend API.
- Password hash bằng BCrypt.
- Backend check permission ở từng API quan trọng.

### 6.2 Quản lý member

Thông tin member:

- Họ tên.
- Số điện thoại.
- Ngày sinh.
- Giới tính.
- Địa chỉ, tùy chọn.
- Ghi chú.
- Trạng thái hoạt động.
- Ngày tạo.

Chức năng:

- Tạo member.
- Cập nhật member.
- Tìm kiếm theo tên/số điện thoại.
- Lọc theo trạng thái gói tập.
- Xem chi tiết member.
- Xem lịch sử gói tập.

Trạng thái gói tập có thể tính từ ngày hết hạn:

- ACTIVE: còn hạn trên 7 ngày.
- EXPIRING_SOON: còn hạn từ 1-7 ngày.
- EXPIRES_TODAY: hết hạn hôm nay.
- EXPIRED: đã hết hạn.
- NO_MEMBERSHIP: chưa có gói.

Lưu ý:

- Với khách tự tập, MVP không làm check-in.
- Không dùng dữ liệu "lâu chưa tập" cho khách tự tập vì hệ thống không ghi nhận hành vi đi tập.
- Nhóm này ưu tiên quản lý hạn gói, lịch sử gia hạn, tỷ lệ gia hạn và nhắc chăm sóc.

### 6.3 Quản lý gói tập

Thông tin gói tập:

- Tên gói.
- Loại gói: SELF_TRAINING, PT.
- Thời hạn theo ngày/tháng.
- Giá niêm yết.
- Mô tả.
- Trạng thái active/inactive.

Chức năng:

- Tạo gói.
- Sửa gói.
- Ẩn gói không dùng nữa.
- Không xóa cứng nếu gói đã có lịch sử đăng ký.

### 6.4 Đăng ký và gia hạn gói

Khi member mua gói:

- Chọn member.
- Chọn gói.
- Nhập ngày bắt đầu.
- Hệ thống tính ngày kết thúc.
- Nhập giá thực tế nếu có giảm giá.
- Nhập số tiền đã thanh toán.
- Tạo payment nếu có thu tiền.

Khi member gia hạn:

- Tạo bản ghi `member_memberships` mới.
- Giữ lại lịch sử gói cũ.
- Nếu gói cũ chưa hết hạn, ngày bắt đầu gói mới có thể mặc định là ngày sau ngày hết hạn cũ.
- OWNER có quyền sửa ngày bắt đầu/kết thúc nếu cần.

### 6.5 Dashboard OWNER

Chỉ số MVP:

- Tổng member.
- Member đang active.
- Member sắp hết hạn trong 7 ngày.
- Member đã hết hạn.
- Member mới trong tháng.
- Doanh thu tháng này.
- Sinh nhật hôm nay.
- Danh sách khách sắp hết hạn.
- Danh sách khách còn công nợ.

Dashboard nên có quick action:

- Tạo member.
- Gia hạn gói.
- Thêm thanh toán.
- Xem khách sắp hết hạn.

### 6.6 Module PT cơ bản

MVP chỉ làm vừa đủ, không biến thành app tracking tập luyện quá phức tạp.

Chức năng:

- OWNER gán PT cho member.
- Tạo gói PT với tổng số buổi.
- PT xem danh sách khách của mình.
- PT cập nhật số buổi đã tập.
- PT cập nhật bài tập đã tập trong buổi nếu cần.
- PT ghi chú sau mỗi buổi.
- PT cập nhật chỉ số cơ thể theo tuần.
- PT lưu mục tiêu tập luyện ban đầu của khách.

Chỉ số cơ thể MVP:

- Cân nặng.
- Chiều cao, tùy chọn.
- Vòng eo.
- Vòng ngực.
- Vòng mông.
- Body fat, tùy chọn.
- Ghi chú.

Phần PT là nền tảng dữ liệu quan trọng cho các tính năng sau này như progress score, báo cáo cuối gói, PT Customer Progress Analysis và PT Drop-off Risk.

### 6.7 Thư viện bài tập cơ bản

Chức năng:

- Quản lý nhóm cơ.
- Quản lý bài tập.
- Gắn ảnh minh họa.
- Gắn video YouTube embed.
- Tìm kiếm/lọc theo nhóm cơ.
- Member xem danh sách bài tập nếu có quyền.

Dữ liệu bài tập:

- Tên bài tập.
- Nhóm cơ chính.
- Nhóm cơ phụ, tùy chọn.
- Mô tả.
- Hướng dẫn tập.
- Lỗi sai thường gặp.
- Image URL.
- YouTube URL.
- Trạng thái public/private.

### 6.8 Tài chính cơ bản

MVP nên có tài chính ở mức vừa đủ để theo dõi doanh thu, chưa cần payroll phức tạp.

Chức năng:

- Ghi nhận thanh toán khi mua/gia hạn gói.
- Ghi nhận thu hằng ngày theo loại dịch vụ: tự tập, giáo án/chương trình, sinh viên, PT, thu khác.
- Ghi nhận chi phí theo danh mục: nhà, quảng cáo, điện, nước, rác, wifi, nước lọc, PT, marketing, thưởng/phạt khác.
- Xem doanh thu theo ngày/tháng.
- Xem tổng chi theo ngày/tháng.
- Tự tính lợi nhuận từ tổng thu - tổng chi.
- Xem công nợ member.

Loại giao dịch:

- INCOME.
- EXPENSE.

Nguồn thu:

- Gói member.
- Gói PT.
- Gia hạn.
- Thu khác.

Khoản chi:

- Tiền mặt bằng.
- Điện nước.
- Bảo trì.
- Lương.
- Chi khác.

Lưu ý về danh mục chi:

- Danh mục chi không cố định trong code.
- OWNER có thể tự tạo/sửa/ẩn danh mục chi như nhà, quảng cáo, điện, nước, rác, wifi, nước lọc, Kiệt, Tiên PT, Tiên MKT, thưởng lễ.
- `Kiệt` là tên nhân sự/PT; `Tiên PT` và `Tiên MKT` là cùng một người nhưng khác vai trò/khoản chi.
- Payroll/nhân sự chuẩn để phase sau; MVP chỉ cần expense category linh hoạt.

Lưu ý:

- `Tổng thu`, `Tổng chi`, `Tài chính năm` là báo cáo sinh từ dữ liệu thanh toán/giao dịch, không phải bảng nhập chính.
- Payroll/lương PT chi tiết để phase sau; công thức chính đã chốt để thiết kế sẵn đường mở rộng.
- Lương dạy PT = `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale PT = `10% * số tiền khách đã thanh toán`.

### 6.9 Member portal cơ bản

Member có thể:

- Đăng nhập.
- Xem thông tin cá nhân.
- Xem gói tập hiện tại.
- Xem ngày hết hạn.
- Xem lịch sử thanh toán cơ bản.
- Xem bài tập/chương trình được phép.

MVP chưa cần:

- Đặt lịch online.
- Thanh toán online.
- Chat với PT.

### 6.10 Mục tiêu tập luyện và check-in chương trình

Do ảnh Excel có phiếu `CHECK IN` và `CHƯƠNG TRÌNH TẬP LUYỆN THEO MỤC TIÊU`, MVP nên lưu được bản tối thiểu:

- Mục tiêu ban đầu của khách PT/chương trình.
- Số buổi PT.
- Buổi Ôn tập đi kèm gói PT.
- Check-in Giáo án/Hướng Dẫn theo gói 30, 60 hoặc 90 buổi.
- Cân nặng tại từng buổi nếu PT ghi.
- Mục tiêu theo tuần.
- Thực tế theo tuần, có thể làm đơn giản ở MVP hoặc đưa sang Phase 2.

Giai đoạn đầu không cần UI phức tạp, nhưng database nên chừa đúng cấu trúc để sau này làm progress report và AI.

## 7. Định hướng database tối ưu

Database chi tiết được mô tả trong `DATABASE_DESIGN_OPTIMIZED.md`.  
Trong official plan, database được định hướng theo các nhóm entity chính sau:

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
pt_goals
pt_schedules
pt_session_packages
pt_session_logs
member_activity_logs
pt_exercise_logs
body_measurements

training_programs
training_program_weeks

exercise_categories
exercises
exercise_media

business_goals
business_goal_progress

notifications
audit_logs
system_settings
customer_ai_scores
```

Nguyên tắc:

- `members`, `member_memberships`, `payments`, `financial_transactions`, `pt_session_logs`, `body_measurements` là dữ liệu nguồn.
- `Tổng thu`, `Tổng chi`, `Tài chính năm`, `% mục tiêu`, `bảng lương cuối tháng` là báo cáo/tính toán từ dữ liệu nguồn.
- Enum/code như `PlanType`, `MembershipStatus`, `PaymentMethod`, `ScheduleStatus`, `GoalType` xử lý trong code.
- Chỉ tạo bảng danh mục thật khi cần quản trị động, ví dụ `roles`, `financial_categories`, `exercise_categories`.

Index quan trọng:

- `members.phone`
- `member_memberships.member_id`
- `member_memberships.plan_id`
- `member_memberships.end_date`
- `member_memberships.status`
- `payments.member_id`
- `payments.payment_date`
- `financial_transactions.transaction_date`
- `financial_transactions.type`
- `financial_transactions.category_id`
- `pt_schedules.pt_user_id`
- `pt_schedules.schedule_date`
- `pt_session_logs.member_id`
- `pt_session_logs.pt_user_id`
- `pt_session_logs.session_date`
- `pt_exercise_logs.session_log_id`
- `body_measurements.member_id`
- `body_measurements.recorded_at`
- `training_programs.member_id`
- `training_program_weeks.program_id`
- `customer_ai_scores.member_id`

## 8. API định hướng

Base path:

```text
/api/v1
```

Nhóm API MVP:

```text
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /members
POST   /members
GET    /members/{id}
PUT    /members/{id}
GET    /members/{id}/memberships
POST   /members/{id}/memberships

GET    /membership-plans
POST   /membership-plans
PUT    /membership-plans/{id}

GET    /dashboard/owner

GET    /pt/my-members
GET    /pt/members/{id}
GET    /pt/schedules
POST   /pt/schedules
POST   /pt/members/{id}/session-logs
POST   /pt/session-logs/{id}/exercise-logs
POST   /pt/members/{id}/activity-logs
POST   /pt/members/{id}/body-measurements
POST   /pt/members/{id}/goals

GET    /training-programs
POST   /training-programs
GET    /training-programs/{id}/weeks
POST   /training-programs/{id}/weeks

GET    /exercise-categories
POST   /exercise-categories
GET    /exercises
POST   /exercises
GET    /exercises/{id}
PUT    /exercises/{id}

GET    /financial-transactions
POST   /financial-transactions
GET    /payments
POST   /payments

GET    /business-goals
POST   /business-goals
```

Tất cả API list phải có pagination:

```text
?page=0&size=20&sort=createdAt,desc
```

Không trả về toàn bộ danh sách nếu dữ liệu có thể lớn.

## 9. Frontend pages MVP

### OWNER

- Login.
- Dashboard.
- Members list.
- Member detail.
- Create/edit member.
- Renew membership.
- Membership plans.
- PT management.
- Finance basic.
- Exercise library management.
- Settings.

### PT

- Login.
- PT dashboard.
- My members.
- Member progress detail.
- Add session log.
- Add body measurement.

### MEMBER

- Login.
- My profile.
- My membership.
- Exercise library.
- Training content.

## 10. Phase 2 - Hoàn thiện vận hành phòng gym

### 10.1 Notification

Chức năng:

- Nhắc khách sắp hết hạn.
- Nhắc khách đã hết hạn.
- Nhắc sinh nhật.
- Nhắc khách PT còn ít buổi.
- Notification trong dashboard.

Kỹ thuật:

- Spring Scheduler chạy hằng ngày.
- Lưu notifications vào database.
- OWNER/PT xem trong app.

Zalo:

- Giai đoạn này chỉ nên làm nút mở nhanh Zalo/chat theo số điện thoại nếu phù hợp.
- Auto gửi Zalo chỉ làm khi đã xác minh được Zalo Official Account/API/chính sách.

### 10.2 Công nợ chi tiết

Chức năng:

- Hóa đơn/gói tập có tổng tiền, đã trả, còn lại.
- Lịch sử thanh toán từng đợt.
- Danh sách member còn nợ.
- Lọc công nợ theo PT/gói/thời gian.

### 10.3 Báo cáo tài chính nâng cao

Chức năng:

- Doanh thu theo ngày/tuần/tháng/quý/năm.
- Chi phí theo danh mục.
- Lợi nhuận.
- Biểu đồ doanh thu.
- Export Excel.

### 10.4 Quản lý lịch PT

Chức năng:

- PT tạo lịch dạy.
- OWNER xem lịch PT.
- Gán member vào lịch.
- Đánh dấu đã hoàn thành/hủy/vắng.

Chưa cần realtime calendar phức tạp, có thể bắt đầu bằng list + calendar view đơn giản.

### 10.5 Training program theo tuần

Chức năng:

- Tạo chương trình tập luyện theo mục tiêu.
- Lưu thời hạn theo tuần.
- Nhập mục tiêu từng tuần.
- Ghi nhận số buổi thực tế.
- Ghi nhận kết quả thực tế và ghi chú.

Đây là phần số hóa phiếu `CHƯƠNG TRÌNH TẬP LUYỆN THEO MỤC TIÊU`.

### 10.6 Báo cáo tiến độ khách PT

Chức năng:

- So sánh mục tiêu ban đầu và kết quả hiện tại.
- Chart chỉ số cơ thể.
- Tổng hợp số buổi đã tập.
- Nhận xét của PT.
- Export PDF sau này.

### 10.7 Business goals

Chức năng:

- Đặt mục tiêu tháng theo hạng mục.
- Theo dõi tiến độ theo giai đoạn ngày 1-10, 11-20, 21-hết tháng.
- So sánh mục tiêu và thực tế.
- Tự tính phần trăm hoàn thành.

Đây là phần số hóa bảng `MỤC TIÊU THÁNG`.

### 10.8 Import dữ liệu cũ

Không làm trong MVP vì chủ phòng đã chốt bắt đầu bằng dữ liệu mới. Nếu phase sau cần nhập lịch sử, chức năng có thể gồm:

- Import member từ Excel/CSV.
- Import lịch sử gói tập nếu dữ liệu cũ có ngày bắt đầu/ngày hết hạn.
- Import lịch sử thanh toán nếu dữ liệu cũ đủ sạch.
- Import dữ liệu PT cũ nếu có session/bài tập/chỉ số cơ thể.

Nguyên tắc:

- Không import mù toàn bộ nếu dữ liệu quá bẩn.
- Cần preview trước khi import.
- Cần log lỗi từng dòng để chỉnh dữ liệu.
- Dữ liệu lịch sử càng sạch thì báo cáo và AI sau này càng có giá trị.

## 11. Phase 3 - HR, payroll, business analytics

### 11.1 Nhân sự

Vì phòng gym nhỏ, HR nên để sau.

Chức năng:

- Hồ sơ PT/nhân sự.
- Lịch làm việc.
- Chấm công đơn giản.
- Trạng thái nhân sự.

### 11.2 Tính lương và hoa hồng

Để Phase 3 vì không phải nhu cầu MVP, nhưng công thức cốt lõi đã được chủ phòng chốt.

Thành phần có thể có:

- Lương cứng.
- Hoa hồng sale gói member.
- Hoa hồng sale gói PT.
- Hoa hồng theo buổi dạy.
- Thưởng.
- Khấu trừ.

Nên có bảng cấu hình rule, không hard-code công thức vào code quá sớm.

Mapping từ Excel `LƯƠNG PT`:

- Lương cố định -> base salary.
- Lương dạy khách -> teaching commission.
- Lương sale -> sales commission.
- Thưởng -> bonus item.
- Phạt -> penalty item.
- Tổng lương -> report/tính toán cuối kỳ.

Quy tắc đã chốt:

- Lương dạy PT chỉ tính trên số buổi PT thực dạy, không tính buổi Ôn tập.
- Công thức lương dạy: `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale: `10% * số tiền khách đã thanh toán`.
- Nếu khách thanh toán nhiều đợt, hoa hồng sale phát sinh theo số tiền thực nhận từng đợt.

### 11.3 Mục tiêu kinh doanh

Chức năng:

- Đặt mục tiêu doanh thu năm/tháng.
- So sánh actual vs target.
- Biểu đồ tiến độ.
- Tỉ lệ khách mới/khách cũ.
- Tỉ lệ tái tục gói.

Lưu ý:

- Mục tiêu tháng cơ bản có thể làm từ Phase 2.
- Business analytics nâng cao như forecast, so sánh nhiều kỳ, cohort khách hàng nên để Phase 3+.

### 11.4 AI nhẹ và analytics nâng cao

AI được định hướng chi tiết trong `GYM_DUONG_DOUBLE_AI_ROADMAP.md`.

Nguyên tắc đồng bộ:

- Không làm churn ML cho toàn bộ khách tự tập khi không có check-in.
- Khách tự tập dùng renewal analytics, expiry management và rule-based reminder.
- Khách PT là nơi ưu tiên AI vì có session log, exercise log và body measurement.
- Ưu tiên PT Customer Progress Analysis và PT Drop-off Risk ở phase sau.
- Giai đoạn đầu dùng rule-based score, sau này đủ dữ liệu mới train ML batch.

## 12. Phase 4 - Premium content nâng cao và mở rộng

### 12.1 Premium training content

MVP đã có nền tảng phân quyền nội dung bằng `content_access_level` trên gói tập và `ExerciseVisibility` trên bài tập. Phase 4 là phần mở rộng/thương mại hóa nội dung premium nâng cao.

Chức năng:

- Tạo nội dung/chương trình tập mẫu theo mục tiêu để member xem.
- Mục tiêu: giảm mỡ, tăng cơ, tăng sức mạnh, fitness.
- Chương trình gồm nhiều ngày/tuần.
- Gán bài tập vào từng buổi.
- Member/VIP hoặc gói có quyền premium mới xem được nội dung premium nâng cao.

Lưu ý:

- Phần này khác với `training_programs` vận hành cho khách PT ở Phase 2.
- Phase 2 là theo dõi chương trình cá nhân của khách thật.
- Phase 4 là thư viện nội dung/chương trình mẫu có thể thương mại hóa.

### 12.2 Knowledge sharing

Chức năng:

- Bài viết kiến thức.
- Hướng dẫn tập luyện.
- Dinh dưỡng cơ bản.
- Public/private/member-only.

### 12.3 Thanh toán online

Chỉ làm khi cần:

- Tạo đơn thanh toán online.
- Tích hợp cổng thanh toán.
- Webhook xác nhận thanh toán.

Ban đầu chưa cần vì phòng gym nhỏ có thể thu tiền trực tiếp và OWNER ghi nhận vào hệ thống.

## 13. Non-functional requirements

### 13.1 Performance

- API list dùng pagination.
- Query lọc hết hạn phải lọc ở database, không lấy tất cả rồi lọc trong Java.
- Tạo index cho cột hay lọc: phone, end_date, status, member_id, created_at.
- Dashboard query cần tối ưu, có thể cache ngắn hạn nếu cần.

### 13.2 Security

- Password hash BCrypt.
- HTTPS production.
- RBAC bắt buộc.
- PT không được xem member không được phân công.
- MEMBER chỉ được xem dữ liệu của mình.
- Validate input ở backend.
- Không expose PostgreSQL ra Internet.
- Dùng environment variables cho secret.

### 13.3 Data integrity

- Foreign key đầy đủ.
- Transaction cho nghiệp vụ tạo gói + tạo payment.
- Không xóa cứng dữ liệu đã phát sinh lịch sử.
- Dùng soft delete hoặc active/inactive với gói tập, bài tập.
- Flyway migration cho mọi thay đổi schema.

### 13.4 Backup

- Backup PostgreSQL hằng ngày.
- Lưu backup tối thiểu 7-14 ngày.
- Có tài liệu restore database.
- Trước khi deploy migration lớn phải backup.

### 13.5 Logging và monitoring

- Log lỗi backend.
- Log các hành động quan trọng: tạo member, gia hạn gói, ghi nhận thanh toán, sửa giao dịch.
- Spring Boot Actuator cho health check.
- Docker restart policy hoặc systemd để auto restart.

### 13.6 Responsive

- OWNER dashboard ưu tiên desktop/laptop.
- PT và MEMBER cần dùng tốt trên mobile.
- Form cần gọn, dễ thao tác nhanh trên điện thoại.

## 14. Production deployment plan

### 14.1 Cấu trúc deploy đề xuất

```text
/opt/gym-duong-double
  docker-compose.yml
  .env
  nginx
    nginx.conf
  backend
    app.jar
  frontend
    dist
  backups
```

### 14.2 Docker Compose services

- nginx
- backend
- postgres

Có thể thêm sau:

- redis nếu cần cache/session riêng.
- minio nếu muốn object storage tự host, nhưng ban đầu không cần.

### 14.3 Environment variables

Backend:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://postgres:5432/gym
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
JWT_SECRET=...
JWT_ACCESS_TOKEN_TTL=...
JWT_REFRESH_TOKEN_TTL=...
CORS_ALLOWED_ORIGINS=https://domain.com
```

Frontend:

```text
VITE_API_BASE_URL=https://domain.com/api/v1
```

### 14.4 Nginx

Nginx phụ trách:

- Serve React static files.
- Reverse proxy `/api` sang backend.
- Security headers cơ bản.
- Gzip/brotli nếu cấu hình.
- Cache static assets.

### 14.5 Cloudflare

Dùng Cloudflare cho:

- DNS.
- CDN static assets.
- HTTPS.
- Chặn bot/traffic bất thường ở mức cơ bản.

## 15. Thứ tự triển khai đề xuất

### Sprint 1 - Nền tảng

- Khởi tạo backend Spring Boot.
- Khởi tạo frontend React + Tailwind CSS v4.
- Cấu hình PostgreSQL + Flyway.
- Auth login.
- RBAC OWNER/PT/MEMBER.
- Layout dashboard cơ bản.

### Sprint 2 - Member và membership

- CRUD member.
- CRUD membership plan.
- Đăng ký gói.
- Gia hạn gói.
- Lịch sử gói.
- Lọc member sắp hết hạn/đã hết hạn.

### Sprint 3 - Dashboard và tài chính cơ bản

- Dashboard OWNER.
- Ghi nhận thu hằng ngày.
- Ghi nhận chi phí.
- Doanh thu cơ bản.
- Tổng chi cơ bản.
- Lợi nhuận cơ bản.
- Payment khi đăng ký/gia hạn.
- Công nợ cơ bản.
- Sinh nhật hôm nay.

### Sprint 4 - PT MVP

- Gán PT cho member.
- PT dashboard.
- Session log.
- Activity log/ôn tập nếu cần.
- Exercise log cơ bản nếu cần ghi bài tập trong từng buổi.
- Body measurement.
- PT goal/mục tiêu ban đầu.
- Xem tiến độ cơ bản.

### Sprint 5 - Training program, exercise library và member portal

- Training program theo tuần.
- Weekly target vs actual.
- CRUD nhóm cơ.
- CRUD bài tập.
- Embed YouTube.
- Member xem bài tập/chương trình được phép.
- Hoàn thiện responsive mobile.

### Sprint 6 - Business goals và báo cáo vận hành

- Business goals theo tháng.
- Theo dõi tiến độ 1-10, 11-20, 21-hết tháng.
- Báo cáo tài chính nâng cao cơ bản.
- Không đưa import Excel cũ vào sprint MVP.

### Sprint 7 - Production hardening

- Logging.
- Global exception handler.
- Validation đầy đủ.
- Index database.
- Docker Compose.
- Nginx config.
- Backup script.
- Deploy VPS staging/production.

## 16. Những việc chưa nên làm sớm

- Microservices.
- Kubernetes.
- Streaming video riêng.
- Upload video lên VPS.
- Redis khi chưa có bottleneck.
- Payment online khi chưa có nhu cầu thật.
- Auto Zalo khi chưa xác minh API/chính sách.
- Payroll đầy đủ trước khi các flow member/PT/finance ổn định.
- Import Excel cũ khi chủ phòng đã chốt làm dữ liệu mới.
- Workout tracking quá chi tiết như app fitness lớn.
- AI/ML thật khi chưa có dữ liệu đủ sạch.
- Computer Vision.

## 17. Kết luận định hướng

Hướng phù hợp nhất cho GYM DƯƠNG DOUBLE:

- React + TypeScript + Tailwind CSS v4 cho frontend.
- Java 21 + Spring Boot 3 cho backend.
- PostgreSQL cho database.
- Modular Monolith cho kiến trúc.
- Docker Compose + Nginx + Cloudflare để deploy VPS.
- YouTube embed cho video bài tập.
- Lưu lịch sử gói tập, thanh toán và tiến độ PT ngay từ đầu.
- Tách dữ liệu nguồn khỏi báo cáo Excel.
- Dùng `DATABASE_DESIGN_OPTIMIZED.md` làm cơ sở thiết kế schema.

MVP nên tập trung vào:

- Member.
- Membership.
- Hết hạn/gia hạn.
- Dashboard OWNER.
- PT cơ bản.
- Tài chính cơ bản.
- Thu hằng ngày và chi phí cơ bản.
- PT session/check-in chương trình.
- Body measurement.
- Training goal cơ bản.
- Exercise library có YouTube embed.
- Phân quyền OWNER/PT/MEMBER.

Sau khi MVP chạy tốt mới mở rộng sang PT schedule nâng cao, training program theo tuần, business goals, import Excel, payroll, business analytics, premium content, AI/analytics và tích hợp bên thứ ba.
