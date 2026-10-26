# Lời thuyết trình cho bộ slide tiếng Anh — 35 trang

Tài liệu này hướng dẫn thuyết trình cho bộ PDF `Duong_Double_Gym_Management_System_Slides.pdf` trong cùng thư mục. Bộ slide có **21 slide nội dung tiếng Anh** và **14 slide sơ đồ Mermaid** được chèn xen kẽ. Lời nói bên dưới viết bằng tiếng Việt để người trình bày dễ chuẩn bị, còn thuật ngữ kỹ thuật được giữ ở dạng tiếng Anh khi cần thiết để khớp với slide.

Không cần đọc nguyên văn toàn bộ. Mỗi phần nên được diễn đạt tự nhiên theo ngữ cảnh. Khi trình bày sơ đồ, ưu tiên đi theo chiều mũi tên và giải thích: dữ liệu đi từ đâu, được kiểm tra gì, và kết quả được lưu hoặc trả về như thế nào.

## Nguyên tắc cần giữ nhất quán

- Đây là hệ thống MVP chạy local, có các lớp bảo vệ và quy tắc nghiệp vụ rõ ràng; không khẳng định đã production-ready hoặc không còn mọi lỗi.
- Luôn phân biệt: gói niêm yết, lượt mua gói, công nợ, phiếu thu, lịch hẹn PT và buổi tập thực tế là các dữ liệu khác nhau.
- AI chỉ nhận dữ liệu tổng hợp đã ẩn danh, đưa ra gợi ý; không tự tạo phiếu thu, công nợ, gói tập, lịch hẹn hoặc tự sửa dữ liệu PostgreSQL.
- VietQR chỉ tạo QR để hỗ trợ chuyển khoản; việc hiển thị hoặc quét QR không tự xác nhận thanh toán.
- Flyway và trường `deleted` là định hướng mở rộng. Hiện Flyway tắt và `deleted` chưa phải cơ chế soft delete hoàn chỉnh.

---

## Trang 01 — Duong Double Gym Management System

**Mục tiêu:** mở đầu, giới thiệu người thực hiện, đơn vị thực tập và phạm vi đề tài.

“Em là Đoàn Thế Tín, Badge ID 678, thực tập tại TMA Bình Định dưới sự hướng dẫn của mentor Đặng Đình Hùng. Đề tài của em là xây dựng hệ thống quản lý phòng gym Dương Double trên nền tảng web.

Hệ thống tập trung số hóa các nghiệp vụ thường gặp của một phòng gym nhỏ: hồ sơ hội viên, danh mục và đăng ký gói tập, thu tiền, công nợ, vận hành PT, theo dõi tiến trình hội viên và báo cáo vận hành. Về công nghệ, frontend sử dụng React 19 và TypeScript; backend sử dụng Java 21 với Spring Boot 4.1.1; PostgreSQL lưu dữ liệu nghiệp vụ. Trong đợt thực tập, phần em tập trung sâu nhất là backend: mô hình dữ liệu, transaction, kiểm tra nghiệp vụ, phân quyền và bảo mật API.”

Chuyển ý: “Trước khi đi vào kiến trúc, em xin trình bày bài toán thực tế mà hệ thống giải quyết.”

## Trang 02 — Problem, Objectives, Scope, and Value

**Mục tiêu:** cho thấy vấn đề thực tế, giá trị và ranh giới scope.

“Ở phòng gym quy mô nhỏ, dữ liệu thường nằm trong sổ tay, tin nhắn hoặc nhiều file bảng tính. Vấn đề không chỉ là lưu tên khách. Một hội viên có thể mua nhiều gói theo thời gian, một gói có thể thanh toán nhiều đợt bằng các phương thức khác nhau, có công nợ, có PT phụ trách và có lịch tập riêng. Nếu quản lý rời rạc thì rất khó đối chiếu lịch sử và dễ nhầm doanh thu với giá bán gói.

Mục tiêu của hệ thống là tập trung dữ liệu, giữ lịch sử minh bạch và tạo một luồng nghiệp vụ nhất quán cho chủ phòng. Scope bao gồm tài khoản, hội viên, gói tập, đăng ký/gia hạn, phiếu thu và công nợ, PT, portal hội viên, báo cáo, thư viện video và AI advisor.

Ngược lại, đồ án chủ động không làm module chi phí vận hành, lợi nhuận thực tế, tính lương hay hoa hồng PT, webhook ngân hàng tự động, Zalo/SMS tự động, import hàng loạt, khôi phục database bằng XLSX và production deployment. Việc giới hạn này giúp em ưu tiên làm đúng những nghiệp vụ cốt lõi thay vì mở rộng quá rộng nhưng thiếu độ tin cậy.”

## Trang 03 — Actors, Permissions, and Data Boundaries

**Mục tiêu:** giải thích role và nguyên tắc ranh giới dữ liệu.

“Hệ thống có bốn nhóm tác nhân. Khách truy cập công khai chỉ xem bảng giá và video đã công bố. OWNER là chủ phòng, quản lý nghiệp vụ toàn phòng như hội viên, gói, tiền thu, cài đặt VietQR, báo cáo, AI và điều phối PT. PT làm việc với học viên mà backend cho phép truy cập. MEMBER là hội viên đã được cấp portal để xem tiến trình cá nhân.

Điểm quan trọng là role ở frontend chỉ phục vụ điều hướng giao diện. Quyết định cuối cùng luôn do backend đưa ra. JWT xác định danh tính, `@PreAuthorize` kiểm tra role, sau đó service kiểm tra quyền ở mức bản ghi. Ví dụ hai người đều là PT không vì thế mà được xem hoặc cập nhật dữ liệu học viên của nhau. Vì vậy phân quyền không chỉ là ẩn nút trên giao diện mà là kiểm soát tại API và service.”

## Trang 04 — Sơ đồ tác nhân và nhóm chức năng

**Mục tiêu:** trực quan hóa phạm vi quyền của từng actor.

“Sơ đồ này diễn giải lại các nhóm người dùng. Ở phía trái, Guest chỉ đi vào khu vực công khai gồm bảng giá và video. OWNER đi vào các nghiệp vụ quản trị: hồ sơ, gói tập, thu tiền, cài đặt; đồng thời có quyền xem dashboard, báo cáo và AI advisor. OWNER cũng có thể điều phối PT và có thể kiêm PT nếu tài khoản có role cùng PT profile phù hợp.

