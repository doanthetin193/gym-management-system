# 10 - Current Implementation Alignment

Cập nhật lần cuối: 12/10/2026.

Tài liệu này là nguồn đối chiếu hiện trạng implementation. Nếu tài liệu kế hoạch cũ khác với code hiện tại, ưu tiên file này và `07-development-roadmap.md` bản đã cập nhật.

## 1. Scope chốt hiện tại

Project hiện là MVP quản lý phòng gym nhỏ DUONG DOUBLE, chạy local dev, chưa deploy production.

Đã implement:

- Web public giới thiệu phòng gym, bảng giá, thư viện TikTok.
- Vùng quản trị OWNER.
- Vùng vận hành PT.
- Portal MEMBER `/my-progress`.
- Quản lý hội viên, gói tập, thanh toán, công nợ, VietQR.
- Quản lý khách PT, lịch PT, check-in buổi tập, chỉ số cơ thể, mục tiêu.
- Nhắc việc Zalo thủ công.
- Báo cáo, biểu đồ, export `.xlsx`, đồng bộ Google Sheet thủ công.
- Cài đặt tài khoản PT, portal hội viên và thông tin thanh toán.

Không làm trong MVP hiện tại:

- Deploy production.
- Payroll/lương PT đầy đủ.
- AI forecast/chatbot tự do/tạo giáo án tự động.
- Import Excel/CSV tự động.
- Thanh toán online/webhook ngân hàng.
- Zalo API tự gửi tin.
- LMS/training program theo tuần.
- YouTube exercise library.
- Mobile native app.

## 2. Role và quyền

### OWNER

- Toàn quyền hệ thống.
- Quản lý hội viên, gói tập, thanh toán, công nợ, VietQR.
- Quản lý tài khoản PT và tài khoản portal hội viên.
- Quản lý thư viện TikTok.
- Xem dashboard, báo cáo, mục tiêu, lịch PT và toàn bộ dữ liệu.

### PT

- Vận hành khách gói PT.
- Tạo/sửa thông tin hội viên cơ bản trong phạm vi cho phép.
- Gán chính mình cho khách gói PT chưa có PT phụ trách.
- Xem khách được phân công và khách PT chưa có assignment để xử lý đăng ký mới.
- Đặt lịch, ghi buổi PT, ghi buổi tự ôn/hướng dẫn, cập nhật chỉ số và mục tiêu.
- Không vào báo cáo OWNER, mục tiêu kinh doanh, cài đặt hệ thống hoặc quản lý thư viện admin.

### MEMBER

- Chỉ xem dữ liệu cá nhân tại `/my-progress`.
- Xem gói, hạn gói, công nợ, lịch sử thanh toán, lịch PT, buổi PT còn lại, chỉ số cơ thể, mục tiêu.
- Không tự mua/gia hạn gói.
- Không tự xác nhận thanh toán.
- Không chỉnh dữ liệu quản trị.

### Khách vãng lai

- Xem trang giới thiệu.
- Xem bảng giá.
- Xem thư viện video TikTok public.
- Xem thông tin liên hệ/Zalo.

## 3. Auth và tài khoản

- Đăng nhập bằng email/password.
- JWT auth.
- `rememberMe` được frontend gửi xuống backend để cấp thời hạn token phù hợp.
- OWNER/PT/MEMBER dùng chung trang login và điều hướng theo role.
- Có `/profile` để xem hồ sơ và đổi mật khẩu.
- OWNER tạo/khoá/mở/reset tài khoản PT tại `/settings`.
- OWNER tạo/khoá/mở/reset tài khoản portal cho hội viên tại trang chi tiết hội viên.
- PT không quản lý tài khoản đăng nhập của hội viên.
- Không hard-code credential thật trong code.

## 4. Hội viên, gói tập và bảng giá

- Seed đủ 21 gói chuẩn theo `plans/drafts/draft_specs/02_DANH_SACH_21_GOI_TAP_CHUAN_HOA.md`.
- Gói tập có trạng thái active/inactive.
- Gói inactive không hiện trong dropdown bán/gia hạn.
- Không xoá cứng gói đã có lịch sử; nếu không bán nữa thì tắt active.
- Tạo hội viên trước, sau đó vào chi tiết hội viên để gán/gia hạn/đổi gói.
- Nếu hội viên còn hạn, gói mới tự nối tiếp sau gói cũ để không mất ngày.
- Nếu hội viên hết hạn hoặc chưa có gói, ngày bắt đầu theo ngày kích hoạt mới.
- Danh sách hội viên cho phép tìm kiếm, lọc trạng thái và vào chi tiết bằng cách chọn dòng.

## 5. Thanh toán, công nợ và ngày thu tiền

Nguồn dữ liệu tài chính:

- `payments` là dòng tiền thực thu.
- `debt_records` là khoản còn phải thu.
- `financial_transactions` được đồng bộ từ payment để làm nguồn tổng hợp báo cáo.
- Không double-count doanh thu.

Luồng bán/gia hạn gói:

- Form gán/gia hạn có `Ngày bắt đầu gói` và `Ngày thu tiền` riêng.
- `Ngày thu tiền` mặc định là hôm nay để nhập khách hiện tại nhanh.
- Khi nhập khách/gói cũ, người dùng chọn lại `Ngày thu tiền` theo ngày đã thu thật.
- Nếu `paidAmount > 0`, frontend gửi `initialPaymentDate` xuống backend.
- Backend tạo payment ban đầu theo `initialPaymentDate`.
- Nếu `paidAmount = 0`, không tạo payment ban đầu; số còn lại thành công nợ.
- Backend chặn ngày thu tiền tương lai.

Ý nghĩa nghiệp vụ:

- Khách mới đóng hôm nay: để mặc định `Ngày thu tiền = hôm nay`.
- Khách cũ đã đóng tháng trước: chọn đúng ngày thu cũ để doanh thu về đúng tháng cũ.
- Khách đóng hôm nay nhưng bắt đầu gói sau: doanh thu vẫn ghi hôm nay vì tiền đã thu hôm nay.

Thu công nợ:

- Thu từng phần được phép.
- Mỗi lần thu tạo payment mới.
- Debt giảm theo số tiền đã thu.
- Thu đủ thì debt chuyển trạng thái đã thanh toán.
- Form thu nợ có ngày lập phiếu riêng và cũng chặn ngày tương lai.

VietQR:

- OWNER cấu hình ngân hàng, số tài khoản, tên chủ tài khoản và tiền tố nội dung chuyển khoản tại `/settings`.
- QR hiển thị ở chi tiết hội viên khi cần thu tiền.
- VietQR chỉ hỗ trợ chuyển khoản thủ công, không tự xác nhận giao dịch ngân hàng.

## 6. Bộ chọn ngày/tháng/năm

Đã thay các ô ngày native bằng component chọn nhanh ngày/tháng/năm để thao tác nhanh và ổn định hơn khi nhập dữ liệu dev/test.

Áp dụng cho:

- Thêm/sửa hội viên: ngày sinh.
- Gán/gia hạn gói: ngày bắt đầu gói, ngày thu tiền.
- Thu công nợ: ngày lập phiếu.
- Lịch PT: ngày tập.
- Ghi buổi PT, ghi buổi tự ôn/hướng dẫn.
- Cập nhật chỉ số cơ thể.
- Tạo mục tiêu PT.

## 7. PT, lịch tập và chỉ số

- Chỉ khách có gói PT mới xuất hiện trong luồng gán PT.
- Khách tự tập không xuất hiện trong dropdown gán PT.
- Khách đã có PT active vẫn có thể hiển thị để tham khảo nhưng bị disable, không chọn lại được.
- OWNER chọn PT phụ trách bằng dropdown.
- PT có thể tự nhận khách gói PT chưa có PT phụ trách.
- Assignment active dựa trên trạng thái, ngày bắt đầu và ngày kết thúc.
- PT chỉ xem/thao tác khách được phân công hoặc khách PT chưa có assignment.
- Ghi buổi PT phải khớp với member/session package/schedule hợp lệ.
- Không cho ghi buổi trước ngày bắt đầu gói, sau ngày hết hạn gói hoặc khi hết số buổi cần trừ.
- Chặn ghi trùng theo lịch/gói/ngày để tránh double-submit.
- Body measurement và mục tiêu chủ yếu phục vụ khách PT, không bắt buộc cho khách tự tập.
- Groq key/model vẫn được cấu hình ở backend để tái sử dụng cho Sprint 7 AI mới khi chốt đúng bài toán.
- Hiện tại không còn endpoint/panel AI phân tích chỉ số cơ thể trong luồng PT.

## 8. Portal hội viên

- Route: `/my-progress`.
- Chỉ role MEMBER vào được.
- Tài khoản MEMBER liên kết với đúng một hội viên.
- Hiển thị gói hiện tại, hạn gói, công nợ, lịch sử thanh toán.
- Hiển thị buổi PT, lịch PT, chỉ số cơ thể, biểu đồ tiến trình và mục tiêu nếu có dữ liệu.
- Có liên hệ Zalo phòng gym thủ công.
- Không cho hội viên tự kích hoạt gói hoặc xác nhận thanh toán.

## 9. Nhắc việc Zalo thủ công

Trang `/reminders` gom:

- Khách sắp hết hạn/đã hết hạn.
- Khách còn nợ.
- Sinh nhật.

Hệ thống sinh mẫu tin nhắn tương ứng. Người dùng có thể copy tin nhắn hoặc copy và mở Zalo theo số điện thoại/Zalo của hội viên. Không tự gửi tin qua Zalo API.

