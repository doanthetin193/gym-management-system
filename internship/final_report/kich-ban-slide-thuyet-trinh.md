## Slide 01 — Trang bìa

- **Hệ thống quản lý phòng gym Dương Double**.
- Quản lý hội viên, gói tập, doanh thu, công nợ, PT, tiến trình và báo cáo.
- Sinh viên thực hiện: **Đoàn Thế Tín**.
- Badge ID: **678**.
- Đơn vị thực tập: **Công ty TMA Bình Định**.
- Mentor: **Đặng Đình Hùng**.
- Công nghệ: Java 21, Spring Boot 4.1.1, PostgreSQL, React 19, TypeScript.

## Slide 02 — Bài toán, mục tiêu, phạm vi và giá trị

- Phòng gym nhỏ cần quản lý đồng thời khách, gói, thời hạn, tiền thu, công nợ và PT; ghi chép rời rạc dễ thiếu lịch sử và sai đối soát.
- Một khách có thể mua nhiều gói, trả nhiều đợt bằng tiền mặt/chuyển khoản; lịch hẹn PT lại khác với buổi tập đã thực hiện.
- Mục tiêu là số hóa nghiệp vụ, giữ dữ liệu nhất quán và hỗ trợ chủ phòng theo dõi tình hình vận hành tập trung.
- Phạm vi gồm tài khoản, hội viên, bảng giá, đăng ký/gia hạn, phiếu thu, công nợ, PT, portal, báo cáo, AI và thư viện video.
- OWNER quản lý vận hành toàn phòng; PT chỉ thao tác với học viên được cấp quyền; MEMBER theo dõi tiến trình cá nhân.
- Ngoài phạm vi: chi phí/lợi nhuận thực tế, payroll/hoa hồng PT, payment webhook, Zalo/SMS tự động, nhập dữ liệu hàng loạt, restore database từ XLSX và triển khai production.

## Slide 03 — Tác nhân, quyền và ranh giới dữ liệu

| Tác nhân | Vai trò nghiệp vụ | Ranh giới quyền |
| --- | --- | --- |
| Khách truy cập | Xem trang công khai, bảng giá và video đã công bố | Không xem dữ liệu quản trị |
| OWNER | Quản trị phòng gym, nhân sự, VietQR, báo cáo, AI và điều phối PT | Quyền toàn hệ thống trong phạm vi gym |
| PT | Phục vụ hội viên được backend cho phép | Không tự quản trị mọi khách hoặc cấu hình |
| MEMBER | Xem gói, lịch và tiến trình của bản thân qua portal | Không đọc/sửa dữ liệu người khác |

- Role trên giao diện chỉ hỗ trợ điều hướng; backend mới là nơi quyết định cuối cùng qua JWT, `@PreAuthorize` và kiểm tra quyền theo từng bản ghi.

## Slide 04 — Bản đồ chức năng và kiến trúc modular monolith

- Module nghiệp vụ backend: `auth`, `user`, `member`, `membership`, `finance`, `pt`, `training`, `dashboard`, `ai`, `exercise`, `common`.
- Frontend: React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS và Lucide React.
- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA, Bean Validation và Maven.
- Database: PostgreSQL; tích hợp ngoài: Groq, TikTok Player, VietQR, Google Apps Script và XLSX export.
- Dự án dùng modular monolith: một backend Spring Boot nhưng tách module và trách nhiệm nghiệp vụ rõ ràng; không dùng microservice hoặc API Gateway không cần thiết cho quy mô hiện tại.

## Slide 05 — Frontend React, TypeScript và trải nghiệm người dùng

- React tổ chức giao diện bằng component/page, phù hợp màn hình có dữ liệu và trạng thái thay đổi liên tục.
- TypeScript cung cấp kiểu tĩnh cho DTO, response, form và state; lỗi kiểu dữ liệu được phát hiện khi build thay vì chỉ lúc chạy.
- Vite phục vụ môi trường phát triển nhanh và build static asset; route dùng `lazy`/`Suspense` để tải trang khi cần.
- Frontend được chia theo feature như `members`, `payments`, `pt-schedule`, `reports`, `settings`, `member-portal`; API/type/page/component được đặt gần nghiệp vụ.
- Tailwind CSS và Lucide giúp giao diện thống nhất; form phản ánh các trạng thái nghiệp vụ như “thu ngay bằng 0”, công nợ dự kiến hoặc thời gian chờ rate limit.

