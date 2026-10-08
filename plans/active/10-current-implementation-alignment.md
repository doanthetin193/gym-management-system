# 10 - Cập nhật kế hoạch theo implementation hiện tại

Cập nhật ngày 08/10/2026.

Tài liệu này dùng để đồng bộ lại kế hoạch sau giai đoạn nâng cấp UI và bổ sung nghiệp vụ bằng Antigravity. Từ thời điểm này, nếu tài liệu cũ còn khác với code hiện tại thì ưu tiên tài liệu này làm nguồn chốt scope.

## 1. Phạm vi chốt hiện tại

Hệ thống hiện đã chốt theo mô hình phòng gym nhỏ 50-70 hội viên, chỉ có chủ phòng và PT vận hành. Không còn role `STAFF`, không làm lễ tân riêng, không làm Sprint 7 trong giai đoạn hiện tại.

Phạm vi đủ dùng hiện tại:

- Web public giới thiệu phòng gym, bảng giá, cơ sở vật chất và thư viện video TikTok.
- Vùng quản trị cho OWNER.
- Vùng vận hành cho PT.
- Portal hội viên cho MEMBER xem tiến trình cá nhân.
- Quản lý member, gói tập, thanh toán, công nợ, VietQR, nhắc việc Zalo thủ công, lịch PT, chỉ số cơ thể, mục tiêu, báo cáo và xuất dữ liệu.

Ngoài scope hiện tại:

- Payroll/lương PT đầy đủ.
- Import dữ liệu Excel cũ.
- Thanh toán online tự động xác nhận.
- Auto Zalo/API gửi tin tự động.
- LMS/training program theo tuần.
- AI/ML/forecast nâng cao.
- Mobile native app.

## 2. Role và quyền

### OWNER

Chủ phòng có toàn quyền:

- Quản lý hội viên, gói tập, thanh toán, công nợ.
- Quản lý tài khoản PT và tài khoản portal hội viên.
- Quản lý VietQR, báo cáo, mục tiêu tháng, thư viện TikTok.
- Xem toàn bộ PT, lịch PT, chỉ số, mục tiêu và dashboard.

### PT

PT là người vận hành tại phòng khi chủ không trực:

- Tạo/sửa hội viên cơ bản.
- Gán/gia hạn gói và thu tiền cho hội viên trong phạm vi được phép.
- Tự gán khách PT chưa có PT phụ trách cho chính mình khi khách đăng ký gói PT.
- Xem khách được phân công và khách chưa có assignment để xử lý đăng ký mới.
- Cập nhật lịch PT, log buổi tập, buổi ôn tập, chỉ số cơ thể, mục tiêu.
- Không vào được báo cáo chủ phòng, mục tiêu kinh doanh, cài đặt hệ thống và quản lý thư viện admin.

### MEMBER

Hội viên chỉ có quyền xem:

- Gói hiện tại, hạn gói, công nợ.
- Buổi PT còn lại nếu có gói PT.
- Chỉ số cơ thể, biểu đồ tiến trình, mục tiêu cá nhân.
- Lịch PT gần nhất và lịch sử thanh toán.
- Bảng giá và liên hệ Zalo phòng gym.

MEMBER không tự kích hoạt gói, không tự xác nhận thanh toán, không tự chỉnh dữ liệu quản trị.

### Khách vãng lai

Khách không đăng nhập được xem:

- Trang giới thiệu.
- Bảng giá public.
- Thư viện video TikTok public.
- Thông tin liên hệ/Zalo.

## 3. Auth, tài khoản và bảo mật

Logic hiện tại:

- Đăng nhập bằng email/password.
- `rememberMe` được gửi từ frontend sang backend để backend cấp thời hạn token phù hợp.
- OWNER/PT/MEMBER dùng chung trang login, sau login điều hướng theo role.
- Có trang hồ sơ cá nhân `/profile`, hỗ trợ đổi mật khẩu.
- OWNER tạo/sửa/khoá/mở tài khoản PT tại `/settings`.
- OWNER hoặc PT được phép tạo tài khoản portal nhanh cho hội viên tại trang chi tiết hội viên.
- Mật khẩu tạm cho PT/member portal được nhập hoặc sinh ngẫu nhiên, không hard-code mật khẩu yếu trong UI.
- Script local đọc `.env`, không commit credential thật vào repo.