PT không được quyền quản trị toàn bộ phòng. PT chỉ làm việc với danh sách hội viên thuộc phạm vi hợp lệ do backend xác nhận. Trong phạm vi đó, PT có thể hỗ trợ đăng ký gói hoặc ghi nhận thu tiền, và thực hiện nghiệp vụ PT như lịch hẹn, buổi tập, chỉ số và mục tiêu.

MEMBER chỉ đi vào portal cá nhân. Cổng Groq chỉ nằm ở nhánh báo cáo và AI; PT hoặc hội viên không gọi AI trực tiếp. Sơ đồ thể hiện nhóm chức năng; khi triển khai thật, mỗi API vẫn phải vượt qua các kiểm tra security và business rule riêng.”

## Trang 05 — Functional Map and Modular Monolith Architecture

**Mục tiêu:** giới thiệu modular monolith và các module nghiệp vụ.

“Về kiến trúc, đây là modular monolith. Toàn bộ backend chạy trong một ứng dụng Spring Boot duy nhất, không dùng microservices, API Gateway hay service discovery. Lựa chọn này phù hợp quy mô phòng gym hiện tại vì giảm số thành phần phải triển khai, theo dõi và xử lý lỗi phân tán.

Tuy nhiên monolith không có nghĩa là tất cả code trộn vào nhau. Backend được tách theo ranh giới nghiệp vụ: `auth`, `user`, `member`, `membership`, `finance`, `pt`, `training`, `dashboard`, `ai`, `exercise` và `common`. Ví dụ membership quản lý lượt mua gói; finance quản lý khoản phải thu và phiếu thu; PT quản lý phân công, lịch và ghi buổi. Ranh giới này làm code dễ đọc, dễ kiểm thử và là nền tảng nếu sau này cần tách một phần lớn hơn.

PostgreSQL là nguồn dữ liệu gốc. Groq, TikTok, VietQR, Google Apps Script và xuất XLSX chỉ là tích hợp hỗ trợ, không thay thế quyết định nghiệp vụ của backend hay cơ sở dữ liệu.”

## Trang 06 — Sơ đồ lớp kỹ thuật và tích hợp ngoài

**Mục tiêu:** chỉ rõ dữ liệu đi đâu và dịch vụ ngoài có vai trò gì.

“Sơ đồ này bắt đầu từ người dùng thao tác trên frontend React và TypeScript. Frontend trao đổi JSON qua HTTP với REST API Spring Boot. Backend xử lý rule và PostgreSQL là source of truth, nghĩa là dữ liệu chính thức về hội viên, gói, công nợ, phiếu thu và PT đều nằm ở đây.

Nhánh Groq chỉ nhận payload tổng hợp đã ẩn danh từ backend; dữ liệu định danh trực tiếp như tên, số điện thoại, email, Zalo hoặc địa chỉ không được gửi. VietQR nằm ở phía frontend để tạo URL ảnh QR theo tài khoản nhận và số tiền. Nó không gọi backend để tự xác nhận ngân hàng.

TikTok Player được nhúng bằng iframe, hệ thống chỉ lưu metadata, liên kết và video ID chứ không tải video về database. Google Apps Script và Google Sheets nhận dữ liệu khi OWNER chủ động đồng bộ. XLSX là file xuất dữ liệu để xem hoặc lưu trữ; cả hai không thể khôi phục thay thế PostgreSQL.”

## Trang 07 — Sơ đồ kiến trúc tổng thể và ranh giới xử lý

**Mục tiêu:** mô tả đường đi tổng quát của request và các cổng kiểm tra.

“Từ người dùng, request đi tới frontend. Khi frontend gọi API, backend trả security headers cho mọi phản hồi. Route được phân nhánh thành public hoặc protected. Với API public, request đi đến controller và service theo luật của chức năng. Với API protected, request phải có Bearer JWT.

JWT filter kiểm tra token trước: cấu trúc token, chữ ký, thời hạn và `authVersion`. Sau khi xác thực, sensitive rate-limit filter chỉ áp dụng cho các endpoint nhạy cảm được cấu hình. Request hợp lệ mới vào controller, service, JPA/Hibernate và PostgreSQL.

Tại service, backend còn kiểm tra role và quyền trên bản ghi. Do đó một ID do frontend gửi lên không tự tạo quyền truy cập. Các tích hợp như Groq, VietQR, TikTok, XLSX và Google Apps Script ở ngoài đường ghi dữ liệu gốc; chúng chỉ hỗ trợ phân tích, hiển thị hoặc xuất/đồng bộ.”

## Trang 08 — React, TypeScript, and User Experience

**Mục tiêu:** giới thiệu frontend vừa đủ và xác định backend là lớp quyết định.

“Frontend sử dụng React để tổ chức giao diện thành page và component có state. TypeScript định nghĩa type cho DTO, request, response và form, từ đó phát hiện sai kiểu dữ liệu ở lúc phát triển hoặc build thay vì chờ đến runtime. Vite phục vụ môi trường phát triển nhanh và build asset; route được `lazy` và `Suspense` để tải theo nhu cầu.

Mã nguồn được chia theo feature như members, payments, PT schedule, reports, settings và member portal. Một feature đặt page, API client, type và component gần nhau, giúp dễ lần theo nghiệp vụ.

Giao diện hiển thị trạng thái nghiệp vụ rõ ràng, ví dụ thu ngay bằng 0 thì khóa ngày thu và phương thức thanh toán để tránh hiểu nhầm là đã có phiếu thu. Tuy vậy, frontend không phải hàng rào bảo mật cuối cùng. Backend vẫn tự kiểm tra ngày thu, số tiền, quyền và trạng thái trước khi lưu.”

## Trang 09 — Sơ đồ tổ chức frontend theo feature

**Mục tiêu:** giải thích cấu trúc React từ điểm khởi tạo đến feature.

“`main.tsx` là điểm khởi tạo ứng dụng, sau đó `App.tsx` cấu hình provider và router. Trước khi vào các khu vực riêng, route guard như `ProtectedRoute`, `PublicOnlyRoute` và `RoleGuard` hỗ trợ điều hướng theo trạng thái đăng nhập và role. `AppShell` tạo khung chung như sidebar, header và layout.

