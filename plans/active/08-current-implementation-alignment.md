# 08 - Đối Chiếu Implementation Hiện Tại

Cập nhật lần cuối: 16/10/2026.

Đây là nguồn đối chiếu nghiệp vụ và implementation cho phiên bản MVP hiện tại. Nếu một tài liệu cũ mâu thuẫn với file này và code, ưu tiên code, sau đó cập nhật lại tài liệu.

## 1. Scope đã chốt

Dương Double Gym Management đã hoàn thành ở mức local MVP:

- Web public, bảng giá và thư viện TikTok.
- Vận hành OWNER và PT.
- Portal MEMBER chỉ đọc.
- Hội viên, gói tập, phiếu thu, công nợ và VietQR.
- Lịch PT, buổi PT, tự ôn tập, số đo cơ thể và mục tiêu.
- Nhắc việc Zalo thủ công.
- Dashboard, báo cáo, XLSX và Google Sheet.
- AI Cố vấn Giữ chân và Doanh thu.
- Hardening JWT, password, rate limit và HTTP security headers.

Hệ thống chưa deploy production.

## 2. Role thực tế

### OWNER

OWNER quản lý toàn bộ nghiệp vụ. OWNER có thể được gán thêm role PT và seed OWNER hiện tại đã có role này, nên chủ phòng có thể tự nhận học viên và dạy PT mà không cần tài khoản quản trị riêng.

OWNER có quyền:

- Hội viên, bảng giá, gói, phiếu thu, công nợ và VietQR.
- PT profiles, phân công, điều chuyển PT và toàn bộ lịch PT.
- Tài khoản team và Portal.
- Dashboard, reports, AI, xuất XLSX, Google Sheet.
- Thư viện TikTok quản trị.

### PT

PT vận hành khách PT trong phạm vi phân quyền:

- Xem học viên đang được phân công.
- Tự nhận một học viên có gói PT hợp lệ chưa có phân công, khi PT cần xử lý khách đăng ký tại phòng.
- Đặt lịch, ghi buổi PT/tập tự ôn, đo chỉ số và đặt mục tiêu.
- Không tự gán khách cho PT khác, không điều chuyển phân công và không truy cập màn hình OWNER.
- Không đọc/sửa lương, teaching rate, sales commission rate hay active status của profile PT.

### MEMBER

MEMBER chỉ truy cập Portal my-progress của chính mình. Portal được OWNER cấp theo nhu cầu theo dõi tiến độ, chủ yếu cho hội viên gói PT. Endpoint cấp tài khoản hiện yêu cầu số điện thoại và không ràng buộc plan_type PT.

### Public

Khách vãng lai chỉ xem trang chủ, bảng giá, thư viện TikTok, bài tập chi tiết và VietQR public cần thiết cho hiển thị luồng thu tiền.

## 3. Auth và bảo mật

### Đăng nhập

- Đăng nhập bằng email hoặc số điện thoại Việt Nam đã chuẩn hóa.
- Token JWT mặc định 120 phút; remember me có thể cấp token 30 ngày.
- lastLoginAt cập nhật sau đăng nhập thành công và hiển thị trong Settings.

### Mật khẩu và thu hồi phiên

- Password tối thiểu 8 ký tự, có chữ và số.
- Password không được trùng email, số điện thoại hay password hiện tại.
- User có authVersion. Đổi password, reset password PT hay reset Portal đều tăng version để JWT cũ bị từ chối ngay.

### Rate limit

- Login: năm lần sai trong 15 phút theo cả IP và identifier. Kết quả là 429 kèm Retry-After; frontend hiển thị đếm ngược.
- Endpoint nhạy cảm: tối đa mười request trong 15 phút theo actor cho đổi password, tạo/reset team user, tạo/reset Portal và AI Advisor.
- Rate limiter hiện là in-memory, phù hợp một process local; không phải distributed rate limit.

### Bảo vệ HTTP

- API có X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Content-Security-Policy, Permissions-Policy và Cache-Control.
- CORS local chỉ chấp nhận các origin phát triển được cấu hình.
- API dùng JWT stateless; không dùng form login hay HTTP basic.

## 4. Hội viên và số điện thoại