API liên quan:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`
- `GET/POST /api/v1/settings/team-users`
- `PUT /api/v1/settings/team-users/{id}/role`
- `PUT /api/v1/settings/team-users/{id}/status`
- `POST /api/v1/settings/team-users/{id}/reset-password`
- `DELETE /api/v1/settings/team-users/{id}`
- `POST /api/v1/members/{id}/portal-account`
- `PUT /api/v1/members/{id}/portal-account/status`
- `POST /api/v1/members/{id}/portal-account/reset-password`
- `DELETE /api/v1/members/{id}/portal-account`

## 4. Hội viên, gói tập và bảng giá

Logic hiện tại:

- Hệ thống seed đủ 21 gói chuẩn theo file `plans/drafts/draft_specs/02_DANH_SACH_21_GOI_TAP_CHUAN_HOA.md`.
- OWNER quản lý toàn bộ 21 gói ở `/membership-plans`.
- Mỗi gói có trạng thái active/inactive.
- Dropdown gán/gia hạn gói chỉ hiển thị gói đang active.
- Không xóa cứng gói đã dùng; nếu không bán nữa thì tắt active.
- Tạo hội viên trước, sau đó vào chi tiết hội viên để gán/gia hạn/đổi gói và ghi nhận thanh toán.
- Khi bán gói:
  - Trả đủ: tạo payment, công nợ bằng 0.
  - Trả thiếu: tạo payment phần đã thu và tạo/cập nhật debt phần còn lại.
- Nếu hội viên còn hạn, gói gia hạn tự nối tiếp sau ngày hết hạn cũ để không mất ngày.
- Nếu hội viên hết hạn hoặc chưa có gói, ngày bắt đầu theo ngày kích hoạt mới.

Luồng UI chính:

- `/members`: danh sách hội viên, tìm kiếm/lọc, bấm vào dòng để vào chi tiết.
- `/members/:memberId`: chi tiết hội viên, gán gói, thanh toán/công nợ, VietQR, tài khoản portal, lịch sử gói.
- `/membership-plans`: bảng giá 21 gói, lọc theo 5 nhóm chương trình, bật/tắt active.

## 5. Thanh toán, công nợ và VietQR

Logic hiện tại:

- `payments` là dòng tiền thực thu.
- `debt_records` là khoản còn phải thu.
- Thu nợ từng phần được phép; mỗi lần thu tạo payment mới và giảm nợ.
- Khi thu đủ, debt chuyển sang trạng thái đã thanh toán.
- Trang chi tiết hội viên hiển thị QR VietQR theo cấu hình hiện tại nếu hội viên còn nợ hoặc cần thanh toán.
- VietQR chỉ là hỗ trợ chuyển khoản thủ công, hệ thống không tự xác nhận giao dịch ngân hàng.
- OWNER cấu hình ngân hàng, số tài khoản, tên chủ tài khoản và tiền tố nội dung chuyển khoản tại `/settings`.
- Public site hoặc trang chi tiết chỉ đọc cấu hình QR qua public endpoint, không được sửa.

API liên quan:

- `GET/POST /api/v1/payments`
- `GET /api/v1/debts`
- `GET /api/v1/settings/vietqr` cho OWNER.
- `PUT /api/v1/settings/vietqr` cho OWNER.
- `GET /api/v1/public/vietqr-setting` cho public/member detail.

## 6. PT, lịch tập, check-in và chỉ số

Logic hiện tại:

- Chỉ hội viên có gói PT mới xuất hiện trong vùng gán khách PT.
- Hội viên tự tập không xuất hiện trong dropdown gán khách PT.
- Hội viên đã có PT active vẫn hiện để tham khảo nhưng bị disable, không chọn lại được.
- OWNER có thể chọn PT bằng dropdown và tìm hội viên theo tên/số điện thoại để gán.
- PT đăng nhập tài khoản riêng có thể tự gán khách gói PT chưa có PT phụ trách cho chính mình.
- PT assignment active là căn cứ phân quyền dữ liệu.
- PT log buổi tập phải khớp với member/session package/schedule hợp lệ.
- Trạng thái buổi tập hỗ trợ completed/cancelled/no-show/missed theo nghiệp vụ. Buổi no-show/missed có thể bị tính trừ buổi theo chính sách hiện tại.
- Body measurement dùng chủ yếu cho khách PT hoặc khách có theo dõi cá nhân, không bắt buộc cho hội viên tự tập.
- Portal hội viên hiển thị biểu đồ tiến trình để thấy thay đổi cân nặng, vòng eo, vòng ngực, vòng mông và các chỉ số mới nhất.

API liên quan:

- `GET /api/v1/pt/profiles`
- `POST /api/v1/pt/profiles`
- `GET /api/v1/pt/my-members`
- `POST /api/v1/pt/assignments`
- `GET/POST /api/v1/pt/schedules`
- `DELETE /api/v1/pt/schedules/{scheduleId}`
- `GET /api/v1/pt/session-packages`
- `GET /api/v1/pt/members/{memberId}`
- `POST /api/v1/pt/members/{memberId}/session-logs`
- `POST /api/v1/pt/members/{memberId}/activity-logs`
- `POST /api/v1/pt/members/{memberId}/body-measurements`
- `POST /api/v1/pt/members/{memberId}/goals`

## 7. Portal hội viên

Logic hiện tại:

- Portal nằm ở `/my-progress`.
- Chỉ role MEMBER vào được.
- Tài khoản MEMBER phải liên kết với một member cụ thể.
- Portal không phải kênh đăng ký online; chỉ là nơi xem thông tin và gửi yêu cầu thủ công qua Zalo.
- Hội viên xem được công nợ nhưng không tự xác nhận thanh toán.
- Hội viên xem được biểu đồ chỉ số nếu có dữ liệu body measurement.

API liên quan:

- `GET /api/v1/member-portal/me`

## 8. Nhắc việc Zalo thủ công

Logic hiện tại:

- Trang `/reminders` gom các nhóm việc cần chăm sóc:
  - Sắp hết hạn/đã hết hạn.
  - Còn nợ.
  - Sinh nhật.
- Hệ thống sinh mẫu tin nhắn tương ứng từng loại.
- Người dùng có thể copy tin nhắn hoặc copy và mở Zalo theo số zalo/phone của hội viên.
- Đây là luồng bán tự động, không gửi tin tự động qua API Zalo.

## 9. Báo cáo, mục tiêu và xuất dữ liệu

Logic hiện tại:

- `/dashboard` cho OWNER xem nhanh số vận hành.
- `/reports` cho OWNER xem:
  - Tổng hội viên.
  - Tổng doanh thu.
  - Tổng nợ phải thu.
  - Lượt đăng ký/gia hạn.
  - Biểu đồ phân bổ trạng thái hội viên.
  - Biểu đồ doanh thu 6 tháng gần nhất.
  - Thu chuyển khoản/tiền mặt tháng hiện tại.
  - Số gói đang niêm yết.
- `/reports` hỗ trợ xuất `.xlsx`:
  - Danh sách hội viên.
  - Lịch sử thanh toán.
  - Công nợ hội viên.
  - Bảng giá gói tập.
  - Full backup nhiều sheet.
- `/reports` hỗ trợ đồng bộ Google Sheet qua Apps Script Web App URL và token bảo mật.
- Đồng bộ Google Sheet phải đọc được phản hồi HTTP thật; nếu Apps Script lỗi hoặc từ chối, UI báo lỗi thật thay vì báo thành công giả.
- `/goals` quản lý mục tiêu tháng, actual/progress theo dữ liệu hiện có hoặc nhập thủ công khi chưa tự tính được.

API liên quan:

- `GET /api/v1/dashboard/owner`
- `GET/POST/PUT /api/v1/business-goals`
- `GET /api/v1/business-goals/progress`
- `GET /api/v1/reports/finance`
- `GET /api/v1/reports/members`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`