Các feature chứa page, API, type và component theo nghiệp vụ. `apiClient` dùng chung để gắn Bearer token, gửi request và xử lý lỗi. `authStorage` lưu thông tin xác thực ở phía client. Nếu nhận `401`, client xóa trạng thái cục bộ và đưa người dùng về trang đăng nhập.

Tổ chức này giảm lặp code trên các page. Tuy nhiên em vẫn nhấn mạnh rằng route guard chỉ hỗ trợ UX; không được coi nó là thay thế cho JWT filter hay phân quyền ở backend.”

## Trang 10 — PostgreSQL, JPA, Hibernate, and Entity Strategy

**Mục tiêu:** giới thiệu persistence layer và chiến lược entity chính xác.

“PostgreSQL lưu dữ liệu nghiệp vụ gốc: user, member, gói tập, khoản nợ, phiếu thu, dữ liệu PT, số đo, mục tiêu, video và settings. JPA là specification của Java để mô tả entity, mapping và quan hệ; Hibernate là ORM implementation chuyển thao tác object Java thành SQL PostgreSQL. Spring Data JPA cung cấp abstraction repository cho các thao tác dữ liệu phổ biến.

`BaseEntity` tái sử dụng khóa chính và cờ `deleted`. `AuditableEntity` bổ sung `createdAt` và `updatedAt`. Trường `createdBy` chỉ có ở các bản ghi thật sự cần truy vết thao tác, ví dụ lượt bán gói, phiếu thu, lịch PT và session log.

DTO tách khỏi entity để API không làm lộ password hash, quan hệ nội bộ hoặc schema database. `spring.jpa.open-in-view=false` giúp persistence context không mở kéo dài đến lúc render HTTP response; service phải map entity sang DTO trong ranh giới xử lý phù hợp. Cờ `deleted` hiện chỉ là nền tảng dự phòng, chưa có global filter hay cơ chế tự đánh dấu nên chưa thể gọi là soft delete hoàn chỉnh.”

## Trang 11 — Financial Data Design and ERD

**Mục tiêu:** nêu thiết kế tách biệt dữ liệu tài chính.

“Phần tài chính tách bốn khái niệm. `MembershipPlan` là gói niêm yết trong catalog. `MemberMembership` là một lượt mua hoặc gia hạn thực tế và giữ snapshot giá, giảm giá, thời hạn ở đúng thời điểm bán. `DebtRecord` là nghĩa vụ còn phải thu của lượt mua. `Payment` là từng phiếu thu độc lập, có ngày thu, phương thức thu và người ghi nhận.

Thiết kế này giải quyết được hai tình huống phổ biến: một hội viên mua nhiều gói theo thời gian, và một lượt mua được trả nhiều lần, thậm chí mỗi lần dùng phương thức khác nhau. Vì vậy không nên nhìn giá niêm yết rồi gọi ngay là doanh thu. Doanh thu được tính từ các `Payment.paymentDate`, còn công nợ lấy từ số dư của `DebtRecord`.

Miền PT cũng tách riêng: profile, assignment, schedule, session package, session log, số đo và mục tiêu. Điều này tránh nhầm lịch dự kiến với buổi đã tập, và tránh lấy số buổi PT làm dữ liệu tài chính trực tiếp.”

## Trang 12 — ERD tài khoản, hội viên, gói và tài chính

**Mục tiêu:** đọc ERD theo câu chuyện dữ liệu, không đọc từng cột.

“Ở phần trên của ERD, `USERS` có thể có nhiều role qua bảng nối `USER_ROLES`. Một user có thể liên kết với một member khi được cấp portal. Member có nhiều lượt `MEMBER_MEMBERSHIPS`, và mỗi lượt đó chọn một `MEMBERSHIP_PLAN`.

Đi theo luồng bán hàng: một member đăng ký một lượt mua; lượt mua có thể tạo `DEBT_RECORDS`; mỗi công nợ có thể có nhiều `PAYMENT_TRANSACTIONS`. Mỗi payment cũng gắn member, và có thể gắn membership hoặc debt để giữ lịch sử rõ ràng. Đây là lý do một gói 11,2 triệu có thể xuất hiện hai phiếu thu: ví dụ 5 triệu chuyển khoản và 6,2 triệu tiền mặt vào hai thời điểm khác nhau.

`SYSTEM_SETTINGS` đứng độc lập vì dùng mô hình key-value cho cấu hình, hiện có liên quan đến VietQR. Điểm kỹ thuật cần nhớ là `setting_key` kiểu chuỗi là primary key; bảng này không dùng ID `bigint` tự tăng. Sơ đồ đã giản lược các cột audit kế thừa để tập trung vào khóa và quan hệ chính.”

## Trang 13 — `@Transactional`, ACID, `BigDecimal`, `@Version`, and Flyway

**Mục tiêu:** giải thích các kỹ thuật giữ tính toàn vẹn dữ liệu.

“Những thao tác thay đổi nhiều bản ghi được đặt trong `@Transactional`. Ví dụ đăng ký gói có thể tạo lượt mua, khoản phải thu, phiếu thu ban đầu và gói buổi PT. Nếu một bước không hợp lệ hoặc lỗi khi lưu thì cả transaction rollback; nếu mọi bước thành công thì commit toàn bộ. Đây là cách giữ dữ liệu không rơi vào trạng thái chỉ tạo gói nhưng thiếu công nợ hoặc thiếu payment.

Với tiền tệ, backend dùng `BigDecimal`, tránh sai số nhị phân của `float` hoặc `double`. `@Version` là optimistic locking trên `DebtRecord` và `PtSessionPackage`. Khi hai thao tác cùng cố cập nhật một khoản nợ hoặc trừ số buổi, Hibernate phát hiện version thay đổi và backend trả `409 CONCURRENT_UPDATE`, thay vì âm thầm cho thao tác đến sau ghi đè thao tác trước.

Flyway đã có dependency và thư mục migration để chuẩn bị mở rộng. Hiện tại local dùng Hibernate `ddl-auto=update` và `spring.flyway.enabled=false`. Vì vậy Flyway là định hướng cho migration versioned sau này, chưa phải luồng migration đang chạy.”

## Trang 14 — Spring Boot Architecture and Dependency Injection

