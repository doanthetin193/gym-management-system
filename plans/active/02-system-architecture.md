# 02 - Kiến Trúc Hệ Thống

Cập nhật lần cuối: 16/10/2026.

## 1. Tổng quan

Dương Double Gym Management là modular monolith chạy local development. Hệ thống tách rõ frontend React, backend Spring Boot và PostgreSQL, nhưng không tách microservice. Cách tổ chức này phù hợp đồ án cá nhân và phòng gym nhỏ: dễ đọc, dễ test, ít chi phí vận hành và không phình code.

Luồng tổng quát:

Browser React/Vite
  -> REST API Spring Boot tại /api/v1
  -> PostgreSQL

Tích hợp ngoài hệ thống khi cần:

- Groq cho AI Advisor, chỉ khi OWNER bấm phân tích.
- VietQR để tạo thông tin chuyển khoản thu công.
- Google Apps Script để đồng bộ sheet thủ công.
- TikTok iframe để hiển thị video public.

Không có hàng đợi, cache server, scheduler, payment webhook hoặc logging/audit service trong scope hiện tại.

## 2. Stack thực tế

### Backend

- Java 21.
- Spring Boot 4.1.1.
- Spring Web MVC, Spring Data JPA, Spring Security, Bean Validation và Actuator.
- PostgreSQL.
- Lombok.
- Maven.
- Flyway dependency được giữ để phục vụ migration tương lai, nhưng đang tắt trong local dev.

### Frontend

- React 19.
- TypeScript.
- Vite 8.
- React Router 7.
- Axios.
- Tailwind CSS 4.
- Lucide React.

Không sử dụng TanStack Query, React Hook Form, Zod hay Redux trong implementation hiện tại. State và submit form được quản lý bằng React hooks và các module API nhỏ theo từng feature.

## 3. Cấu trúc backend

Package chính được tổ chức theo nghiệp vụ:

| Module | Trách nhiệm |
| --- | --- |
| auth | Đăng nhập, thông tin tài khoản hiện tại, đổi mật khẩu. |
| user | Role, tài khoản OWNER/PT, trạng thái tài khoản và lastLoginAt. |
| member | Hồ sơ hội viên, phân quyền dữ liệu hội viên và Portal MEMBER. |
| membership | Bảng giá, lượt đăng ký gói và lifecycle gói. |
| finance | Phiếu thu, công nợ, VietQR và báo cáo dòng tiền. |
| pt | Hồ sơ PT, phân công, lịch hẹn, gói buổi, nhật ký PT và tự ôn. |
| training | Số đo cơ thể và mục tiêu PT. |
| exercise | Thư viện TikTok public và công cụ OWNER quản lý video. |
| dashboard | Dashboard OWNER, báo cáo, thông báo/nhắc việc động. |
| ai | AI Cố vấn Giữ chân và Doanh thu. |
| common | Base entity, exception, time, security, validation, API response và cấu hình. |

Mỗi module có domain, repository, service, web controller và DTO ở mức độ cần thiết. Controller chỉ nhận request/trả response; service giữ quy tắc nghiệp vụ và phân quyền; repository truy cập JPA.

## 4. Phân quyền và xác thực

### JWT

- API dùng Bearer JWT, không lưu HTTP session.
- JWT chứa subject, roles, thời hạn và auth version.
- JwtAuthenticationFilter kiểm tra chữ ký, hạn token, trạng thái tài khoản và auth version trước khi đặt authentication.
- Khi người dùng đổi/reset mật khẩu, auth version tăng lên; JWT cũ không còn dùng được.

### Role

- OWNER: toàn quyền nghiệp vụ và cấu hình.
- PT: được cấp API của vai trò PT, nhưng service tiếp tục kiểm tra phạm vi học viên/PT của chính người đăng nhập.
- MEMBER: chỉ lấy Portal của tài khoản liên kết.

OWNER seed có cả role OWNER và PT. Vì vậy chủ phòng vẫn giữ quyền quản trị, đồng thời có thể được phân công dạy khách.

### Rate limit và password policy

- Login: tối đa 5 lần sai trong cửa sổ 15 phút theo IP và identifier.
- Endpoint nhạy cảm: 10 request trong 15 phút theo actor cho đổi/reset password, tạo/reset tài khoản, Portal và AI Advisor.
- Password được mã hóa BCrypt và phải đạt chính sách tối thiểu của hệ thống.

## 5. Boundary dữ liệu quan trọng

### Hội viên và gói tập

MemberService và MemberAccessService quyết định PT nào được xem/thao tác hồ sơ. MembershipLifecyclePolicy tính trạng thái hiệu lực theo ngày, ưu tiên gói đang hiệu lực trước gói đã mua sẵn cho tương lai.