## Slide 06 — PostgreSQL, JPA, Hibernate và chiến lược entity

- PostgreSQL là nguồn dữ liệu nghiệp vụ gốc: user, hội viên, gói, nợ, phiếu thu, PT, số đo, mục tiêu, video và setting.
- JPA là chuẩn Java mô tả entity, mapping và quan hệ; Hibernate là ORM implementation chuyển object Java thành thao tác SQL PostgreSQL.
- Các annotation `@Entity`, `@Table`, `@ManyToOne`, `@JoinColumn`, `@Enumerated` mô tả bảng, khóa ngoại và enum; Spring Data JPA hỗ trợ repository.
- Service giữ quy tắc nghiệp vụ và transaction; DTO tách contract API khỏi entity để frontend không phụ thuộc schema hay nhận password hash/quan hệ nội bộ.
- `BaseEntity` cung cấp khóa chính và cờ `deleted`; `AuditableEntity` bổ sung `createdAt`/`updatedAt`. Trường `createdBy` chỉ có ở các entity cần truy vết thao tác như `Payment`, `MemberMembership`, lịch và log PT.
- Cấu hình `spring.jpa.open-in-view=false` giữ persistence context không mở suốt lúc dựng HTTP response; service cần map entity sang DTO trong ranh giới xử lý phù hợp.
- `deleted` mới là nền tảng soft delete, chưa có global filter hoặc cơ chế tự đặt cờ. Không dùng cờ này chung cho phiếu thu/công nợ vì dữ liệu tài chính cần lịch sử hủy/điều chỉnh minh bạch.

## Slide 07 — Thiết kế dữ liệu tài chính và ERD

- `MembershipPlan` là bảng giá niêm yết; `MemberMembership` là từng lần khách mua/gia hạn thực tế, lưu snapshot giá, giảm giá và thời hạn.
- `DebtRecord` là nghĩa vụ phải thu của lượt mua; `Payment` là từng phiếu thu độc lập, có ngày thu, phương thức và người ghi nhận.
- Mô hình này giải quyết một khách mua nhiều lần, một lượt mua trả nhiều đợt và nhiều phương thức mà lịch sử vẫn rõ ràng.
- Doanh thu dựa trên `Payment.paymentDate`, không chỉ dựa vào ngày đăng ký gói; công nợ luôn theo số phải thu còn lại.
- Nhóm huấn luyện được tách riêng: `PtProfile`, `PtAssignment`, `PtSchedule`, `PtSessionPackage`, `PtSessionLog`, số đo và mục tiêu.

## Slide 08 — `@Transactional`, ACID, `BigDecimal`, `@Version` và Flyway

- `@Transactional` bảo đảm các bước thay đổi liên quan cùng commit hoặc cùng rollback. Ví dụ đăng ký gói có thể tạo membership, debt, payment đầu và PT session package.
- ACID được tận dụng ở mức ứng dụng: transaction nguyên tử, validation/constraint giữ nhất quán, PostgreSQL bảo đảm dữ liệu đã commit bền vững.
- `BigDecimal` dùng cho tiền, tránh sai số nhị phân của `float`/`double`.
- `@Version` là khóa lạc quan trên `DebtRecord` và `PtSessionPackage`: Hibernate phát hiện xung đột thay vì ghi đè im lặng số nợ/số buổi; `GlobalExceptionHandler` trả `409 CONCURRENT_UPDATE` để tải lại dữ liệu và thao tác lại.
- Local dùng Hibernate `ddl-auto=update`; Flyway dependency và thư mục migration đã chuẩn bị nhưng `spring.flyway.enabled=false`. Migration versioned, backup và test dữ liệu là hướng mở rộng sau này.

## Slide 09 — Kiến trúc Spring Boot và Dependency Injection

- Toàn bộ nghiệp vụ chạy trong một Spring Boot application, phù hợp quy mô gym nhỏ và giảm chi phí vận hành.
- Mỗi module có controller/DTO, service, repository, entity và policy phù hợp; thay đổi ở finance/PT không cần chạm toàn bộ project.
- Spring Dependency Injection quản lý bean qua constructor, giảm tự khởi tạo dependency và hỗ trợ test/bảo trì.
- Controller nhận request/trả DTO; service điều phối rule/transaction; repository truy cập dữ liệu; entity mô tả mapping.
- Các concern dùng chung như security, response, exception, validation và phone normalization nằm trong `common`.