**Mục tiêu:** giới thiệu phân tầng backend và Dependency Injection.

“Backend chạy như một Spring Boot application. Trong từng module, code được tổ chức theo controller/DTO, service, repository, entity và policy khi nghiệp vụ cần tái sử dụng. Controller nhận HTTP request, bind DTO và trả response DTO. Service tập trung rule, phân quyền mức bản ghi và transaction. Repository truy cập database thông qua Spring Data JPA; entity mô tả mapping dữ liệu.

Spring Dependency Injection quản lý các bean qua constructor injection. Thay vì service tự `new` repository hoặc service khác, Spring cung cấp dependency đã được quản lý. Nhờ đó quan hệ phụ thuộc rõ hơn, dễ mock hoặc thay thế khi test, và giảm coupling.

Các concern dùng chung như response chuẩn, exception, validation, security, chuẩn hóa số điện thoại và base entity nằm trong `common`. Điều này tránh việc mỗi module tự tạo lại cùng một cơ chế.”

## Trang 15 — Sơ đồ phân tầng backend

**Mục tiêu:** mô tả request đi qua các lớp nội bộ.

“Một HTTP request trước hết đi qua security filter chain, gồm header, JWT và rate limit phù hợp. Khi qua được filter, controller bind request vào DTO và `@Valid` kiểm tra các constraint cơ bản như required, format hoặc giá trị dương.

Controller gọi service. Service là nơi kiểm tra các rule thật sự: người gọi có quyền không, bản ghi có nằm trong scope không, ngày có hợp lệ không, có trùng lịch hay vượt số dư không. Nếu một use case thay đổi nhiều dữ liệu, service mở transaction. Service cũng có thể dùng shared policy, ví dụ lifecycle gói tập, PT assignment policy hoặc member access policy.

Repository giao tiếp với JPA/Hibernate và entity để đọc/ghi PostgreSQL. Kết quả được service map sang response DTO hoặc `PageResponse`, sau đó đi ra `ApiResponse`. Các lỗi validation, not found, conflict hay business rule trong controller/service thường được `GlobalExceptionHandler` chuẩn hóa. Riêng lỗi JWT xảy ra ở filter, nên bị trả sớm trước khi vào controller.”

## Trang 16 — HTTP Request Lifecycle, DTOs, Validation, and Pagination

**Mục tiêu:** trình bày request lifecycle ở mức tổng quan.

“Khi frontend gửi JSON đến `/api/v1/...`, API protected kèm Bearer JWT. Filter chain xử lý headers, JWT và rate limit endpoint nhạy cảm trước business layer. Controller nhận request DTO; `@Valid` loại những request sai định dạng sớm.

Service kiểm tra business rule và data scope. Sau đó repository, JPA và Hibernate đọc hoặc ghi PostgreSQL. Service map entity thành DTO để không lộ schema nội bộ. Response được bao bởi `ApiResponse` để frontend nhận cấu trúc nhất quán.

Nếu lỗi xảy ra trong controller/service như validation, không tìm thấy bản ghi hoặc conflict nghiệp vụ, `GlobalExceptionHandler` chuyển thành response lỗi chuẩn. Nhưng token sai hoặc hết hạn bị JWT filter chặn ở phía trước, nên không nhất thiết đi qua exception handler.

Với danh sách có thể dài, member, payment và debt dùng `PageResponse`. `page` đánh số từ 0, `size` mặc định là 10 và filter đi qua query parameter. Dù dữ liệu gym chưa rất lớn, phân trang giúp API có giới hạn rõ ràng và giao diện không tải toàn bộ lịch sử một lần.”

## Trang 17 — Layered Security: JWT, Authorization, Rate Limit, and API Protection

**Mục tiêu:** giới thiệu bảo mật đa lớp trước khi đi vào ba sơ đồ chi tiết.

“Bảo mật của hệ thống gồm nhiều lớp. Spring Security chạy stateless; JWT HMAC-SHA256 mang các claim như subject, user ID, roles, `authVersion`, thời điểm phát hành và hết hạn. JWT không mã hóa nội dung theo nghĩa bí mật; Base64URL có thể đọc được nên token không chứa password hay secret.

JWT filter kiểm tra chữ ký, hết hạn, user hiện tại, trạng thái tài khoản, role và so sánh version trong token với `authVersion` trong database. `@PreAuthorize` kiểm tra role, còn service kiểm tra record-level access. Khi đổi hoặc reset mật khẩu, hệ thống tăng `authVersion`, làm token cũ bị từ chối ở request kế tiếp.

Rate limit đăng nhập theo identity và IP: năm lần sai kích hoạt khóa mới 15 phút và trả `429` cùng `Retry-After`. Endpoint nhạy cảm có limit riêng tối đa 10 request/15 phút theo operation và actor đã đăng nhập, hoặc IP khi chưa đăng nhập. API còn gửi các security headers, không cache dữ liệu JWT/API và CORS chỉ cho phép origin development đã cấu hình. Giới hạn hiện là in-memory, single-instance; restart backend sẽ xóa counter.”

## Trang 18 — Sơ đồ JWT và phân quyền request

**Mục tiêu:** giải thích tuần tự một request đã đăng nhập.

“Người dùng thực hiện một thao tác cần xác thực trên frontend. Frontend gửi request kèm `Authorization: Bearer <token>`. Header filter bổ sung security headers cho response và cho request đi tiếp tới `JwtAuthenticationFilter`.

JWT filter kiểm tra định dạng token, chữ ký HMAC và expiration. Sau đó filter không chỉ tin dữ liệu nằm trong token mà gọi `CustomUserDetailsService` để nạp user hiện tại. Từ user hiện tại, backend lấy trạng thái tài khoản, roles và `authVersion`, rồi so sánh với claim version trong token. Backend cũng xác nhận account đang enabled và unlocked.

Nếu token không hợp lệ hoặc account không hợp lệ, request dừng ở đây với `401`, không đi vào controller. Nếu hợp lệ, filter đưa `Authentication` vào `SecurityContext` và cho request đi tiếp. Endpoint dùng `@PreAuthorize` kiểm tra role; service kiểm tra tiếp dữ liệu bản ghi, ví dụ PT có thực sự được phép với member đó. Vì vậy câu trả lời trả về chỉ nằm trong phạm vi mà user được phép xem hoặc sửa.”

