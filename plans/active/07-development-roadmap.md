# 07 - Roadmap Triển Khai Đã Hoàn Thành

Cập nhật lần cuối: 16/10/2026.

Roadmap này đã được viết lại theo code đã có. Các sprint bên dưới là các phần đã hoàn thành, không phải backlog mở. Project hiện đang chốt ở local development và không có sprint deploy production.

## Sprint 1 - Nền tảng hệ thống

Mục tiêu: có ứng dụng chạy được với phân tách frontend/backend/database và phân quyền cơ bản.

Đã hoàn thành:

- Spring Boot Java 21, PostgreSQL, JPA, validation, Actuator và React/Vite/TypeScript.
- JWT stateless, role OWNER/PT/MEMBER và route guard frontend.
- Data initializer, tài khoản OWNER seed và demo data phục vụ local.
- Cấu trúc modular monolith theo auth, user, member, membership, finance, PT, training, exercise, dashboard, AI và common.

Tiêu chí kết quả: đăng nhập, phân quyền role và kết nối frontend/backend hoạt động.

## Sprint 2 - Hội viên, gói tập và bảng giá

Mục tiêu: quản lý được vòng đời hội viên và lịch sử gói.

Đã hoàn thành:

- Tạo/sửa/tìm kiếm/lọc hội viên.
- Chuẩn hóa số điện thoại Việt Nam và chặn trùng phone.
- Bảng giá active/inactive.
- Đăng ký/gia hạn gói với giá thực tế, giảm giá, ngày bắt đầu/kết thúc.
- Lifecycle policy ưu tiên gói đang hiệu lực khi có gia hạn sớm.
- Tạo gói buổi khi bán gói PT.

Tiêu chí kết quả: khách tự tập và khách PT có luồng đăng ký rõ ràng, lịch sử không mất.

## Sprint 3 - Thu tiền, công nợ và VietQR

Mục tiêu: doanh thu được tính đúng theo tiền đã thu, không theo ngày bắt đầu gói.

Đã hoàn thành:

- Phiếu thu ban đầu khi kích hoạt gói và debt record cho phần còn thiếu.
- Thu nợ từng phần, nhiều đợt, nhiều phương thức thu trên cùng một gói.
- Chặn ngày thu tiền tương lai.
- VietQR thu công, cấu hình bởi OWNER.
- Báo cáo doanh thu từ payment_date; loại bỏ scope chi phí, lợi nhuận và mục tiêu vận hành.

Tiêu chí kết quả: dữ liệu khách cũ có thể nhập bằng ngày thu quá khứ mà báo cáo vẫn về đúng tháng.

## Sprint 4 - Vận hành PT, lịch hẹn và tiến độ

Mục tiêu: phù hợp quy trình PT của phòng gym nhỏ và không làm sai số buổi.

Đã hoàn thành:

- OWNER có thể phân công/điều chuyển PT; PT có thể tự nhận khách PT chưa có phân công.
- OWNER có thể đồng thời là PT để trực tiếp dạy.
- Chỉ khách có gói PT đang hiệu lực được vào luồng PT.
- Đặt lịch, kiểm tra trùng lịch PT/học viên.
- Ghi buổi PT, tự ôn tập, hướng dẫn; trừ đúng loại buổi sau khi đã diễn ra.
- Form ghi buổi cho chọn rõ lịch SCHEDULED phù hợp để liên kết, hoặc ghi độc lập; không tự ghép lịch theo ngày.
- Chặn sai member-package, trùng log, gói chưa thanh toán, hết hạn, hủy, hết lượt và ngày tương lai.
- Ghi số đo cơ thể và mục tiêu PT.

Tiêu chí kết quả: lịch hẹn không tự trừ buổi; chỉ nhật ký buổi hoàn thành mới cập nhật tiến độ.

## Sprint 5 - Portal hội viên và thư viện TikTok public

Mục tiêu: tạo trải nghiệm xem tiến độ cho học viên PT và kênh nội dung public nhẹ.

Đã hoàn thành:

- OWNER cấp/khóa/reset/xóa tài khoản Portal MEMBER.
- Chỉ cấp mới Portal cho hội viên `ACTIVE` có gói tập hiệu lực; gói tự tập vẫn có thể được cấp để xem thông tin cá nhân, còn dữ liệu PT chỉ hiển thị khi tồn tại.
- Portal chỉ đọc dữ liệu cá nhân: gói, công nợ, toàn bộ phiếu thu, lịch SCHEDULED còn ở tương lai theo giờ Việt Nam, buổi, số đo và mục tiêu. Gói PT được chọn theo trạng thái và thời hạn thực tế.
- Thư viện TikTok public, trang chi tiết và trang OWNER quản lý danh mục/video.
- TikTok chỉ nhúng video để xem; không quản lý lượt xem hay tác giả TikTok.

Tiêu chí kết quả: MEMBER không thể truy cập nghiệp vụ quản trị, khách vãng lai xem được nội dung public.

## Sprint 6 - Dashboard, báo cáo, nhắc việc và xuất dữ liệu

Mục tiêu: hỗ trợ chủ phòng theo dõi tình hình phòng gym từ dữ liệu đã ghi nhận.

Đã hoàn thành:

- Dashboard OWNER và báo cáo hội viên/doanh thu/công nợ.
- Nhắc việc gia hạn, công nợ và sinh nhật; copy/mở Zalo thủ công.
- Xuất XLSX và full backup nhiều sheet ở frontend.
- Đồng bộ Google Sheet qua Apps Script URL và token.
- Local date selector để thao tác nhanh và tránh lệch UTC.

Tiêu chí kết quả: chủ phòng xem và xuất được số liệu hệ thống mà không cần quản lý thu chi ngoài gym.

## Sprint 7 - Đồng bộ nghiệp vụ và hardening vận hành

Mục tiêu: đồng bộ quyền, lifecycle và dữ liệu giữa các màn hình sau các đợt nâng cấp UI/chức năng.

Đã hoàn thành:

- Chuẩn hóa phạm vi OWNER/PT/MEMBER và phân quyền theo assignment.
- Xử lý OWNER kiêm PT, PT inactive, phân công hết hạn và gói PT hết hiệu lực.
- Chuẩn hóa paid/debt/payment, gia hạn sớm và trạng thái hiệu lực khi đọc dữ liệu.
- Cải tiến Portal, Settings, tài khoản PT và luồng cấp tài khoản hội viên.
- Loại bỏ module không còn dùng: chi phí/lợi nhuận, mục tiêu vận hành, AI chỉ số cơ thể và thống kê view TikTok.
- Dọn dữ liệu/field/tài liệu không còn phù hợp với MVP.

Tiêu chí kết quả: các luồng Owner, PT, Member và public nhất quán với nhau.

## Sprint 8 - AI Cố vấn Giữ chân và Doanh thu, bảo mật chốt MVP

Mục tiêu: thêm một ứng dụng AI có giá trị vận hành và hoàn thiện các lớp bảo vệ nền tảng.

Đã hoàn thành:

- AI Advisor được gọi theo yêu cầu của OWNER, dùng dữ liệu tổng hợp đã ẩn danh.
- Rule segment rủi ro/cơ hội, Groq diễn giải và fallback rule-based.
- Không gửi PII hay giao dịch cá nhân chi tiết sang AI provider.
- JWT token version để thu hồi token cũ khi đổi/reset mật khẩu.
- Login rate limit theo IP và identifier: năm lần sai trong cửa sổ theo dõi 15 phút sẽ khóa trọn 15 phút tính từ lần sai thứ năm, trả 429 cùng Retry-After để frontend đếm ngược.
- Rate limit cho endpoint nhạy cảm.
- Password policy, lastLoginAt, API security headers, no-cache và CORS local dev.

Tiêu chí kết quả: AI không phải chatbot phụ; nó hỗ trợ quyết định giữ chân/doanh thu. Hệ thống vẫn hoạt động khi Groq không phản hồi.

## Bổ sung sau Sprint 8 - Kịch bản doanh thu và giữ chân

Mục tiêu: cho chủ phòng thử một giả định vận hành ngắn hạn mà không mở thêm module tài chính, không ghi dữ liệu mô phỏng và không để AI tự quyết định số tiền.

Đã hoàn thành:

- Giữ nguyên endpoint AI Advisor; request `scenario` là tùy chọn và gồm ba tỷ lệ 0-100%: thu công nợ, khôi phục nhóm PT rủi ro, gia hạn/quay lại.
- Backend tính ba giá trị nền và kết quả ước tính bằng `RetentionRevenueScenarioCalculator`; nhóm PT rủi ro được loại khỏi nền gia hạn/quay lại để không cộng trùng trong hai nhóm giữ chân.
- Groq chỉ diễn giải kịch bản, sắp thứ tự hành động và nêu lưu ý. Nếu Groq lỗi, fallback rule-based vẫn tạo nhận xét kịch bản hợp lệ.
- Frontend Reports cho phép nhập tỷ lệ, gọi phân tích theo yêu cầu và hiển thị rõ tổng giá trị có thể tác động là mô phỏng, không phải doanh thu bảo đảm.
- Không thêm bảng, không lưu lịch sử kịch bản, không tạo phiếu thu, thay đổi gói/trạng thái hoặc tự động liên hệ hội viên.

Tiêu chí kết quả: chủ phòng có thể so sánh một giả định đơn giản dựa trên số liệu hệ thống; các con số được tính bởi backend, còn AI chỉ hỗ trợ diễn giải có kiểm soát.

## Phạm vi không nằm trong roadmap đã chốt

- Production deployment.
- Chi phí, lợi nhuận, payroll và kế toán ngoài hệ thống.
- Import dữ liệu tự động.
- Payment gateway/webhook và Zalo API.
- AI giáo án/AI chỉ số cá nhân.
- Audit log đầy đủ, soft-delete hoàn chỉnh, Redis rate limit và mobile native.

## Tiêu chí chốt giai đoạn

- Toàn bộ sprint 1-8 đã có implementation và đã được kiểm thử qua backend tests, frontend lint/build và các luồng test thủ công chính.
- Không mở rộng scope nếu chưa có một yêu cầu mới được phê duyệt.
- Mọi thay đổi sau đây là một phase mới, cần cập nhật lại roadmap trước khi code.

Tài liệu đối chiếu: 08-current-implementation-alignment.md.
Hướng dẫn kiểm thử PT: 09-pt-operation-and-manual-test.md.
