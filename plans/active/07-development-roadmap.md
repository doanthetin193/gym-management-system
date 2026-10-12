# 07 - Roadmap triển khai hiện tại

Tài liệu này phản ánh roadmap MVP của project DUONG DOUBLE Gym Management ở môi trường local dev. Project hiện đã hoàn thiện Sprint 1-6 cho MVP vận hành nội bộ. Sprint 7 chỉ giữ nền cấu hình Groq để chuẩn bị cho một nghiệp vụ AI mới khi được chốt, chưa triển khai AI vào luồng vận hành chính.

Nguyên tắc chung:

- Bám mô hình phòng gym nhỏ 50-70 hội viên.
- Chỉ có `OWNER`, `PT`, `MEMBER` và khách vãng lai; không còn role `STAFF`.
- Ưu tiên vận hành thực tế: hội viên, gói tập, thu tiền, công nợ, PT, chỉ số, nhắc việc, báo cáo.
- AI chỉ dùng khi bài toán đủ giá trị vận hành/kinh doanh, dữ liệu gửi ra ngoài phải được ẩn danh và không chứa PII.
- Không làm payroll, import Excel tự động, thanh toán online tự xác nhận, Zalo API tự gửi tin hoặc LMS khóa học.
- Local dev là phạm vi hiện tại; production deploy để phase sau.

## Sprint 1 - Nền tảng hệ thống

Mục tiêu:

- Có backend/frontend chạy local, đăng nhập được và phân quyền cơ bản theo role.

Backend đã implement:

- Spring Boot API.
- PostgreSQL cho môi trường dev.
- Auth email/password.
- JWT login, current user API, change password.
- Role `OWNER`, `PT`, `MEMBER`.
- Seed dữ liệu dev cần thiết.
- Xử lý password an toàn bằng hash.

Frontend đã implement:

- React/Vite app.
- Login page dùng email/password.
- Layout quản trị theo role.
- Điều hướng sau đăng nhập theo quyền.
- Profile cá nhân và đổi mật khẩu.

Done hiện tại:

- OWNER/PT/MEMBER đăng nhập được.
- Route được bảo vệ theo role.
- Project chạy local bằng backend + frontend.

## Sprint 2 - Hội viên, gói tập và bảng giá

Mục tiêu:

- Thay thế quản lý hội viên/gói tập thủ công bằng hệ thống có lịch sử rõ ràng.

Backend đã implement:

- `members`.
- `membership_plans`.
- `member_memberships`.
- API tạo/sửa/tìm kiếm hội viên.
- API danh sách chi tiết hội viên.
- API gán/gia hạn gói.
- Logic active/inactive gói.
- 21 gói tập chuẩn theo tài liệu chủ phòng cung cấp.
- Tính trạng thái gói theo ngày bắt đầu/ngày hết hạn.

Frontend đã implement:

- Trang danh sách hội viên.
- Trang chi tiết hội viên.
- Form thêm/sửa hội viên.
- Trang gói tập và bảng giá.
- Bật/tắt gói đang bán.
- Dropdown gán/gia hạn chỉ hiện gói active.
- Luồng tạo hội viên trước, sau đó vào chi tiết để gán/gia hạn gói.

Done hiện tại:

- Tạo/sửa hội viên được.
- Gán/gia hạn gói được.
- Xem lịch sử gói được.
- Lọc/xem hội viên đang tập, hết hạn, còn nợ.
- Gói inactive không xuất hiện khi bán/gia hạn.

## Sprint 3 - Thanh toán, công nợ, VietQR và dashboard

Mục tiêu:

- Quản lý dòng tiền thực thu, công nợ và tổng quan vận hành phòng gym.

Backend đã implement:

- `payments`.
- `debt_records`.
- `financial_categories`.
- `financial_transactions`.
- Đồng bộ payment sang financial transaction.
- API thu tiền/công nợ.
- API dashboard OWNER.
- API VietQR setting.
- Chặn ngày thu tiền tương lai.
- Hỗ trợ `initialPaymentDate` khi bán/gia hạn gói để nhập dữ liệu cũ đúng tháng doanh thu.

Frontend đã implement:

- Dashboard OWNER.
- Trang thanh toán/công nợ.
- Thu nợ từng phần.
- Lịch sử thanh toán.
- Cài đặt VietQR tại `/settings`.
- Hiển thị QR tại chi tiết hội viên khi cần thu tiền.
- Bộ chọn nhanh ngày/tháng/năm cho các form ngày quan trọng.