## Trang 19 — Sơ đồ đăng nhập và rate limit

**Mục tiêu:** làm rõ khóa đăng nhập bắt đầu từ lần sai thứ năm.

“Người dùng nhập identifier, password và tùy chọn nhớ đăng nhập. Frontend gọi `POST /v1/auth/login`. `AuthService` hỏi `InMemoryRateLimiter` trước xem identity hoặc IP có đang bị khóa hay không. Nếu đã khóa, hệ thống trả ngay `429` và header `Retry-After` để frontend hiển thị thời gian chờ.

Nếu attempt còn được phép, backend tìm user theo email hoặc số điện thoại đã chuẩn hóa, sau đó kiểm tra BCrypt password và trạng thái account. Khi credentials sai, limiter ghi nhận failure cho cả identity và IP. Nếu chưa đủ năm lần sai, response là `401 Bad Credentials`.

Ở lần sai thứ năm trong tracking window, limiter đặt `lockedUntil = now + 15 minutes`. Nghĩa là lần thứ năm bắt đầu một khoảng khóa 15 phút mới hoàn toàn, không phải lấy 15 phút trừ thời gian của các lần sai trước. Response là `429 RATE_LIMITED` với thời gian chờ đầy đủ.

Khi đăng nhập đúng, backend cập nhật `lastLoginAt`, xóa counter của identity và IP, tạo JWT chứa uid, roles, version, iat và exp, rồi trả token cùng thông tin user. Cơ chế này giảm nguy cơ brute force mà vẫn không ảnh hưởng đăng nhập bình thường.”

## Trang 20 — Sơ đồ đổi mật khẩu và thu hồi JWT bằng `authVersion`

**Mục tiêu:** mô tả cách token cũ bị vô hiệu mà không lưu session server-side.

“Một user đã đăng nhập gọi `POST /v1/auth/change-password` với JWT hiện có. Đầu tiên JWT filter kiểm tra chữ ký và expiration. Sau đó filter tải user hiện tại từ database, kiểm tra status và `authVersion`. Nếu token đã cũ, bị thu hồi hoặc account không hợp lệ, request trả `401` ngay và không đi đến service.

Với token hợp lệ, request vào sensitive endpoint rate limiter. Bộ lọc đếm theo operation đổi mật khẩu và user/IP. Nếu vượt 10 request trong 15 phút, hệ thống trả `429` với `Retry-After`.

Nếu request được phép, `AuthService` kiểm tra mật khẩu hiện tại bằng BCrypt. PasswordPolicy kiểm tra password mới: tối thiểu 8 ký tự, có chữ và số, không trùng email hoặc số điện thoại. Sau đó backend lưu hash mới và tăng `authVersion` trong cùng thao tác cập nhật.

Khi người dùng hoặc kẻ khác thử gọi API bằng JWT cũ, JWT filter lại nạp user và thấy version claim không còn khớp `authVersion` mới. Token cũ bị từ chối `401`. Đây là cách thu hồi token cũ tối giản trong kiến trúc JWT stateless; không cần lưu danh sách session trung tâm.”

## Trang 21 — Members, Phone Normalization, and Plan Validity

**Mục tiêu:** giải thích hội viên và trạng thái gói được tính theo thời gian thực.

“Tạo hội viên trước hết chỉ tạo hồ sơ cá nhân. Thao tác này không tự tạo gói, công nợ, portal, phân công PT hoặc lịch tập. Nhờ vậy hồ sơ khách đến hỏi thông tin không bị biến thành dữ liệu doanh thu hoặc dữ liệu PT.

Trước khi kiểm tra trùng, số điện thoại Việt Nam được chuẩn hóa. `members.phone` có unique constraint để giảm trường hợp `0901 000 004` và `0901000004` thành hai khách khác nhau. OWNER quản lý toàn bộ member. PT chỉ được thao tác trong scope do backend kiểm tra; OWNER cũng có thể kiêm PT nếu có roles và PT profile phù hợp.

Hiệu lực gói không phụ thuộc hoàn toàn vào enum được đổi bằng scheduler. `MembershipLifecyclePolicy` tính từ `startDate` và `endDate` khi đọc dữ liệu. Gói ACTIVE nhưng bắt đầu trong tương lai chưa hiệu lực hôm nay; gói có ngày kết thúc trong quá khứ được hiểu là EXPIRED khi truy vấn. Cách này tránh phải chạy job hàng ngày chỉ để đổi status hiển thị.”

## Trang 22 — Plan Registration/Renewal and Initial Collection

**Mục tiêu:** mô tả luồng đăng ký gói và ý nghĩa `initialPaidAmount`.

“OWNER hoặc PT có quyền hợp lệ với hội viên chọn gói, ngày bắt đầu, giá bán thực tế, giảm giá, số tiền thu ban đầu và ghi chú. `MemberMembershipService` kiểm tra quyền, plan còn active, ngày hợp lệ, các giá trị tiền và ngăn overlap không hợp lệ.

Hệ thống tạo `MemberMembership` cho lượt mua, tạo `DebtRecord` từ số tiền phải thu sau giảm giá, và nếu là gói PT thì tạo `PtSessionPackage` với định mức buổi. Nếu `initialPaidAmount` lớn hơn 0, backend kiểm tra ngày thu không nằm trong tương lai và có phương thức thanh toán, sau đó tạo payment đầu tiên và đồng bộ công nợ trong cùng transaction.

Nếu thu ngay bằng 0, backend không tạo payment, không ghi ngày thu hay phương thức thu. Trên giao diện hai trường này bị vô hiệu để người dùng thấy rõ rằng mới đăng ký gói, chưa hề nhận tiền. Khi khách trả sau, luồng thu nợ tạo một phiếu thu mới có ngày và phương thức đúng thực tế.”

## Trang 23 — Sơ đồ đăng ký/gia hạn gói và thu tiền ban đầu

**Mục tiêu:** đi chi tiết từng bước transaction đăng ký.

“Người thao tác là OWNER hoặc PT có scope hợp lệ. Họ chọn plan, ngày, giá, giảm giá và initial payment trên frontend. Frontend gọi endpoint tạo membership cho member đã chọn.