## Slide 10 — Hành trình HTTP request, DTO, validation và phân trang

1. Frontend gửi JSON tới `/api/v1/...`, kèm Bearer JWT khi endpoint yêu cầu đăng nhập.
2. Security filter chain xử lý header bảo mật, JWT và rate limit theo route trước khi request vào tầng nghiệp vụ.
3. Controller binding request vào DTO và dùng `@Valid`/constraint để chặn dữ liệu sai sớm.
4. Service kiểm tra rule, role và phạm vi dữ liệu; mở transaction khi request thay đổi nhiều bản ghi.
5. Repository/JPA/Hibernate đọc hoặc ghi PostgreSQL; service map kết quả thành DTO trong `ApiResponse`.
6. Validation/not found/conflict nghiệp vụ thường qua `GlobalExceptionHandler`; lỗi JWT/token ở filter có handler/response riêng trước controller.
7. Danh sách hội viên, phiếu thu và công nợ dùng `PageResponse`; `page` zero-based, `size` mặc định 10 và bộ lọc truyền bằng query parameter.

## Slide 11 — Bảo mật đa tầng: JWT, phân quyền, rate limit và API

- Spring Security dùng session `STATELESS`; JWT ký HMAC-SHA256, có `sub`, `uid`, `name`, `roles`, `ver`, `iat`, `exp`. Base64URL không phải mã hóa nên token không mang password/secret.
- `JwtAuthenticationFilter` kiểm tra chữ ký, hạn token, user hiện tại, trạng thái account, role và so claim `ver` với `authVersion` trong database.
- `@PreAuthorize` kiểm tra role OWNER/PT/MEMBER; service tiếp tục kiểm tra record-level access, đặc biệt với PT và hội viên được phân công.
- Đổi/reset mật khẩu băm bằng `PasswordEncoder`, tăng `authVersion`; JWT cũ bị từ chối ở request sau. `lastLoginAt` cập nhật khi đăng nhập thành công nhưng không phải audit log đầy đủ.
- Mật khẩu tối thiểu 8 ký tự, phải có chữ/số, không trùng email hoặc điện thoại; áp dụng cho luồng đổi/reset password, PT và portal.
- `InMemoryRateLimiter` theo dõi định danh đăng nhập và IP: năm lỗi trong 15 phút, lỗi thứ năm khóa mới 15 phút và trả `429` với `Retry-After`.
- `SensitiveEndpointRateLimitFilter` giới hạn đổi password, tạo/reset team account, portal và AI: tối đa 10 request/15 phút theo operation + actor/IP.
- API thêm `nosniff`, `X-Frame-Options: DENY`, CSP, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store`; CORS giới hạn origin phát triển và expose `Retry-After`.
- Rate limiter là in-memory một instance, restart mất state và không phải giải pháp Redis phân tán; headers không thay thế HTTPS, quản lý secret hoặc security test production.

## Slide 12 — Hội viên, chuẩn hóa điện thoại và hiệu lực gói

- Tạo hội viên chỉ tạo hồ sơ; chưa tự có gói, công nợ, portal, assignment PT hay schedule.
- Số điện thoại Việt Nam được chuẩn hóa trước khi kiểm tra trùng; `members.phone` có unique constraint để giảm dữ liệu khách trùng định dạng.
- OWNER quản lý toàn bộ; PT cập nhật/thao tác trong phạm vi member được backend cấp quyền. OWNER có thể đồng thời là PT khi có tập hợp role phù hợp và PT profile.
- `MembershipLifecyclePolicy` tính hiệu lực từ `startDate`/`endDate`: gói `ACTIVE` bắt đầu tương lai chưa hiệu lực hôm nay; gói qua hạn được diễn giải `EXPIRED` khi đọc.
- Không dùng scheduler đổi enum hết hạn hàng loạt; trạng thái hiển thị được tính theo thời điểm truy vấn.

## Slide 13 — Đăng ký/gia hạn gói và thu ngay

1. OWNER/PT nhập gói, ngày bắt đầu, giá bán, giảm giá, số thu ngay và ghi chú.
2. `MemberMembershipService` kiểm tra quyền, gói, ngày, tiền và tránh chồng thời hạn không hợp lệ.
3. Tạo `MemberMembership`, tạo `DebtRecord` theo số phải thu sau giảm giá; gói PT tạo `PtSessionPackage` cho định mức buổi.
4. Nếu `initialPaidAmount > 0`, tạo `Payment` đầu tiên và đồng bộ công nợ ngay trong transaction.
5. Nếu thu ngay bằng 0, không tạo payment, không ghi lịch sử ngày/phương thức thu; UI vô hiệu hai trường này để không tạo cảm giác đã thu tiền.
6. Khi khách trả sau, luồng thu nợ tạo payment mới với ngày/phương thức thực tế.

## Slide 14 — Thu nhiều đợt, công nợ và doanh thu theo ngày thu

- OWNER/PT có quyền phù hợp chọn debt, nhập số tiền, ngày thu, phương thức và ghi chú.
- `PaymentService` kiểm tra member/membership/debt liên kết đúng, số tiền dương, không vượt số dư và `paymentDate` không ở tương lai.
- Mỗi lần thu tạo một `Payment` độc lập để giữ lịch sử. Ví dụ gói 11,2 triệu: 5 triệu chuyển khoản và 6,2 triệu tiền mặt là hai phiếu thu.
- Transaction đồng bộ `paidAmount`, `remainingAmount`, trạng thái debt và tổng đã thu/còn nợ của membership.
- Báo cáo doanh thu đọc từng `paymentDate`, nên tiền thu ở các tháng khác nhau được ghi nhận đúng kỳ.
- `@Version` trên debt giúp phát hiện cập nhật cạnh tranh thay vì âm thầm ghi đè số dư.

## Slide 15 — Phân công PT và điều phối lịch hẹn

- Assignment hợp lệ khi PT active, member active và có gói PT phù hợp ở ngày bắt đầu; thời hạn assignment không vượt giới hạn gói.
- Chủ phòng có thể kiêm PT vì `User` có tập hợp role và có thể có PT profile.
- Schedule kiểm tra quyền, ngày/giờ và xung đột lịch `SCHEDULED` của PT/học viên; hai khoảng thời gian chỉ chạm biên không bị coi trùng.
- Lịch hẹn là kế hoạch thời gian, không phải bằng chứng buổi tập đã diễn ra nên không trừ định mức khi tạo schedule.
- Lịch đã có session log hoặc trạng thái không còn phù hợp không được xóa tùy ý để giữ lịch sử vận hành.

## Slide 16 — Ghi buổi PT, tự ôn tập, số đo và mục tiêu

- PT session log có thể ghi độc lập hoặc gắn `scheduleId` đang `SCHEDULED` của đúng PT/member; backend kiểm tra package còn hiệu lực/còn buổi.
- `COMPLETED` và `MISSED` tiêu một buổi theo policy; `CANCELLED`/`RESCHEDULED` không tiêu và đồng bộ schedule nếu có liên kết.
- Chống log trùng: schedule ID là khóa nghiệp vụ khi có lịch; log độc lập kiểm tra số buổi hoặc ngày + trạng thái tiêu buổi.
- Tự ôn tập dùng `MemberActivityLog` và định mức riêng; không nhầm với PT 1-1.
- `BodyMeasurement` cần ít nhất một chỉ số thực tế; `PtGoal` là mục tiêu/lộ trình và không tự `COMPLETED` chỉ vì một số đo đạt ngưỡng.

## Slide 17 — Portal hội viên

- OWNER cấp portal mới cho member `ACTIVE`, có điện thoại và ít nhất một membership hiệu lực; không bắt buộc là gói PT, gói tự tập còn hiệu lực cũng có thể được cấp.
- Portal lấy member từ user ID trong `SecurityContext`; MEMBER không truyền tùy ý member ID để xem dữ liệu khác.
- MEMBER xem gói, định mức buổi, lịch PT, số đo, mục tiêu, payment và debt của chính mình.
- MEMBER chỉ theo dõi/đổi password; kích hoạt gói, xác nhận thanh toán và cập nhật nghiệp vụ vẫn do OWNER/PT xử lý.
- Portal đã liên kết không tự xóa chỉ vì gói hết hạn; OWNER quản lý status/reset/remove account khi cần.

## Slide 18 — Dashboard, báo cáo và tích hợp vận hành

- Dashboard/báo cáo tổng hợp member, trạng thái gói, doanh thu đã thu, công nợ và nhóm cần ưu tiên; nhắc việc không tự gửi Zalo/SMS.
- Hệ thống không tính lợi nhuận thực tế vì không có module chi phí; dữ liệu tài chính là revenue/payment và debt trong hệ thống.
- VietQR chỉ tạo ảnh QR từ cấu hình nhận tiền/số tiền; không có webhook ngân hàng, không tự tạo payment hoặc giảm debt.
- TikTok Player v1 nhúng iframe từ `tiktokVideoId`; backend chỉ lưu metadata/link/video ID, không tải video hoặc quản lý lượt xem.
- XLSX do frontend tạo từ dữ liệu đã tải; Google Apps Script nhận bản sao dữ liệu do OWNER chủ động gửi. Cả hai không thay PostgreSQL hoặc restore database.

## Slide 19 — AI Advisor và mô phỏng kịch bản

- `RetentionRevenueAdvisorService` đọc dữ liệu nghiệp vụ, áp dụng rule và tạo segment rủi ro/cơ hội trước khi gọi Groq.
- `AdvisorPayload` là tổng hợp/ẩn danh: không có tên, điện thoại, Zalo, email, địa chỉ hoặc từng giao dịch cá nhân.
- Groq nhận system prompt + JSON payload, trả JSON contract cho overview, risk, opportunity, kế hoạch 7 ngày và metrics; AI không có quyền ghi dữ liệu gym.
- `GroqAiClient` đặt `temperature = 0.2` để giảm tính ngẫu nhiên và yêu cầu `response_format.type = json_object`; backend kiểm tra/parse kết quả trước khi trả giao diện.
- OWNER nhập ba tỷ lệ 0–100; `RetentionRevenueScenarioCalculator` tính tiền/làm tròn/tổng tác động ở backend. Groq chỉ diễn giải ưu tiên.
- Nền gia hạn loại trừ nhóm đã nằm trong PT rủi ro để tránh cộng lặp. Kịch bản không tạo payment/debt/membership/schedule.
- Thiếu key, provider lỗi hoặc JSON sai trả fallback rule với `aiGenerated=false`; key lỗi 401/403/429 có thể failover tuần tự sang key kế tiếp, không round-robin.

## Slide 20 — Kiểm thử và đánh giá hiện tại

- Kiểm thử chức năng thủ công local với React, Spring Boot, PostgreSQL và dữ liệu demo.
- Các luồng đã đối chiếu: login/rate limit, member, gói, payment/debt, PT, portal, báo cáo, AI và export.
- Trường hợp biên: quyền PT theo member, ngày thu tương lai, thu vượt nợ, hiệu lực gói, trùng lịch và trạng thái tiêu buổi.
- Backend có test tự động cho policy trọng tâm; frontend được kiểm tra lint và production build.
- Không tuyên bố full coverage, test tải, penetration test, test bảo mật chuyên sâu hoặc concurrency test toàn diện cho production.

## Slide 21 — Kết luận, hạn chế và hướng phát triển

### Kết quả

- Hoàn thành hệ thống quản lý vận hành gym với dữ liệu/rule tách rõ: gói khác lượt mua, lượt mua khác debt, debt khác payment; schedule khác buổi đã tập.
- Backend áp dụng transaction, `@Version`, JWT/`authVersion`, RBAC/record-level access, rate limit và security headers.
- AI hỗ trợ diễn giải dữ liệu tổng hợp có fallback, không thay thế quyền quyết định của OWNER.

### Hạn chế và hướng phát triển

- Hiện là local/MVP: Flyway chưa chạy, chưa có backup/restore, audit log, rate limit phân tán hoặc production deployment.
- Soft delete mới là định hướng; khi áp dụng cần filter, restore và policy riêng theo từng loại dữ liệu.
- Bổ sung migration versioned, test tích hợp/đồng thời/hiệu năng; payroll/hoa hồng PT chỉ triển khai sau khi chủ phòng chốt công thức thực tế.