Done hiện tại:

- Ghi nhận thanh toán khi bán/gia hạn gói.
- Trả thiếu sinh công nợ đúng số còn lại.
- Thu nợ từng phần và cập nhật số nợ đúng.
- Báo cáo doanh thu tính theo ngày thu tiền thực tế, không tự dồn vào tháng hiện tại khi nhập khách/gói cũ.
- VietQR chỉ hỗ trợ chuyển khoản thủ công, không tự xác nhận giao dịch ngân hàng.

## Sprint 4 - PT MVP, lịch tập và chỉ số cơ thể

Mục tiêu:

- Quản lý khách gói PT theo hướng đơn giản, phù hợp phòng gym nhỏ.

Backend đã implement:

- `pt_profiles`.
- `pt_assignments`.
- `pt_schedules`.
- `pt_session_packages`.
- `pt_session_logs`.
- `member_activity_logs`.
- `body_measurements`.
- `pt_goals`.
- Permission PT chỉ xem khách được phân công hoặc khách PT chưa có assignment để xử lý đăng ký mới.
- Validation ngày, buổi tập, lịch, chỉ số.

Frontend đã implement:

- Trang Lịch PT.
- Danh sách khách PT.
- Gán khách PT bằng dropdown/tìm kiếm.
- OWNER chọn PT phụ trách cho khách.
- PT tự nhận khách gói PT chưa có PT phụ trách.
- Đặt lịch PT.
- Ghi buổi PT, buổi tự ôn/hướng dẫn.
- Cập nhật chỉ số cơ thể.
- Cập nhật mục tiêu cá nhân.
- Portal hội viên xem tiến trình cá nhân.

Done hiện tại:

- Chỉ khách có gói PT mới xuất hiện trong luồng gán PT.
- Khách tự tập không đi vào vùng quản lý PT.
- Khách đã có PT active bị disable khi gán lại.
- PT chỉ thao tác dữ liệu được phép.
- Buổi PT/ôn tập được trừ theo gói.
- Chỉ số cơ thể và mục tiêu hiển thị cho OWNER/PT/MEMBER phù hợp quyền.

## Sprint 5 - Public TikTok Exercise Library và web giới thiệu

Mục tiêu:

- Xây dựng web public giới thiệu phòng gym và thư viện video TikTok công khai.

Backend đã implement:

- `exercise_categories`.
- `exercises`.
- Public read API cho danh mục/video.
- Owner API để tạo/sửa/xóa/bật tắt video.
- TikTok URL/video id.
- Slug, published status, view count.

Frontend đã implement:

- Trang chủ public.
- Bảng giá/gói tập public.
- Thông tin cơ sở vật chất, triết lý, liên hệ.
- Thư viện video TikTok public.
- Chi tiết video/bài tập public.
- Trang owner quản lý thư viện video.
- Copy/mở link chia sẻ.

Done hiện tại:

- Khách vãng lai xem được web giới thiệu và thư viện TikTok.
- Không cần đăng nhập để xem nội dung public.
- OWNER quản lý được video TikTok.
- Scope không còn YouTube, LMS hoặc training program theo tuần.

## Sprint 6 - Báo cáo, mục tiêu, nhắc việc và xuất dữ liệu

Mục tiêu:

- Hoàn thiện các màn vận hành cần thiết để chủ phòng kiểm soát tình hình phòng gym.

Backend đã implement:

- `business_goals`.
- API mục tiêu/progress.
- API report finance/member.
- API notification động từ dữ liệu nguồn.
- API member portal.
- API Google Sheet sync.
- Xuất dữ liệu `.xlsx` từ frontend.

Frontend đã implement:

- Trang báo cáo.
- Biểu đồ trạng thái hội viên.
- Biểu đồ doanh thu 6 tháng gần nhất.
- Export `.xlsx` theo nhóm dữ liệu và full backup nhiều sheet.
- Đồng bộ Google Sheet qua Apps Script URL + token.
- Trang mục tiêu tháng.
- Trang nhắc việc Zalo thủ công: hết hạn/sắp hết hạn, công nợ, sinh nhật.
- Portal `/my-progress` cho MEMBER.
- Tạo tài khoản portal nhanh cho hội viên.
- Tạo/quản lý tài khoản PT tại settings.

Done hiện tại:

- OWNER xem tổng hội viên, doanh thu, công nợ, lượt đăng ký/gia hạn.
- OWNER xuất được dữ liệu `.xlsx`.
- OWNER đồng bộ Google Sheet thủ công và thấy lỗi thật nếu Apps Script lỗi.
- OWNER tạo mục tiêu tháng và xem progress.
- OWNER/PT dùng nhắc việc để copy tin nhắn và mở Zalo thủ công.
- MEMBER xem được gói, công nợ, lịch sử thanh toán, lịch PT, chỉ số, biểu đồ tiến trình và mục tiêu.

## Sprint 7 - AI Extension Ready

Trạng thái hiện tại:

- Chưa triển khai chức năng AI nghiệp vụ cuối cùng.
- Đã giữ nền cấu hình Groq ở backend để tái sử dụng khi chọn được bài toán AI phù hợp.
- Đã loại bỏ AI phân tích chỉ số cơ thể khách PT vì giá trị thực tế chưa đủ cao so với chi phí gọi AI.

Nền kỹ thuật đang giữ:

- `GROQ_API_KEYS` cho nhiều key phân tách bằng dấu phẩy.
- `GROQ_MODEL` để đổi model trong môi trường dev.
- `GROQ_ENDPOINT` và `GROQ_TIMEOUT_SECONDS` trong cấu hình ứng dụng.

Nguyên tắc chọn chức năng AI sau này:

- Chỉ dùng AI cho bài toán đủ phức tạp, rule/hardcode không làm tốt.
- Ưu tiên dữ liệu tổng hợp, ẩn danh, không gửi PII như tên, SĐT, Zalo, email, địa chỉ.
- Không dùng AI cho chức năng phụ như nhắc việc đơn giản, tin nhắn mẫu hoặc nhận xét số đo cơ bản.
- AI nên hỗ trợ chủ phòng ở tầng vận hành/kinh doanh như giữ chân khách, phân tích doanh thu, phân khúc rủi ro hoặc cơ hội tăng trưởng.
- Chỉ gọi AI khi OWNER chủ động bấm phân tích, không gọi tự động thường xuyên để tránh tốn chi phí.

Ứng viên chức năng AI đang cân nhắc:

- AI Retention & Revenue Advisor: phân tích rủi ro mất khách và cơ hội doanh thu từ dữ liệu tổng hợp.
- AI Monthly Business Review: tạo báo cáo quản trị cuối tháng từ số liệu đã tổng hợp.
- AI Marketing Campaign Planner: đề xuất kế hoạch marketing ngắn hạn dựa trên nguồn khách, gói bán chạy và tình hình gia hạn.

Done khi chọn Sprint 7 thật sự:

- Có endpoint AI mới đúng nghiệp vụ đã chọn.
- Payload gửi AI được ẩn danh và có schema rõ ràng.
- UI hiển thị kết quả ở đúng trang vận hành, không làm rối luồng core.
- Backend test, frontend lint/build pass.

## Phạm vi không làm trong MVP hiện tại

- Deploy production.
- Docker/Nginx/VPS/backup production.
- Payroll/lương PT đầy đủ.
- Hoa hồng sale tự động.
- Import Excel/CSV tự động.
- Thanh toán online/webhook ngân hàng.
- Zalo API tự gửi tin.
- AI nâng cao: chatbot tự do, dự báo doanh thu, customer segmentation, tự tạo giáo án/dinh dưỡng chuyên sâu.
- Mobile app native.
- LMS/training program theo tuần.
- Premium/VIP content library.

## Tiêu chí chốt MVP hiện tại

MVP được xem là đạt khi:

- OWNER quản lý được hội viên, gói tập, thu tiền, công nợ, VietQR, báo cáo, mục tiêu, nhắc việc và thư viện TikTok.
- PT quản lý được khách PT được giao, đặt lịch, ghi buổi, cập nhật chỉ số và mục tiêu.
- MEMBER xem được tiến trình cá nhân nhưng không can thiệp nghiệp vụ quản trị.
- Khách vãng lai xem được trang giới thiệu, bảng giá và thư viện TikTok.
- Dữ liệu tài chính tính theo ngày thu tiền thực tế.
- Backend test pass.
- Frontend lint/build pass.

## Tài liệu đối chiếu hiện trạng

- Chi tiết implementation hiện tại: `plans/active/10-current-implementation-alignment.md`.
- Kịch bản test thủ công: `plans/active/09-manual-test-scenarios.md`.