`MemberMembershipService` trước hết kiểm tra quyền và trạng thái active của plan. Sau đó service validate giá, giảm giá và initial paid amount. Service tính start/end date, xử lý gói nối tiếp nếu có gói hiện hành và chặn các khoảng thời gian chồng lấn không hợp lệ, đặc biệt khi nhập dữ liệu lịch sử.

Sau khi hợp lệ, backend lưu `ACTIVE MemberMembership`. Nếu giá trị phải thu sau giảm giá lớn hơn 0, backend tạo `OPEN DebtRecord` có `@Version`. Nếu initial paid amount lớn hơn 0, backend kiểm tra payment date không ở tương lai, yêu cầu payment method, tạo payment đầu tiên, rồi đồng bộ paid amount, remaining amount và debt status.

Nhánh còn lại rất quan trọng: initial paid bằng 0 thì không có `Payment`; giao diện cũng khóa ngày thu và phương thức. Nếu plan type là PT, backend tạo `PtSessionPackage` với định mức buổi. Toàn bộ bước diễn ra trong transaction; chỉ khi commit thành công frontend mới nhận response đăng ký hoàn chỉnh.”

## Trang 24 — Installment Collection, Debt, and Revenue by Payment Date

**Mục tiêu:** giải thích thanh toán nhiều đợt và doanh thu đúng tháng.

“Ở luồng thu nợ, OWNER hoặc PT có quyền trong scope chọn đúng debt record, nhập số tiền của đợt này, ngày lập phiếu, phương thức và ghi chú. `PaymentService` kiểm tra member, membership và debt có liên kết đúng không; amount phải lớn hơn 0, không vượt remaining amount và payment date không được ở tương lai.

Mỗi lần thu tạo một `Payment` độc lập. Ví dụ khách mua gói 11,2 triệu, đợt đầu trả 5 triệu chuyển khoản và vài ngày sau trả 6,2 triệu tiền mặt. Hệ thống có hai receipts riêng, giữ đúng method, note và payment date của từng đợt; không cố ép chúng thành một phương thức chung.

Sau mỗi payment, transaction đồng bộ `paidAmount`, `remainingAmount`, status của debt và tổng đã thu/còn nợ ở membership. Báo cáo doanh thu dựa trên từng `paymentDate`, vì vậy tiền thu trong tháng nào được ghi nhận cho tháng đó, không bị dồn sai vào ngày khách đăng ký gói. `@Version` trên debt tiếp tục bảo vệ trường hợp hai người thao tác thu cùng lúc.”

## Trang 25 — Sơ đồ thu nợ, đồng bộ số dư và chống ghi đè

**Mục tiêu:** làm rõ validation và optimistic locking của phiếu thu.

“Luồng bắt đầu khi OWNER hoặc PT có scope hợp lệ chọn một khoản nợ. Người dùng nhập amount, payment date, payment method và note. Backend kiểm tra bốn nhóm điều kiện: member/membership/debt phải đúng liên kết; amount phải dương; amount không vượt phần còn lại; payment date không sau ngày hiện tại.

Nếu không hợp lệ, hệ thống trả lỗi nghiệp vụ 400 và không tạo payment. Nếu hợp lệ, `@Transactional` tạo receipt `Payment`. Sau đó backend đồng bộ debt: paid amount, remaining amount và trạng thái OPEN, PARTIALLY_PAID hoặc PAID. Membership cũng được đồng bộ tổng đã thu và tổng còn nợ.

Ở lúc commit, `@Version` kiểm tra version hiện tại của `DebtRecord`. Nếu version vẫn khớp, transaction commit và hệ thống trả phiếu thu mới; báo cáo sẽ đọc theo payment date. Nếu người khác đã cập nhật debt trong lúc đó, version không còn khớp, transaction bị từ chối với `409 CONCURRENT_UPDATE`. UI cần tải lại số dư mới rồi mới thu tiếp. Đây là chống lost update, không phải khóa cứng làm người dùng phải chờ.”

## Trang 26 — PT Assignment and Appointment Coordination

**Mục tiêu:** phân biệt assignment, schedule và quyền PT.

“Trước khi PT làm việc với học viên, hệ thống cần assignment hợp lệ. PT phải đang active, member đang active, member có gói PT hiệu lực ở ngày bắt đầu và khoảng assignment không được vượt quá ranh giới gói PT. OWNER có thể kiêm PT vì `User` hỗ trợ tập roles và có thể có PT profile.

Khi tạo lịch, backend kiểm tra người thao tác, ngày giờ, thời điểm không ở quá khứ và `end > start`. Hệ thống tìm conflict `SCHEDULED` của cả PT lẫn member. Hai khoảng chỉ chạm nhau đúng endpoint, ví dụ 17:00–18:00 và 18:00–19:00, không bị xem là overlap.

Điểm nghiệp vụ cần nhấn mạnh: schedule chỉ là kế hoạch thời gian. Tạo lịch không trừ buổi PT. Buổi chỉ bị tiêu khi ghi nhận session log với trạng thái tiêu buổi. Các lịch có session log hoặc không còn trạng thái thích hợp không thể xóa tùy tiện để giữ lịch sử vận hành.”

## Trang 27 — PT Session Recording, Practice Check-ins, Measurements, and Goals

**Mục tiêu:** giải thích dữ liệu tiến trình PT.

“PT session log có thể ghi độc lập hoặc liên kết với một `scheduleId`. Nếu liên kết, backend kiểm tra schedule đang `SCHEDULED` và đúng PT/member. Cả hai trường hợp đều cần gói buổi PT còn hiệu lực và còn định mức.

Trạng thái quyết định việc tiêu buổi. `COMPLETED` và `MISSED` tiêu một buổi theo policy hiện tại; `CANCELLED` và `RESCHEDULED` không tiêu. Nếu session log liên kết lịch, schedule được đồng bộ trạng thái phù hợp. Backend ngăn ghi trùng: với lịch có `scheduleId`, một lịch chỉ có tối đa một session log theo rule; log độc lập kiểm tra session number hoặc ngày kết hợp trạng thái tiêu buổi.

Tự ôn tập dùng `MemberActivityLog` và allowance riêng, nên không bị lẫn với buổi 1-1. `BodyMeasurement` bắt buộc có ít nhất một chỉ số thực, không lưu một lần đo trống. `PtGoal` ghi mục tiêu và lộ trình nhưng không tự chuyển completed chỉ vì một lần đo chạm ngưỡng; điều này tránh kết luận sức khỏe chỉ dựa trên một dữ liệu.”