## 10. Public home và thư viện TikTok

Logic hiện tại:

- `/` là trang giới thiệu public, có thông tin phòng gym, bảng giá, triết lý, cơ sở vật chất, liên hệ.
- `/exercises` là thư viện video TikTok public.
- `/exercises/:slug` là trang chi tiết video/bài tập public.
- OWNER quản lý thư viện tại `/owner/exercises`.
- Chỉ hỗ trợ TikTok, không hỗ trợ YouTube trong scope hiện tại.
- Video có category, difficulty, slug, URL, trạng thái published và view count.

API liên quan:

- `GET /api/v1/public/exercise-categories`
- `GET /api/v1/public/exercises`
- `GET /api/v1/public/exercises/{slugOrId}`
- `POST /api/v1/public/exercises/{id}/view`
- `GET/POST/PUT /api/v1/owner/exercise-categories`
- `GET/POST/PUT /api/v1/owner/exercises`
- `PATCH /api/v1/owner/exercises/{id}/published`
- `DELETE /api/v1/owner/exercises/{id}`

## 11. Database/table thực tế cần xem là nguồn chính

Các nhóm entity đang dùng:

- Auth/user: `users`, `roles`, `user_roles`.
- Member: `members`.
- Membership: `membership_plans`, `member_memberships`.
- Finance: `payments`, `financial_categories`, `financial_transactions`, `debt_records`.
- PT: `pt_profiles`, `pt_assignments`, `pt_schedules`, `pt_session_packages`, `pt_session_logs`, `member_activity_logs`.
- Tracking: `body_measurements`, `pt_goals`.
- Exercise: `exercise_categories`, `exercises`.
- Dashboard/goals/settings: `business_goals`, `system_settings`.