- Member có tên, phone, ngày sinh, giới tính, địa chỉ, Zalo, source, status và note.
- Phone được chuẩn hóa trước khi lưu: bỏ khoảng trắng/ký tự ngăn cách và xử lý đầu số Việt Nam để tránh trùng hồ sơ dạng 0901 000 004 và 0901000004.
- Member status ACTIVE/INACTIVE/ARCHIVED. Hội viên không ACTIVE không được điều phối PT.
- PT được truy cập theo assignment policy và gói PT hợp lệ; OWNER xem toàn bộ.

## 5. Gói tập, trạng thái và gia hạn

- Bảng giá có active/inactive. Gói inactive chỉ để giữ lịch sử, không bán mới.
- MemberMembership lưu giá bán, giảm giá, đã thu, còn nợ, ngày bắt đầu/kết thúc, người bán và ghi chú.
- MembershipLifecyclePolicy tính hiệu lực theo ngày. Gói hiệu lực hôm nay được ưu tiên trước gói tương lai đã mua sẵn.
- Gói PENDING_PAYMENT, CANCELLED, EXPIRED hoặc ngoài khoảng ngày không được tiêu thụ buổi PT.
- Gói PT sinh PtSessionPackage với số buổi PT và tự ôn riêng.

## 6. Thu tiền, công nợ và báo cáo tài chính

### Quy tắc bán gói

1. Kích hoạt gói luôn tạo member_membership.
2. Nếu initialPaidAmount lớn hơn 0, tạo một payment_transactions tại initialPaymentDate và initialPaymentMethod.
3. Nếu initialPaidAmount bằng 0, không tạo payment. Phần còn lại tạo debt record.
4. Nếu thu một phần, phần chưa thu là debt record.

### Quy tắc thu nợ

- Mỗi lần thu nợ tạo payment_transactions mới, gắn đúng member, membership và debt record.
- Có thể thu nhiều đợt và dùng các phương thức khác nhau.
- Debt paid_amount, remaining_amount và status được cập nhật trong transaction.
- payment_date là ngày thu thực tế, không được là ngày tương lai.

### Báo cáo

- Doanh thu là tổng payment_transactions theo payment_date.
- Công nợ là tổng remaining_amount của debt OPEN/PARTIALLY_PAID.
- Hệ thống không quản lý expense, profit, cashflow ngoài gói tập hay mục tiêu vận hành.
- VietQR chỉ là thông tin chuyển khoản thủ công, không tự động xác nhận tiền về.

## 7. PT và tính đúng đắn số buổi

### Phân công

- Chỉ khách có plan PT và gói buổi còn hiệu lực được phân công.
- Khách tự tập không nằm trong danh sách chọn PT.
- Phân công cần PT tài khoản ACTIVE, profile active, ngày hợp lệ và gói PT hợp lệ.
- Assignment có hiệu lực dựa trên status, startDate, endDate hoặc hạn suy ra từ gói buổi của PT đó.

### Lịch hẹn

- Lịch hẹn có date, time, PT, học viên, note và trạng thái.
- Backend chặn trùng giờ giữa các lịch SCHEDULED của cùng PT và của cùng học viên.
- Lịch không tự trừ buổi. Xóa/đổi lịch không làm thay đổi session count.

### Ghi buổi và tự ôn

- Session log chỉ được ghi sau buổi PT thực tế; COMPLETED trừ một buổi PT.
- PRACTICE trừ một lượt tự ôn của đúng PT session package.
- GUIDANCE_CHECKIN dùng cho gói guidance/trị liệu, không dùng package PT.
- Backend chặn sai member-package, sai schedule, sai PT, trùng log, log ngày tương lai, gói chưa hiệu lực và hết lượt.
- Nếu hết hạn gói mà chưa dùng hết buổi, gói hết hiệu lực theo chính sách MVP; không tự động gia hạn.

## 8. Số đo, mục tiêu và Portal

### Số đo và mục tiêu