## Trang 28 — Sơ đồ phân công, lịch hẹn và ghi buổi PT

**Mục tiêu:** trình bày đầy đủ vòng đời PT theo chiều ngang.

“Bước một là assign PT. Backend đảm bảo PT active, member active, có PT plan hiệu lực và end date assignment không vượt end date của plan. Assignment là cơ sở để xác định PT có quyền với member.

Bước hai là tạo schedule. Backend kiểm tra không ở quá khứ, end time lớn hơn start time, và không conflict với lịch `SCHEDULED` của PT hoặc member. Schedule chỉ lưu kế hoạch, không tiêu session allowance.

Bước ba là record session log. Log có thể đứng độc lập hoặc được nối bằng `scheduleId`. Backend kiểm tra PT/member đúng, gói buổi còn hiệu lực và số buổi còn lại. Trước khi lưu, backend chống duplicate. Với schedule thì dùng schedule ID như business key; với log độc lập, kiểm tra package, session/date và trạng thái tiêu buổi.

Sau đó hệ thống rẽ theo status. `COMPLETED` hoặc `MISSED` tiêu một buổi PT và đồng bộ schedule nếu có liên kết. `CANCELLED` hoặc `RESCHEDULED` không tiêu buổi nhưng vẫn đồng bộ lịch liên quan. Nhờ phân biệt này, một lịch hẹn bị hủy không làm khách mất quyền lợi gói.”

## Trang 29 — ERD PT, theo dõi tiến trình và thư viện bài tập

**Mục tiêu:** giải thích các quan hệ chính trong miền PT.

“Ở phần PT, một `USER` có thể có `PT_PROFILE`; user cũng có thể là người được gán trong `PT_ASSIGNMENTS`. Assignment nối PT với member. `PT_SCHEDULES` nối PT và member theo lịch ngày giờ. Một member có thể có nhiều schedule; một PT cũng dạy nhiều member.

`PT_SESSION_PACKAGES` thuộc member và được tạo từ `MEMBER_MEMBERSHIPS` khi mua gói PT; package giữ allowance và version để chống trừ buổi đồng thời. `PT_SESSION_LOGS` thuộc session package, member và người ghi. Một schedule có thể chưa có log, nhưng theo business rule tối đa chỉ một log được liên kết vào cùng một schedule. Đây là rule ở service, không diễn giải thành database unique constraint nếu code chưa khai báo constraint đó.

`MEMBER_ACTIVITY_LOGS` ghi tự luyện, có thể tham chiếu membership và session package để dùng định mức riêng. `BODY_MEASUREMENTS` thuộc member và ghi nhận ai đo. `PT_GOALS` nối target với member và PT chịu trách nhiệm. Thư viện `EXERCISES` được phân loại bởi `EXERCISE_CATEGORIES` và là miền độc lập với việc tiêu buổi PT.”

## Trang 30 — Member Portal

**Mục tiêu:** mô tả portal là khu vực xem tiến trình cá nhân.

“OWNER có thể tạo portal account khi hội viên đang active, có số điện thoại và có ít nhất một membership hiệu lực. Membership đó có thể là gói PT hoặc gói tự tập hiệu lực; gói PT không phải ràng buộc bắt buộc. Điều này cho phép chủ phòng cấp portal trong những tình huống tự tập vẫn cần theo dõi thông tin.

Khi MEMBER gọi API portal, backend lấy member từ user ID trong `SecurityContext`, không nhận một member ID tùy ý từ client để truy cập người khác. MEMBER có thể xem gói cá nhân, số buổi, lịch PT, số đo, mục tiêu, payment và debt của chính mình.

Portal chủ yếu là read-only để theo dõi tiến trình và đổi password. Kích hoạt gói, xác nhận thanh toán, điều chỉnh công nợ và vận hành nghiệp vụ vẫn thuộc OWNER hoặc PT được phép. Portal account cũng không tự bị xóa ngay khi gói hết hạn; OWNER là người quản lý trạng thái, reset hoặc xóa account khi cần.”

## Trang 31 — Dashboard, Reports, and Operational Integrations

**Mục tiêu:** nêu đúng ý nghĩa báo cáo và giới hạn các tích hợp.

“Dashboard và Reports tổng hợp tình trạng hội viên, hiệu lực gói, doanh thu đã thực thu, công nợ và các nhóm ưu tiên. Reminder page chỉ hỗ trợ nhận diện và nhắc việc trên giao diện, không tự gửi Zalo hoặc SMS.

Hệ thống không có expense module, nên không tuyên bố tính lợi nhuận thực tế. Phần tài chính chỉ phản ánh doanh thu từ payments và khoản cần thu trong phạm vi hệ thống gym.

VietQR tạo hình QR từ cấu hình tài khoản nhận và số tiền. Không có bank webhook nên việc QR được hiển thị hay khách quét không làm debt giảm tự động; chủ phòng/PT vẫn lập phiếu thu sau khi xác nhận thực tế. TikTok Player dùng iframe theo `tiktokVideoId`; backend không download video và không quản lý view count.

XLSX được frontend tạo từ dữ liệu đã tải. Google Apps Script nhận snapshot khi OWNER chủ động đồng bộ. Hai tính năng này hỗ trợ xem và sao chép dữ liệu, không thay thế PostgreSQL và không có chức năng restore database.”

## Trang 32 — AI Advisor and Scenario Simulation

**Mục tiêu:** giải thích AI làm gì, nhận gì và không được làm gì.

“Trước khi gọi AI, `RetentionRevenueAdvisorService` đọc dữ liệu nghiệp vụ và tự tính các nhóm rủi ro/cơ hội bằng rule backend. Sau đó service tạo `AdvisorPayload` tổng hợp đã ẩn danh. Payload loại tên, số điện thoại, Zalo, email, địa chỉ và chi tiết giao dịch từng cá nhân.

Groq nhận system prompt cùng JSON payload và trả JSON theo contract gồm overview, risk, opportunity, seven-day plan và metrics. Backend yêu cầu `json_object`, dùng `temperature = 0.2` để giảm ngẫu nhiên, rồi validate/parse phản hồi trước khi đưa cho UI. AI không có quyền ghi PostgreSQL.