`PublicMembershipPlanController` là ranh giới riêng cho bảng giá public: chỉ đọc gói `active` và trả DTO rút gọn, thay vì mở response danh mục nội bộ. Khi không lấy được cấu hình VietQR công khai hoặc cấu hình không đủ/không bật, frontend không dựng QR và không dùng dữ liệu tài khoản dự phòng.

### Tài chính

Payment là nguồn doanh thu thực thu. DebtRecord là khoản còn phải thu. Báo cáo không suy diễn doanh thu từ giá gói hay ngày bắt đầu gói.

### PT

PtAssignmentPolicy xác định một phân công có hiệu lực dựa trên trạng thái, ngày phân công và gói PT. PtService là nơi kiểm soát lịch trùng, phạm vi PT, gói buổi, ngày hợp lệ, trùng log và trừ buổi.

### Báo cáo và AI

DashboardService và AI service dùng chung `MembershipPeriodStatistics` để đếm khách mới/gia hạn theo hội viên phân biệt. AI tiếp tục tạo payload aggregate ẩn danh, chạy rule segment trước, sau đó mới gọi Groq để diễn giải chiến lược. Nếu provider lỗi, kết quả fallback vẫn được trả về.

Khi OWNER chọn kịch bản, `RetentionRevenueScenarioCalculator` nhận ba tỷ lệ phần trăm đã được validation và tính giá trị có thể thu công nợ, khôi phục nhóm PT rủi ro và gia hạn/quay lại. Đây là phép tính thuần trong request, không ghi database. Nền gia hạn/quay lại loại trừ hội viên đã có trong nền PT rủi ro để hai nhóm giữ chân không cộng trùng; công nợ được thể hiện là một hành động dòng tiền riêng. Giá trị mô phỏng được đưa kèm payload aggregate chỉ để Groq diễn giải thứ tự ưu tiên và lưu ý; Groq không là nguồn tính tiền của kịch bản.

## 6. Luồng nghiệp vụ chính

### 6.1 Bán hoặc gia hạn gói

1. OWNER/PT tạo hội viên nếu chưa có.
2. Chọn gói active và ngày bắt đầu.
3. Nhập giá thực tế, giảm giá và số tiền thu ngay.
4. Backend tạo member_membership.
5. Nếu có thu tiền, tạo payment_transactions. Nếu còn thiếu, tạo debt_records.
6. Nếu là gói PT, tạo pt_session_packages. Phân công PT là bước vận hành riêng.

### 6.2 Thu công nợ

1. Chọn debt record.
2. Nhập số tiền, ngày thu thực tế và phương thức.
3. Backend tạo payment mới, cập nhật paid/remaining/status của debt và paid/debt/status của membership.

### 6.3 Điều phối PT

1. OWNER phân công PT, hoặc PT tự nhận khách PT chưa có phân công.
2. Đặt lịch là cuộc hẹn, chưa trừ buổi.
3. Khi buổi thực tế xong, ghi session log để trừ một buổi PT. Nếu có lịch SCHEDULED phù hợp, người vận hành chọn lịch để gửi scheduleId; nếu không, xác nhận ghi độc lập.
4. Tự ôn tập ghi activity log và trừ lượt tự ôn.
5. PT cập nhật số đo/mục tiêu theo định kỳ; Portal chỉ đọc kết quả.

## 7. Date, time và lifecycle

- Backend dùng Asia/Ho_Chi_Minh cho nghiệp vụ ngày.
- Frontend dùng helper local date, không dựa vào UTC string để tính ngày nghiệp vụ.
- Ngày thu tiền, ngày ghi buổi, ngày đo chỉ số không được ở tương lai.
- Trạng thái gói, gói buổi và phân công được tính hiệu lực khi đọc dữ liệu, không cần scheduler chuyển enum hằng ngày.

## 8. Bảo mật HTTP

API có CORS local dev rõ ràng và các header bảo vệ: chặn MIME sniffing, chặn iframe, Referrer-Policy, CSP cơ bản, Permissions-Policy và Cache-Control cho response API. Đây là lớp bổ sung bên cạnh JWT và phân quyền service.

## 9. Giới hạn kiến trúc hiện tại

- In-memory rate limit phù hợp một backend local; nếu scale nhiều instance cần thay bằng Redis hay gateway.
- deleted ở BaseEntity là cột dự phòng, chưa có cơ chế soft-delete đồng bộ trên tất cả query.
- Flyway đang tắt và Hibernate ddl-auto=update phục vụ local dev. Khi bắt đầu deploy hoặc migration thật, cần chuyển sang migration versioned.
- Google Sheet và TikTok là tích hợp một chiều/nhúng view, không phải hệ thống đồng bộ hai chiều hay media hosting.

Tài liệu đối chiếu hiện trạng chi tiết: 08-current-implementation-alignment.md.