Các bảng/entity đã loại khỏi scope hiện tại:

- `training_programs`, `training_program_weeks`.
- `exercise_media`.
- `member_notes`.
- `notifications` entity riêng.
- `audit_logs` entity riêng.

Ghi chú: notification hiện tại là response/báo cáo tính động từ dữ liệu nguồn, không phải bảng notification riêng bắt buộc.

## 12. Quy tắc dữ liệu quan trọng

- OWNER xem toàn bộ dữ liệu.
- PT chỉ xem dữ liệu member được phân công hoặc member chưa có assignment khi cần xử lý đăng ký mới.
- MEMBER chỉ xem member liên kết với tài khoản của mình.
- Membership plan inactive không xuất hiện trong dropdown bán/gia hạn.
- Không double-count doanh thu: payment là nguồn thu thật, financial transaction income được đồng bộ từ payment.
- Debt là phần còn phải thu, không thay thế payment.
- VietQR không tự xác nhận đã thanh toán.
- Google Sheet sync không được báo thành công nếu Apps Script không trả về trạng thái hợp lệ.

## 13. Tiêu chí chốt giai đoạn hiện tại

Giai đoạn hiện tại được xem là chốt khi:

- OWNER thao tác được toàn bộ luồng hội viên, gói tập, thu tiền, công nợ, VietQR, báo cáo.
- PT thao tác được luồng khách PT được giao và khách PT mới chưa có PT phụ trách.
- MEMBER xem được tiến trình cá nhân nhưng không can thiệp nghiệp vụ quản trị.
- Public site xem được thông tin giới thiệu, bảng giá và thư viện TikTok.
- Backend test pass.
- Frontend build pass.
- Frontend lint không có lỗi chặn build.

## 14. Cập nhật hardening ngày 08/10/2026

Các chỉnh sửa ngày 08/10/2026 được xem là một phần của implementation hiện tại:

- Seed OWNER không được tự reset mật khẩu ở mỗi lần chạy app. Nếu OWNER đã tồn tại và đã có `passwordHash`, hệ thống giữ nguyên mật khẩu hiện tại.
- Tài khoản portal hội viên chỉ được tạo/reuse cho user `MEMBER`-only do hệ thống sinh ra. Không reuse, xoá hoặc khoá nhầm tài khoản `OWNER`/`PT` khi tạo/xoá portal account.
- Tạo/gia hạn gói hội viên kèm tiền trả trước được xử lý atomic trong một transaction:
  - tạo `member_memberships`;
  - tạo/cập nhật `debt_records`;
  - tạo `payments`;
  - đồng bộ `financial_transactions` loại income;
  - đồng bộ `paidAmount` và `debtAmount`.
- Tổng công nợ ở màn hình hội viên và portal chỉ tính các debt còn mở (`OPEN`, `PARTIALLY_PAID`) và còn số tiền phải thu lớn hơn 0.
- Backend không còn dùng `ContentAccessLevel/contentAccessLevel`. Thư viện TikTok hiện là public, không có mô hình premium content trong scope hiện tại.
- PT hardening:
  - chỉ user có role `PT` mới được tạo hồ sơ PT, nhận assignment, nhận lịch dạy hoặc được gán mục tiêu PT;
  - chỉ khách có gói PT active, còn hạn và còn buổi mới được gán PT;
  - ghi log buổi PT sẽ đồng bộ trạng thái lịch PT tương ứng;
  - buổi ôn tập và buổi hướng dẫn/trị liệu được kiểm soát số buổi còn lại theo gói.
- Prod profile tạm tắt Flyway khi chưa có migration thật; giai đoạn dev hiện vẫn ưu tiên Hibernate update/drop-create theo nhu cầu reset dữ liệu.
- Frontend dọn lint warning: bỏ export/hằng số thừa, bỏ import không dùng, chuẩn hoá label nút PDF thành `In / lưu PDF`, và loại trạng thái PT không khớp enum backend.
- Kiểm tra sau cập nhật:
  - `backend`: `.\mvnw.cmd -q test` pass.
  - `frontend`: `npm run lint` pass.
  - `frontend`: `npm run build` pass, chỉ còn cảnh báo bundle size của Vite.