## 10. Báo cáo, mục tiêu và xuất dữ liệu

Dashboard OWNER:

- Tổng hội viên.
- Hội viên đang hoạt động.
- Hết hạn/sắp hết hạn.
- Tổng công nợ.
- Việc cần xử lý.
- Tổng quan tài chính.

Reports:

- Tổng hội viên.
- Tổng doanh thu.
- Tổng nợ phải thu.
- Lượt đăng ký/gia hạn.
- Biểu đồ trạng thái hội viên.
- Biểu đồ doanh thu 6 tháng gần nhất.
- Thu chuyển khoản/tiền mặt tháng hiện tại.
- Số gói đang niêm yết.

Export:

- Xuất `.xlsx` danh sách hội viên.
- Xuất `.xlsx` lịch sử thanh toán.
- Xuất `.xlsx` công nợ hội viên.
- Xuất `.xlsx` bảng giá gói tập.
- Xuất full backup nhiều sheet.
- Đồng bộ Google Sheet qua Apps Script Web App URL + token.
- Nếu Apps Script lỗi hoặc từ chối, UI báo lỗi thật.

Goals:

- Trang `/goals` quản lý mục tiêu tháng.
- Actual/progress lấy từ dữ liệu hiện có hoặc nhập thủ công với chỉ số chưa tự tính.

## 11. Public web và thư viện TikTok

- `/` là trang giới thiệu public.
- `/exercises` là thư viện video TikTok public.
- `/exercises/:slug` là trang chi tiết video/bài tập.
- `/owner/exercises` là trang OWNER quản lý thư viện.
- Chỉ hỗ trợ TikTok trong scope hiện tại.
- Video có category, difficulty, slug, URL, published status và view count.

## 12. Entity/table đang dùng

- Auth/user: `users`, `roles`, `user_roles`.
- Member: `members`.
- Membership: `membership_plans`, `member_memberships`.
- Finance: `payments`, `financial_categories`, `financial_transactions`, `debt_records`.
- PT: `pt_profiles`, `pt_assignments`, `pt_schedules`, `pt_session_packages`, `pt_session_logs`, `member_activity_logs`.
- Tracking: `body_measurements`, `pt_goals`.
- Exercise: `exercise_categories`, `exercises`.
- Dashboard/goals/settings: `business_goals`, `system_settings`.

Không còn dùng trong scope hiện tại:

- `training_programs`.
- `training_program_weeks`.
- `exercise_media`.
- `member_notes`.
- `notifications` entity riêng.
- `audit_logs` entity riêng.

Notification hiện là dữ liệu tính động từ hạn gói, công nợ, sinh nhật và dữ liệu PT.

## 13. Quy tắc dữ liệu quan trọng

- OWNER xem toàn bộ dữ liệu.
- PT chỉ xem dữ liệu đúng phạm vi phân công.
- MEMBER chỉ xem dữ liệu của chính mình.
- Payment là nguồn thu thật.
- Debt là khoản phải thu, không thay thế payment.
- Financial transaction income được đồng bộ từ payment.
- Doanh thu báo cáo theo `paymentDate`/`transactionDate`.
- Gói inactive không được bán/gia hạn mới.
- VietQR không xác nhận tự động.
- Google Sheet sync không được báo thành công giả.
- Ngày nghiệp vụ frontend dùng local date, không dùng UTC `toISOString().slice(0, 10)`.

## 14. Tiêu chí chốt MVP hiện tại

MVP hiện tại đạt khi:

- OWNER thao tác được toàn bộ luồng hội viên, gói tập, thanh toán, công nợ, VietQR, báo cáo, mục tiêu, nhắc việc và thư viện TikTok.
- PT thao tác được khách PT được giao và khách PT mới chưa có assignment.
- MEMBER xem được tiến trình cá nhân nhưng không can thiệp nghiệp vụ quản trị.
- Public web xem được thông tin giới thiệu, bảng giá và thư viện TikTok.
- Dữ liệu tài chính đúng tháng theo ngày thu tiền thực tế.
- Backend test pass.
- Frontend lint/build pass.

## 15. Ghi chú hardening đã làm

- Không còn role `STAFF`.
- Không còn content premium trong thư viện TikTok.
- Không còn training program/LMS theo tuần.
- Chuẩn hóa active membership theo `startDate <= today <= endDate`.
- Chặn gán PT sai role hoặc PT inactive.
- Chặn lịch PT trùng khung giờ.
- Chặn check-in/lưu chỉ số ở ngày tương lai.
- Chặn payment date và initial payment date ở tương lai.
- Không reset password OWNER seed nếu tài khoản đã tồn tại.
- Tài khoản portal hội viên không reuse nhầm OWNER/PT.
- Google Sheet sync đọc phản hồi thật.
- Xuất report `.xlsx` được tách helper để giảm phình page.