Phần mô phỏng cho OWNER nhập ba tỷ lệ từ 0 đến 100. `RetentionRevenueScenarioCalculator` trong backend tính tiền, làm tròn và tổng ảnh hưởng một cách deterministic. Groq chỉ diễn giải ưu tiên, không tính lại tiền. Renewal base còn loại các member đã thuộc PT-risk để không double count.

Nếu thiếu key, provider lỗi hoặc JSON không hợp lệ, hệ thống trả rule-based fallback với `aiGenerated=false`. Với lỗi 401, 403 hoặc 429, client AI có thể thử tuần tự key kế tiếp đã cấu hình, không chạy round-robin.”

## Trang 33 — Sơ đồ AI retention, revenue và scenario analysis

**Mục tiêu:** diễn giải tuần tự toàn bộ luồng AI và fallback.

“OWNER chọn kỳ báo cáo và có thể nhập ba tỷ lệ scenario. Frontend gọi `POST /v1/ai/retention-revenue-advisor`. Trước khi service chạy, sensitive rate limiter kiểm tra quota. Nếu vượt 10 request trong 15 phút, request trả `429` với `Retry-After`.

Khi request hợp lệ, service đọc active members, membership registrations, payments, debt, PT packages và activity history từ PostgreSQL. Service tự tính các risk/opportunity segments theo rule. Đây là phần nền số liệu có thể kiểm tra được, không giao toàn bộ việc tính toán cho LLM.

Tiếp theo service dựng aggregate payload không chứa PII. Nếu scenario values hợp lệ từ 0 đến 100, calculator tính ba giá trị tiền và tổng tác động; AI chỉ nhận để diễn giải ưu tiên và không tạo hay tính lại payment/debt.

Service gọi Groq với system prompt và `AdvisorPayload`, yêu cầu JSON object ở temperature 0.2. Nếu nhận JSON hợp lệ, backend lấy overview, risks, opportunities, seven-day plan, metrics và scenario interpretation, rồi trả UI với `aiGenerated=true`. Nếu 401, 403 hoặc 429, client thử key cấu hình kế tiếp theo thứ tự. Nếu vẫn lỗi, thiếu cấu hình hoặc JSON không hợp lệ, backend không hỏng báo cáo mà trả rule-based fallback với `aiGenerated=false`.”

## Trang 34 — Testing and Current Evaluation

**Mục tiêu:** báo cáo trung thực phạm vi kiểm thử.

“Em đã thực hiện manual functional testing ở local với React, Spring Boot, PostgreSQL và dữ liệu demo. Các luồng đã kiểm tra gồm login và rate limit, hội viên, gói, thu tiền/công nợ, nghiệp vụ PT, portal, report, AI và export.

Các tình huống biên được chú ý gồm PT vượt scope học viên, payment date ở tương lai, overpayment, hiệu lực gói theo ngày, conflict lịch, trạng thái nào tiêu buổi PT và trạng thái nào không tiêu. Backend có automated tests cho các policy chính; frontend đã chạy lint và production build.

Tuy nhiên, đánh giá này không khẳng định full test coverage, load test, penetration test, deep security test hoặc concurrency test ở quy mô production. Đây là ranh giới cần nói rõ để kết quả đánh giá chính xác và có trách nhiệm.”

## Trang 35 — Conclusion, Limitations, and Future Work

**Mục tiêu:** chốt kết quả, nêu giới hạn và định hướng mở rộng.

“Kết quả chính của đồ án là hoàn thành một hệ thống quản lý vận hành gym với ranh giới dữ liệu rõ ràng: gói khác lượt mua thực tế; lượt mua khác công nợ; công nợ khác phiếu thu; lịch hẹn khác buổi tập đã thực hiện. Sự tách biệt này giúp lịch sử và báo cáo ít bị nhầm lẫn khi có thanh toán nhiều đợt hoặc nhiều hoạt động PT.

Ở backend, hệ thống áp dụng transaction, `BigDecimal`, optimistic locking `@Version`, JWT cùng `authVersion`, RBAC kết hợp record-level access, rate limit và security headers. AI chỉ hỗ trợ diễn giải dữ liệu tổng hợp và có fallback, không thay quyền quyết định của chủ phòng.

Giới hạn hiện tại là MVP local: Flyway chưa active, chưa có workflow backup/restore database hoàn chỉnh, audit log đầy đủ, distributed rate limit hay production deployment. Soft delete mới là định hướng và cần policy/filter/restore riêng theo từng loại dữ liệu trước khi áp dụng. Hướng phát triển phù hợp là versioned migration, kiểm thử integration/concurrency/performance sâu hơn và chỉ làm payroll/commission PT sau khi chủ phòng chốt công thức nghiệp vụ thực tế.”

## Gợi ý trả lời nhanh khi được hỏi sâu

- **Vì sao không dùng microservices?** Quy mô gym hiện tại không cần chi phí vận hành của service discovery, gateway, tracing và deployment nhiều service. Modular monolith vẫn có ranh giới module rõ và phù hợp hơn.
- **Doanh thu tính theo đâu?** Theo từng `Payment.paymentDate`, không theo giá catalog hoặc ngày đăng ký gói.
- **Vì sao payment và debt là hai bảng?** Debt là nghĩa vụ phải thu có số dư; payment là mỗi sự kiện thu tiền. Một debt có thể có nhiều payment.
- **Vì sao tạo lịch không trừ buổi?** Lịch chỉ là cam kết thời gian; chỉ session log có status tiêu buổi mới phản ánh việc buổi tập đã xảy ra hoặc bị vắng theo policy.
- **JWT bị lộ rồi đổi mật khẩu có sao không?** Sau đổi/reset password, `authVersion` tăng; JWT cũ có version cũ bị từ chối ở request tiếp theo.
- **Rate limit có giới hạn gì?** Hiện in-memory, single-instance; restart backend xóa counter. Khi triển khai nhiều instance cần shared store như Redis và vận hành production phù hợp.
- **AI có xem dữ liệu cá nhân hay tự sửa dữ liệu không?** Không. Backend gửi aggregate payload đã loại PII; AI trả gợi ý JSON, không có quyền database và fallback khi provider lỗi.