- Body measurement lưu chiều cao, cân nặng, ngực, eo, bụng, mông, đùi, tay và ghi chú; request phải có ít nhất một chỉ số.
- Mục tiêu lưu loại, mô tả, ngày bắt đầu/hạn, cân nặng mục tiêu, tỷ lệ mỡ mục tiêu, vòng eo mục tiêu, trạng thái và note.
- UI hiển thị theo dõi cân nặng/vòng eo. Trường tỷ lệ mỡ mục tiêu vẫn tồn tại ở data model/API nhưng không là chỉ số được nhập/hiển thị trong UI MVP.
- Không có AI phân tích chỉ số cá nhân hay AI giáo án trong luồng PT.

### Portal

- OWNER cấp liên kết users MEMBER - members 1-1.
- Portal lấy các gói hiệu lực, lịch sử gói, gói buổi, công nợ, payment, lịch PT, nhật ký PT, số đo và mục tiêu của một member liên kết.
- Portal chỉ đọc. Đổi password là thao tác tài khoản duy nhất của MEMBER.
- UI Portal khớp dữ liệu PT: cân nặng, eo, ngực, mông, đùi, tay khi có data; tiến độ trực quan hiển thị cho cân nặng/eo vì đó là hai target UI đang sử dụng.

## 9. Nhắc việc, báo cáo và AI

### Nhắc việc

Notifications được tính động từ dữ liệu membership, debt và ngày sinh. Trang Nhắc việc chỉ tạo nội dung để nhân viên copy/mở Zalo; không có Zalo API và không có notification table.

### Báo cáo và xuất dữ liệu

- Dashboard/Reports là OWNER only.
- Xuất XLSX cho hội viên, phiếu thu, công nợ, bảng giá và full backup nhiều sheet.
- Google Sheet đồng bộ qua Apps Script URL và token do người dùng nhập, lưu cục bộ ở trình duyệt; UI hiển thị lỗi nếu Apps Script thất bại.

### AI Cố vấn Giữ chân và Doanh thu

- Endpoint: POST /v1/ai/retention-revenue-advisor, OWNER only.
- Input gửi sang Groq là tổng hợp tháng và segment ẩn danh: số lượng hội viên, doanh thu, công nợ, source mix, doanh thu theo loại gói và nhóm rủi ro/cơ hội.
- Không gửi PII hay chi tiết giao dịch của cá nhân.
- Rule engine chấm segment trước. Groq chỉ diễn giải thành chiến lược, top rủi ro, cơ hội, kế hoạch 7 ngày và metrics.
- Groq keys lấy từ environment, có cơ chế thử key kế tiếp khi key hiện tại không dùng được.
- Nếu provider timeout, lỗi HTTP hoặc trả format không hợp lệ, backend trả fallback rule-based.

## 10. Thư viện TikTok

- Public API chỉ trả bài tập active.
- OWNER quản lý category/exercise và trạng thái published.
- TikTok video ID được tách từ URL để nhúng iframe.
- Không có view_count, API view, author TikTok hay thống kê video.

## 11. Database scope hiện tại

Bảng đang dùng:

- users, roles, user_roles.
- members.
- membership_plans, member_memberships.
- payment_transactions, debt_records.
- pt_profiles, pt_assignments, pt_schedules, pt_session_packages, pt_session_logs, member_activity_logs.
- body_measurements, pt_goals.
- exercise_categories, exercises.
- system_settings.

Không có bảng expense, audit_logs, notifications, business_goals, payroll, AI history, training_programs hay exercise_media.

## 12. Local development và migration

- Backend chạy localhost:8080/api; frontend mặc định localhost:5173.
- JPA dùng ddl-auto=update cho local dev.
- Flyway dependency và locations được giữ, flyway.enabled=false.
- Chuyển sang Flyway migration là công việc future deployment, không phải chức năng đã kích hoạt.

## 13. Tiêu chí chốt hiện tại

MVP được xem là ổn định trong phạm vi đã chốt khi:

- Luồng OWNER tạo hội viên -> bán gói -> thu nợ -> báo cáo đúng.
- Luồng PT phân công -> đặt lịch -> ghi buổi -> đo chỉ số -> Portal đồng bộ đúng.
- Role và phạm vi dữ liệu được backend bảo vệ.
- AI Advisor ẩn danh có fallback.
- Không có module chi phí, mục tiêu vận hành, AI chỉ số hay video analytics bị hiểu nhầm là chức năng hiện tại.

Hướng dẫn kiểm thử chi tiết luồng PT: 09-pt-operation-and-manual-test.md.
