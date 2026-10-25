# Lời thuyết trình cho bộ slide 35 trang

Tài liệu này là ghi chú để trình bày bộ PDF `Duong_Double_Gym_Management_System_Slides.pdf`. Mỗi mục tương ứng đúng một trang PDF, gồm 21 slide nội dung và 14 slide sơ đồ Mermaid đã chèn.

Không cần đọc nguyên văn từng câu. Hãy dùng các đoạn dưới đây như một đường dẫn để nói tự nhiên, ưu tiên giải thích **vì sao hệ thống xử lý như vậy** thay vì đọc lại chữ trên slide. Tổng thời lượng phù hợp khoảng 35–45 phút; phần thời gian còn lại có thể dành cho demo và trả lời mentor.

## Nguyên tắc xuyên suốt khi trình bày

- Gọi hệ thống là ứng dụng local/MVP có thiết kế rõ ràng; không nói đã production-ready hoặc không còn lỗi.
- Phân biệt rõ: gói niêm yết, lượt mua, khoản nợ, phiếu thu, lịch hẹn và buổi tập thực tế là các dữ liệu khác nhau.
- Không nói AI dự đoán chính xác hoặc tự thay đổi dữ liệu. AI chỉ diễn giải dữ liệu tổng hợp mà backend chuẩn bị.
- Không nói VietQR tự xác nhận chuyển khoản, Google Sheets/XLSX thay thế PostgreSQL, Flyway đang chạy migration, hoặc `deleted` đã là soft delete hoàn chỉnh.
- Khi dùng từ “an toàn”, cần nói rõ đó là lớp bảo vệ hiện có và giới hạn của MVP local vẫn còn.

---

## Trang 01 — Hệ thống quản lý phòng gym Dương Double

**Mục tiêu nói:** mở đầu ngắn gọn, xác định đúng đề tài và bối cảnh thực tập.

“Em là Đoàn Thế Tín, thực tập tại Công ty TMA Bình Định dưới sự hướng dẫn của mentor Đặng Đình Hùng. Đề tài của em là xây dựng hệ thống quản lý phòng gym Dương Double. Hệ thống giải quyết các nghiệp vụ thường gặp ở phòng gym nhỏ: quản lý hội viên, gói tập, tiền thu, công nợ, PT và theo dõi tiến trình tập luyện.

Về công nghệ, frontend sử dụng React và TypeScript; backend là Java 21 với Spring Boot 4.1.1; dữ liệu nghiệp vụ lưu trên PostgreSQL. Em tập trung chủ yếu vào backend: thiết kế dữ liệu, quy tắc nghiệp vụ, transaction, phân quyền và bảo vệ API.”

Chuyển ý: “Đầu tiên, em trình bày bài toán thực tế và ranh giới mà đồ án giải quyết.”

## Trang 02 — Bài toán, mục tiêu, phạm vi và giá trị

**Mục tiêu nói:** cho mentor thấy vấn đề thực tế trước khi nói công nghệ.

“Ở mô hình phòng gym nhỏ, chủ phòng thường phải quản lý bằng sổ, tin nhắn hoặc bảng tính rời rạc. Khó khăn không chỉ là lưu tên khách mà là đối chiếu lịch sử: một khách có thể mua nhiều gói, trả tiền nhiều lần, có công nợ, được phân công PT và có lịch tập riêng.

Mục tiêu của hệ thống là số hóa các nghiệp vụ đó, giữ lịch sử rõ ràng và giúp chủ phòng tra cứu nhanh. Phạm vi gồm tài khoản, hội viên, bảng giá, đăng ký/gia hạn, công nợ, phiếu thu, PT, portal hội viên, báo cáo, thư viện bài tập và AI advisor.

Các phần em chủ động không đưa vào scope gồm chi phí/lợi nhuận thực tế, payroll hoặc hoa hồng PT, xác nhận thanh toán tự động qua ngân hàng, Zalo/SMS tự động, nhập hàng loạt, khôi phục database bằng XLSX và triển khai production. Việc giới hạn scope giúp em tập trung làm đúng các nghiệp vụ lõi thay vì làm rộng nhưng thiếu nhất quán.”

## Trang 03 — Tác nhân, quyền và ranh giới dữ liệu

**Mục tiêu nói:** phân biệt role với quyền thực tế trên backend.

“Hệ thống có bốn nhóm tác nhân. Khách truy cập chỉ xem trang công khai, bảng giá và video. OWNER là chủ phòng, quản lý nghiệp vụ toàn phòng: hội viên, nhân sự, cấu hình VietQR, báo cáo và AI. PT làm việc với khách mà backend cho phép trong phạm vi phân công và điều kiện gói hợp lệ. MEMBER là hội viên có portal để theo dõi dữ liệu cá nhân.

Điểm quan trọng là giao diện chỉ hỗ trợ điều hướng theo role. Quyết định cuối cùng luôn nằm ở backend: JWT xác thực người gọi, `@PreAuthorize` kiểm tra role, sau đó service kiểm tra tiếp record-level access. Vì vậy hai PT có cùng role không tự nhiên xem hoặc sửa được dữ liệu của nhau.”

## Trang 04 — Sơ đồ tác nhân và nhóm chức năng

**Mục tiêu nói:** giải thích trực quan phạm vi quyền vừa nêu, không đọc từng ô.

“Sơ đồ này minh họa lại các tác nhân theo luồng sử dụng. Khách truy cập đi vào khu vực công khai. OWNER có thể quản lý hồ sơ, gói, thu tiền, cấu hình và xem báo cáo/AI. PT được làm việc với khách hàng hợp lệ do backend kiểm tra; trong phạm vi đó PT có thể tham gia đăng ký gói, ghi nhận tiền và vận hành PT.

MEMBER đi vào portal tiến trình cá nhân. Cổng kết nối Groq chỉ xuất hiện phía báo cáo/AI; hội viên và PT không gọi AI trực tiếp. Điều cần nhấn mạnh là các mũi tên mô tả chức năng được phép ở mức nghiệp vụ, chứ không thay thế kiểm tra quyền trong từng API.”

## Trang 05 — Bản đồ chức năng và kiến trúc modular monolith

**Mục tiêu nói:** giải thích lựa chọn kiến trúc vừa đủ cho quy mô gym nhỏ.

“Về tổng thể, đây là modular monolith. Toàn bộ backend chạy trong một ứng dụng Spring Boot, không tách microservice, không có API Gateway hay service discovery. Tuy nhiên mã nguồn vẫn chia theo module nghiệp vụ như auth, user, member, membership, finance, PT, dashboard, exercise và AI.

Lựa chọn này phù hợp quy mô phòng gym nhỏ vì giảm số thành phần cần triển khai và giám sát. Đồng thời, các module vẫn có ranh giới rõ: ví dụ finance giữ nợ và phiếu thu, PT giữ lịch và buổi tập, membership giữ lượt đăng ký. Khi cần mở rộng sau này, các ranh giới này giúp thay đổi có kiểm soát thay vì gom tất cả vào một service lớn.”

## Trang 06 — Sơ đồ tổng quan lớp kỹ thuật và tích hợp ngoài

**Mục tiêu nói:** nêu rõ đâu là nguồn dữ liệu gốc và đâu chỉ là tích hợp hỗ trợ.

“Sơ đồ cho thấy frontend React gọi backend Spring Boot qua JSON/HTTP. Backend là nơi xử lý nghiệp vụ và PostgreSQL là nguồn dữ liệu gốc. Khi dùng AI, backend chỉ gửi payload tổng hợp, đã loại thông tin định danh trực tiếp, sang Groq.

Một số tích hợp nằm trực tiếp ở frontend. VietQR chỉ tạo ảnh QR chứa thông tin chuyển khoản; nó không tự tạo phiếu thu. TikTok chỉ được nhúng bằng iframe; hệ thống không tải video về database. Google Apps Script và Google Sheets nhận dữ liệu khi OWNER chủ động đồng bộ. Vì vậy, tất cả các tích hợp ngoài đều hỗ trợ vận hành, không thay thế PostgreSQL hoặc quyền quyết định của backend.”

## Trang 07 — Sơ đồ kiến trúc tổng thể và ranh giới xử lý

**Mục tiêu nói:** mô tả đường đi chính của request và các lớp bảo vệ.

“Ở sơ đồ này, frontend gọi API. Mọi API nhận security headers. Với endpoint public, request đi vào controller/service theo route public; với endpoint bảo vệ, request cần Bearer JWT. JWT filter kiểm tra chữ ký, hạn dùng, user hiện tại và `authVersion`. Sau đó sensitive rate limit filter chỉ áp dụng với một số POST nhạy cảm, rồi request mới đi vào controller, service, JPA/Hibernate và PostgreSQL.

Điểm quan trọng là service không chỉ tin ID do frontend gửi. Service kiểm tra quy tắc nghiệp vụ và phạm vi dữ liệu. Ví dụ, PT không được ghi buổi hoặc thu tiền cho bất kỳ hội viên nào, mà chỉ cho khách thuộc phạm vi quyền hợp lệ. Groq, VietQR, TikTok, XLSX và Google Sheets đều nằm ngoài đường ghi dữ liệu gốc.”

## Trang 08 — Frontend React, TypeScript và trải nghiệm người dùng

**Mục tiêu nói:** giới thiệu frontend vừa đủ, vì trọng tâm là backend.

“Frontend dùng React để tổ chức giao diện theo component và state; TypeScript giúp phát hiện sớm sai kiểu dữ liệu request/response trong lúc phát triển. Vite phục vụ môi trường dev và build static assets. Route được lazy-load để không phải tải toàn bộ code ngay khi mở trang.

Mã frontend được chia theo feature như members, payments, pt-schedule, reports, settings và member-portal. Mỗi feature đặt page, API client, type và component gần nhau. Tuy nhiên, frontend chỉ hỗ trợ trải nghiệm: nó có guard để điều hướng theo role và có validation form, nhưng backend mới là lớp quyết định quyền, số tiền, ngày thu và trạng thái nghiệp vụ.”

## Trang 09 — Sơ đồ tổ chức frontend theo feature

**Mục tiêu nói:** giải thích cấu trúc React theo luồng đơn giản.

“Sơ đồ bắt đầu từ `main.tsx`, khởi tạo ứng dụng và `App.tsx`. App quản lý provider, router và các guard như `ProtectedRoute`, `PublicOnlyRoute`, `RoleGuard`. Sau đó AppShell tạo khung giao diện, còn các feature chứa page, API, type và component theo nghiệp vụ.

`apiClient` dùng chung để gắn Bearer token, gọi backend và chuẩn hóa lỗi. Khi nhận 401, client xóa token lưu cục bộ và đưa người dùng về đăng nhập. Cấu trúc này giúp frontend không lặp cách gọi API ở từng trang, nhưng như đã nói, guard frontend không thay thế security backend.”

## Trang 10 — PostgreSQL, JPA, Hibernate và chiến lược entity

**Mục tiêu nói:** giới thiệu lớp lưu trữ và giải thích BaseEntity/audit đúng mức.

“PostgreSQL là database quan hệ lưu các dữ liệu nghiệp vụ gốc. JPA là chuẩn Java để mô tả entity và quan hệ; Hibernate là implementation ORM chuyển thao tác object Java thành SQL. Spring Data JPA giúp xây dựng repository cho các thao tác đọc/ghi phổ biến.

`BaseEntity` cung cấp khóa chính và cờ `deleted`; `AuditableEntity` bổ sung `createdAt` và `updatedAt`. Đây là nền tảng tái sử dụng, nhưng cần nói chính xác rằng `deleted` chưa có global filter hay luồng tự đặt cờ, nên chưa phải soft delete hoàn chỉnh. Một số entity cần truy vết người thao tác như Payment, MemberMembership, lịch PT và session log có thêm `createdBy`.

DTO được tách khỏi entity để frontend không phụ thuộc schema nội bộ và không nhận dữ liệu như password hash hay quan hệ lazy. `open-in-view` được tắt, vì vậy service map entity sang DTO trong ranh giới xử lý phù hợp.”

## Trang 11 — Thiết kế dữ liệu tài chính và ERD khái niệm

**Mục tiêu nói:** đây là điểm nghiệp vụ quan trọng nhất của đồ án.

“Thiết kế tài chính tách bốn khái niệm. `MembershipPlan` là bảng giá niêm yết. `MemberMembership` là một lượt khách mua hoặc gia hạn thực tế, có snapshot giá, giảm giá và thời hạn tại lúc bán. `DebtRecord` là nghĩa vụ phải thu của lượt mua. `Payment` là từng phiếu thu thực tế.

Tách như vậy giải quyết được hai tình huống thực tế: một khách mua nhiều lần, và một lượt mua trả nhiều đợt bằng nhiều phương thức khác nhau. Doanh thu không dựa vào ngày đăng ký gói mà dựa trên `Payment.paymentDate`; công nợ dựa trên số dư còn lại của `DebtRecord`.

Nhóm PT được tách khỏi tài chính: profile, assignment, schedule, session package và session log có vai trò riêng. Nhờ vậy không nhầm lịch hẹn với buổi đã tập, hoặc nhầm số buổi với tiền.”

## Trang 12 — ERD tài khoản, hội viên, gói và tài chính

**Mục tiêu nói:** không đọc mọi đường nối; đi theo câu chuyện dữ liệu.

“Đây là ERD logic của nhóm tài khoản, hội viên và tài chính. `users` có thể được gán nhiều role qua bảng nối `user_roles`; một user có thể liên kết với một member khi được cấp portal. Member có nhiều lượt đăng ký, và mỗi lượt chọn một membership plan.

Mỗi lượt mua có thể liên quan đến debt record và nhiều payment. Payment có `member_id`, có thể liên quan membership/debt, đồng thời có `created_by` để biết ai đã ghi nhận. Việc này giải thích vì sao cùng một gói có thể có hai phiếu: lần đầu chuyển khoản, lần sau tiền mặt.

`system_settings` đứng độc lập vì là cấu hình key-value, hiện dùng cho VietQR. Lưu ý chi tiết kỹ thuật: `setting_key` là khóa chính kiểu chuỗi, không có cột ID tự tăng. ERD chỉ giữ trường/quan hệ chính; các trường audit kế thừa không được lặp lại để sơ đồ dễ đọc.”

## Trang 13 — `@Transactional`, ACID, `BigDecimal`, `@Version` và Flyway

**Mục tiêu nói:** cho thấy các kỹ thuật bảo vệ dữ liệu, không nói quá mức đã kiểm thử production.

“Các thao tác thay đổi nhiều bản ghi dùng `@Transactional`. Ví dụ đăng ký gói có thể tạo lượt mua, khoản nợ, payment ban đầu và gói buổi PT. Nếu bất kỳ bước nào lỗi, toàn bộ thay đổi **cùng rollback**; nếu hợp lệ, chúng **cùng commit**. Đây là ý nghĩa cần nói chính xác, không phải rollback và commit đồng thời.

Tiền dùng `BigDecimal` để tránh sai số nhị phân của float/double. `@Version` là optimistic locking đặt trên DebtRecord và PtSessionPackage. Nếu hai thao tác cùng sửa một khoản nợ hoặc cùng trừ buổi, Hibernate phát hiện version không khớp, backend trả 409 `CONCURRENT_UPDATE` thay vì âm thầm ghi đè.

Flyway đã có dependency và thư mục migration để chuẩn bị mở rộng, nhưng đang tắt. Local hiện dùng Hibernate `ddl-auto=update`; vì vậy không trình bày Flyway là migration đang hoạt động.”

## Trang 14 — Kiến trúc Spring Boot và Dependency Injection

**Mục tiêu nói:** giải thích mô hình controller–service–repository.

“Trong Spring Boot, controller nhận HTTP request và trả DTO/response. Service là nơi điều phối quy tắc nghiệp vụ, phân quyền theo dữ liệu và transaction. Repository dùng Spring Data JPA để truy cập entity PostgreSQL. Entity mô tả mapping bảng/quan hệ.

Dependency Injection cho phép Spring tạo và ghép các bean qua constructor. Nhờ vậy service không phải tự `new` repository hoặc helper, giúp code dễ thay thế, dễ test và ít phụ thuộc cứng hơn. Các concern dùng chung như exception, response envelope, security, validation và chuẩn hóa điện thoại nằm trong module common.”

## Trang 15 — Sơ đồ phân tầng backend

**Mục tiêu nói:** đi theo một request từ trên xuống, rồi nhấn mạnh policy chung.

“Request đầu tiên đi qua security filter chain. Controller bind JSON vào request DTO và chạy validation. Service sau đó kiểm tra nghiệp vụ, mở transaction nếu cần, gọi policy dùng chung như membership lifecycle hoặc PT assignment policy, rồi gọi repository.

Repository trả entity; service map sang response DTO hoặc `PageResponse`/`ApiResponse`. Điều này giúp không trả trực tiếp entity ra API. Các lỗi validation, không tìm thấy dữ liệu hoặc conflict nghiệp vụ được `GlobalExceptionHandler` chuẩn hóa; riêng lỗi JWT ở filter có thể trả response ngay trước controller. Vì vậy không phải mọi lỗi trong hệ thống đều đi qua cùng một handler.”

## Trang 16 — Hành trình HTTP request, DTO, validation và phân trang

**Mục tiêu nói:** giải thích request pipeline tổng quát trước khi đi sâu bảo mật.

“Một thao tác từ frontend gửi JSON tới `/api/v1/...`; endpoint bảo vệ kèm Bearer token. Security filter chain xử lý headers, JWT và rate limit thích hợp. Controller bind request vào DTO, dùng `@Valid` để chặn lỗi cơ bản sớm.

Sau đó service kiểm tra rule thật như quyền, phạm vi member, số tiền, ngày thu, trạng thái gói. Repository/JPA/Hibernate đọc hoặc ghi PostgreSQL; service map kết quả thành DTO và response envelope. Những lỗi nghiệp vụ thường qua GlobalExceptionHandler, còn JWT không hợp lệ bị filter chặn trước.

Với danh sách dài, Member, Payment và Debt có API phân trang bằng `PageResponse`: `page` zero-based, `size` mặc định 10, lọc qua query parameter. Đây là cách gọn nhưng vẫn phù hợp khi dữ liệu tăng.”

## Trang 17 — Bảo mật đa tầng: JWT, phân quyền, rate limit và API

**Mục tiêu nói:** trình bày theo từng lớp, không gộp JWT và CORS thành một khái niệm.

“Backend dùng Spring Security ở chế độ stateless. JWT được ký HMAC-SHA256 và chứa `sub`, `uid`, `name`, `roles`, `ver`, `iat`, `exp`. Base64URL chỉ là encoding, không phải mã hóa; do đó token không chứa mật khẩu hoặc secret.

JWT filter kiểm tra chữ ký, hạn token, user hiện tại, trạng thái account và so `ver` với `authVersion`. Khi đổi hoặc reset mật khẩu, `authVersion` tăng, vì vậy token cũ bị từ chối ở request tiếp theo. `@PreAuthorize` kiểm tra role, còn service kiểm tra quyền theo bản ghi.

Đăng nhập sai năm lần trong cửa sổ theo dõi sẽ khóa mới 15 phút tính từ lỗi thứ năm. Endpoint nhạy cảm dùng ngưỡng 10 request/15 phút theo operation và actor/IP. API thêm security headers, không cache response, CORS chỉ giới hạn browser origin. Các lớp này không thay thế HTTPS, quản lý secret hay kiểm thử bảo mật production.”

## Trang 18 — Sơ đồ JWT và phân quyền request

**Mục tiêu nói:** nói chậm theo hai nhánh hợp lệ/không hợp lệ.

“Người dùng thực hiện thao tác cần đăng nhập, frontend gửi token trong header Authorization. Header filter thêm các header bảo mật; sau đó `JwtAuthenticationFilter` kiểm tra định dạng token, chữ ký HMAC và thời hạn.

Filter tải user hiện tại để lấy status, role và `authVersion` mới nhất. Nếu token hỏng, hết hạn, version cũ hoặc account không hợp lệ thì trả 401 và không vào controller. Nếu hợp lệ, filter đặt Authentication vào `SecurityContext`.

Sau đó endpoint có `@PreAuthorize` kiểm tra role, rồi service kiểm tra record-level access. Sơ đồ cho thấy rõ JWT chỉ xác thực danh tính/phiên; quyền trên một hội viên cụ thể vẫn phải được service kiểm tra tiếp.”

## Trang 19 — Sơ đồ đăng nhập và rate limit

**Mục tiêu nói:** nhấn mạnh cơ chế khóa bắt đầu lại từ sai lần thứ năm.

“Khi đăng nhập, AuthService yêu cầu InMemoryRateLimiter kiểm tra khóa theo định danh và IP trước. Nếu một trong hai đang khóa, backend trả 429 cùng `Retry-After`.

Nếu còn được thử, backend tra tài khoản theo email hoặc số điện thoại đã chuẩn hóa, kiểm tra BCrypt và trạng thái account. Mỗi lần sai được ghi vào bộ đếm. Khi sai lần thứ năm trong cửa sổ 15 phút, hệ thống đặt `lockedUntil = now + 15 phút` mới và ngay lần đó trả 429. Vì vậy nhập đúng ở lần thứ sáu vẫn không vào được cho đến khi hết khóa.

Khi đăng nhập đúng, backend cập nhật `lastLoginAt`, xóa bộ đếm liên quan, phát JWT và trả token/thông tin user. Đây là limiter in-memory một instance; restart backend sẽ mất state, nên chưa phải giải pháp phân tán dùng Redis.”

## Trang 20 — Sơ đồ đổi mật khẩu và thu hồi JWT theo `authVersion`

**Mục tiêu nói:** giải thích tại sao không cần lưu danh sách token để thu hồi cơ bản.

“Đổi mật khẩu là endpoint đã cần JWT hợp lệ. JWT filter kiểm tra token trước, sau đó sensitive rate limit kiểm soát tần suất. AuthService xác minh mật khẩu hiện tại, kiểm tra PasswordPolicy cho mật khẩu mới, rồi BCrypt hash mật khẩu.

Trước khi lưu user, service tăng `authVersion`. JWT cũ không bị sửa trực tiếp, nhưng nó mang claim `ver` cũ. Ở request tiếp theo, JWT filter tải lại user, so version và từ chối token cũ. Đây là cách thu hồi tối giản theo phiên bản, áp dụng cả các luồng reset mật khẩu PT/portal.

Điểm cần nói đúng: đăng xuất thông thường ở MVP chỉ xóa token phía browser; nó không phải blacklist từng JWT trên server.”

## Trang 21 — Hội viên, chuẩn hóa điện thoại và hiệu lực gói

**Mục tiêu nói:** làm rõ trạng thái được tính khi đọc, không cần scheduler đổi enum.

“Tạo hội viên chỉ tạo hồ sơ, chưa tự có gói, công nợ, portal, phân công PT hay lịch. Số điện thoại Việt Nam được chuẩn hóa trước khi kiểm tra trùng; database có unique constraint ở `members.phone` để bảo vệ thêm ở tầng dữ liệu.

OWNER có phạm vi toàn hệ thống. PT chỉ thao tác trên khách hợp lệ; OWNER cũng có thể kiêm PT khi user có role PT và PT profile phù hợp.

`MembershipLifecyclePolicy` đánh giá hiệu lực từ startDate/endDate. Một gói có enum ACTIVE nhưng start date ở tương lai vẫn chưa hiệu lực hôm nay. Gói qua end date được diễn giải là EXPIRED khi đọc. Cách này tránh cần scheduler chạy mỗi ngày chỉ để đổi enum, đồng thời giúp các màn hình dùng cùng một quy tắc.”

## Trang 22 — Đăng ký/gia hạn gói và thu ngay

**Mục tiêu nói:** giới thiệu quy tắc rẽ nhánh trước khi chiếu sequence diagram.

“OWNER hoặc PT có quyền phù hợp chọn gói, ngày bắt đầu, giá bán, giảm giá, số thu ngay và ghi chú. Backend kiểm tra gói active, quyền, thời gian không chồng lịch sử không hợp lệ và số tiền.

Lượt mua tạo `MemberMembership`. Nếu số tiền phải thu sau giảm giá lớn hơn 0, hệ thống tạo `DebtRecord`. Nếu thu ngay lớn hơn 0, hệ thống tạo payment đầu tiên và đồng bộ nợ. Nếu thu ngay bằng 0, không có payment và UI vô hiệu ngày/phương thức thu để không tạo cảm giác giao dịch đã xảy ra.

Gói PT còn tạo `PtSessionPackage` để theo dõi định mức buổi. Tất cả nằm trong một transaction, vì vậy không có tình huống chỉ lưu gói nhưng lại lưu thiếu phần dữ liệu liên quan do một bước sau lỗi.”

## Trang 23 — Sơ đồ đăng ký/gia hạn và thu tiền ban đầu

**Mục tiêu nói:** đi theo từng nhánh `opt` của sơ đồ.

“Sơ đồ bắt đầu từ OWNER hoặc PT có quyền trên hội viên. Service kiểm tra gói active, quyền, giá, giảm giá, số tiền thu ngay và ngày. Sau khi xác định start/end date, service tạo MemberMembership ở trạng thái ACTIVE.

Nhánh đầu tiên: nếu giá phải thu sau giảm giá lớn hơn 0 thì tạo DebtRecord OPEN với `@Version`. Nhánh thứ hai: nếu `initialPaidAmount > 0`, backend kiểm tra ngày thu không ở tương lai, kiểm tra phương thức, tạo Payment đầu tiên và đồng bộ số đã thu/số còn nợ. Nếu thu ngay bằng 0, không tạo Payment và UI khóa ngày/phương thức thu.

Nhánh cuối: nếu là gói PT, tạo PtSessionPackage với định mức buổi. Response chỉ trả sau khi toàn bộ transaction commit thành công.”

## Trang 24 — Thu nhiều đợt, công nợ và doanh thu theo ngày thu

**Mục tiêu nói:** dùng ví dụ cụ thể để mentor thấy lý do tách Payment.

“Khi khách còn nợ, OWNER hoặc PT có quyền phù hợp chọn khoản nợ, nhập số tiền, ngày thu, phương thức và ghi chú. Ví dụ gói 11,2 triệu, khách đóng 5 triệu chuyển khoản rồi vài ngày sau đóng 6,2 triệu tiền mặt: đó là hai Payment độc lập, không gộp thành một phương thức.

Mỗi lần thu được lưu với ngày và phương thức thực tế, nên lịch sử rõ và báo cáo doanh thu đúng kỳ. `PaymentService` kiểm tra amount dương, không vượt số dư, paymentDate không ở tương lai và member/membership/debt liên kết đúng.

Transaction cập nhật paidAmount, remainingAmount, status công nợ và tổng đã thu/còn nợ của membership. `@Version` trên DebtRecord hỗ trợ phát hiện khi hai người cùng thu một khoản nợ.”

## Trang 25 — Sơ đồ thu nợ nhiều đợt và đồng bộ công nợ

**Mục tiêu nói:** nhấn mạnh chỉ một transaction và nhánh conflict 409.

“Sơ đồ bắt đầu khi OWNER hoặc PT có quyền chọn debt. Backend kiểm tra các ID liên quan, amount, số dư và ngày thu. Nếu dữ liệu sai, trả 400 trước khi thay đổi database.

Nếu hợp lệ, transaction tạo Payment rồi đồng bộ DebtRecord: paidAmount, remainingAmount và trạng thái OPEN/PARTIALLY_PAID/PAID. Membership cũng được đồng bộ tổng đã thu và còn nợ. Khi commit, Hibernate kiểm tra `@Version`.

Nếu version còn khớp, transaction commit, trả phiếu thu mới và doanh thu được tính theo `paymentDate`. Nếu không khớp, backend trả 409 `CONCURRENT_UPDATE`; toàn bộ transaction rollback, người dùng tải lại dữ liệu rồi thu lại. Điều này chống lost update, không phải khóa cứng database dài hạn.”

## Trang 26 — Phân công PT và điều phối lịch hẹn

**Mục tiêu nói:** phân biệt assignment với schedule và session.

“Phân công PT chỉ hợp lệ khi PT active, member active và có gói PT phù hợp. Thời hạn assignment không được vượt thời hạn gói PT. OWNER có thể kiêm PT do user có tập role và có PT profile.

Sau phân công mới lên lịch. Schedule kiểm tra quyền, ngày giờ, endTime lớn hơn startTime và xung đột các lịch SCHEDULED của cả PT lẫn hội viên. Hai lịch chỉ chạm biên, ví dụ 8–9 giờ và 9–10 giờ, không bị coi là trùng.

Điểm nghiệp vụ quan trọng: schedule chỉ là kế hoạch thời gian. Tạo lịch không trừ buổi. Chỉ session log thực tế mới là bằng chứng buổi đã diễn ra hoặc vắng theo policy.”

## Trang 27 — Ghi buổi PT, tự ôn tập, số đo và mục tiêu

**Mục tiêu nói:** giải thích trạng thái tiêu buổi và các loại dữ liệu khác nhau.

“PT session log có thể được ghi độc lập hoặc liên kết một `scheduleId` đang SCHEDULED, đúng PT và đúng hội viên. Backend kiểm tra session package còn hiệu lực và còn số buổi.

`COMPLETED` và `MISSED` trừ một buổi PT theo policy hiện tại. `CANCELLED` và `RESCHEDULED` không trừ buổi; nếu có schedule liên kết thì trạng thái lịch cũng được đồng bộ. Hệ thống chặn trùng: khi có schedule, chỉ tối đa một log cho schedule đó; khi ghi độc lập, kiểm tra theo package/số buổi hoặc ngày và trạng thái tiêu buổi.

Tự ôn tập dùng `MemberActivityLog` với định mức riêng, không nhầm với PT 1-1. BodyMeasurement bắt buộc có ít nhất một chỉ số đo; PtGoal chỉ là mục tiêu/lộ trình, không tự hoàn thành chỉ vì một lần đo đạt ngưỡng.”

## Trang 28 — ERD PT, theo dõi tiến trình và thư viện

**Mục tiêu nói:** giải thích các điểm nối chính, không đọc toàn bộ bảng.

“ERD này là nhóm dữ liệu PT và tiến trình. `PtProfile` liên kết một user PT. `PtAssignment` nối PT với member theo thời hạn. `PtSchedule` là lịch hẹn; member có thể trống khi đó là lịch cá nhân/bận của PT.

`PtSessionPackage` thuộc member và lượt mua PT, có thể có PT phụ trách; nó giữ tổng/đã dùng/còn lại và `@Version`. `PtSessionLog` liên kết package, member và có thể liên kết schedule. Theo policy service, một schedule có thể chưa có log nhưng tối đa chỉ có một log liên kết với cùng `scheduleId`; đây là rule service, chưa phải UNIQUE constraint database.

ERD cũng có MemberActivityLog, BodyMeasurement, PtGoal, ExerciseCategory và Exercise. Các bảng users, members, memberships lặp lại trên sơ đồ chỉ vì chúng là điểm nối của miền PT.”

## Trang 29 — Sơ đồ phân công, lịch hẹn và ghi buổi PT

**Mục tiêu nói:** dùng sơ đồ để chốt chuỗi nghiệp vụ PT.

“Luồng bắt đầu bằng phân công PT hợp lệ. Từ assignment có thể lên lịch hoặc ghi buổi trực tiếp, nhưng cả hai đều phải tôn trọng quyền PT/member và gói còn hiệu lực. Lên lịch chỉ lưu kế hoạch, không trừ buổi.

Khi ghi session log, hệ thống chống trùng schedule hoặc log độc lập trùng định mức. Sau đó trạng thái log quyết định việc tiêu buổi: COMPLETED/MISSED trừ một buổi; CANCELLED/RESCHEDULED không trừ. Nếu log gắn lịch thì schedule được đồng bộ trạng thái tương ứng.

Điểm cần nhấn mạnh là hệ thống không tự coi lịch hẹn là đã tập. Tách schedule và session log giúp lịch hủy/dời không làm sai số buổi còn lại.”

## Trang 30 — Portal hội viên

**Mục tiêu nói:** mô tả portal là read-only và ranh giới access.

“Portal là khu vực riêng của MEMBER. OWNER mới cấp, khóa, reset mật khẩu hoặc gỡ liên kết portal. Khi cấp mới, member phải ACTIVE, có số điện thoại và ít nhất một membership hiệu lực; không bắt buộc là gói PT, vì gói tự tập còn hiệu lực cũng có thể cần theo dõi tiến trình.

Khi MEMBER gọi portal, backend không nhận memberId tùy ý. Service lấy user ID từ SecurityContext rồi tìm member liên kết, nên hội viên không thể sửa URL/request để xem dữ liệu người khác.

Portal chỉ cho xem gói, định mức, lịch PT, số đo, mục tiêu, payment và debt cá nhân; MEMBER có thể đổi mật khẩu. Kích hoạt gói và xác nhận thanh toán vẫn do OWNER/PT xử lý. Portal không tự xóa khi gói hết hạn; OWNER quản lý trạng thái tài khoản khi cần.”

## Trang 31 — Dashboard, báo cáo và tích hợp vận hành

**Mục tiêu nói:** phân biệt dashboard/báo cáo với kế toán toàn diện.

“Dashboard và báo cáo tổng hợp tình trạng hội viên, gói, doanh thu đã thu, công nợ và nhóm cần ưu tiên. Nhắc việc hỗ trợ người vận hành theo dõi nhưng không tự gửi Zalo hoặc SMS.

Hệ thống không tính lợi nhuận thực tế vì không có module chi phí. Số liệu tài chính trong scope là Payment và DebtRecord của các giao dịch gói tập trong hệ thống.

VietQR chỉ tạo ảnh QR; quét QR không tự tạo Payment. TikTok Player chỉ nhúng iframe từ video ID, backend lưu metadata/link chứ không quản lý lượt xem. XLSX do frontend tạo từ dữ liệu đã tải; Google Apps Script nhận bản sao khi OWNER chủ động đồng bộ. PostgreSQL vẫn là nguồn dữ liệu gốc.”

## Trang 32 — AI Advisor và mô phỏng kịch bản

**Mục tiêu nói:** nêu ranh giới backend rule và Groq.

“Chức năng AI không gửi toàn bộ hồ sơ khách cho Groq. `RetentionRevenueAdvisorService` đọc dữ liệu nghiệp vụ, áp dụng rule backend để tạo summary và segment rủi ro/cơ hội. Payload loại tên, số điện thoại, Zalo, email, địa chỉ và từng giao dịch cá nhân.

Groq nhận system prompt cùng JSON payload, trả JSON có overview, rủi ro, cơ hội, kế hoạch 7 ngày và chỉ số cần theo dõi. Backend yêu cầu `json_object`, đặt temperature 0.2 và chuẩn hóa kết quả trước khi trả UI.

Kịch bản là phần deterministic: OWNER nhập ba tỷ lệ 0–100, calculator backend tính giá trị thu nợ, phục hồi PT rủi ro và gia hạn/quay lại. Groq chỉ diễn giải ưu tiên, không tính tiền và không có quyền tạo Payment, sửa công nợ hay liên hệ khách.”

## Trang 33 — Sơ đồ phân tích AI, failover và fallback

**Mục tiêu nói:** giải thích đầy đủ từng tầng để tránh hiểu AI là “hộp đen”.

“OWNER chọn kỳ báo cáo và có thể nhập ba tỷ lệ scenario. Request trước tiên đi qua sensitive rate limit; vượt 10 request/15 phút trả 429 cùng Retry-After. Nếu hợp lệ, service đọc member active, membership, payment, debt, package PT và hoạt động, sau đó tính rule/segment trong backend.

Service tạo payload tổng hợp không có PII. Nếu có scenario, calculator tạo ba giá trị và tổng tác động trước khi gọi AI. Groq nhận system prompt và AdvisorPayload, được yêu cầu trả JSON object với temperature 0.2.

Nếu Groq trả JSON hợp lệ thì `aiGenerated=true`. Với lỗi 401, 403 hoặc 429, client thử key tiếp theo theo thứ tự — đây là failover tuần tự, không phải round-robin. Thiếu cấu hình, lỗi provider khác hoặc JSON sai thì backend trả fallback rule với `aiGenerated=false`. Như vậy màn hình vẫn có số liệu nền và không có thao tác ghi nào vào database.”

## Trang 34 — Kiểm thử và đánh giá hiện tại

**Mục tiêu nói:** trình bày trung thực phạm vi kiểm thử.

“Kiểm thử đã thực hiện chủ yếu là kiểm thử chức năng thủ công local với React, Spring Boot, PostgreSQL và dữ liệu demo. Các luồng đã đối chiếu gồm login/rate limit, hội viên, gói, payment/debt, PT, portal, dashboard, AI và xuất dữ liệu.

Các tình huống biên đã kiểm tra gồm quyền PT theo member, payment date tương lai, amount vượt nợ, hiệu lực gói, trùng lịch và trạng thái tiêu buổi. Backend cũng có test khởi động và test calculator kịch bản; frontend đã chạy lint/build trong quá trình phát triển.

Tuy nhiên, em không khẳng định full test coverage, load test, penetration test, integration test toàn diện hay đánh giá production. Đây là giới hạn được ghi rõ để kết quả trình bày trung thực với phạm vi đồ án.”

## Trang 35 — Kết luận, hạn chế và hướng phát triển

**Mục tiêu nói:** chốt kết quả bằng các ranh giới thiết kế chính.

“Kết quả chính của đồ án là xây dựng được hệ thống quản lý gym có ranh giới dữ liệu rõ: gói niêm yết khác lượt mua, khoản nợ khác phiếu thu, lịch hẹn khác buổi tập thực tế. Các kỹ thuật cốt lõi gồm transaction, optimistic locking, JWT/authVersion, RBAC kết hợp record-level access, rate limit và security headers.

AI advisor hỗ trợ diễn giải dữ liệu tổng hợp và có fallback; quyền quyết định vẫn thuộc OWNER. Về hạn chế, hệ thống đang ở local/MVP: Flyway chưa chạy migration, chưa có quy trình backup/restore, chưa có audit log toàn diện, rate limit chưa phân tán, và chưa triển khai production.

Hướng phát triển là chỉ mở rộng khi yêu cầu thật được chốt: migration versioned, backup/restore, audit log, đánh giá bảo mật production và payroll/hoa hồng PT sau khi chủ phòng xác định rõ công thức nghiệp vụ. Em xin cảm ơn và sẵn sàng trả lời câu hỏi.”

---

## Gợi ý khi mentor hỏi sâu

### Nếu hỏi “Vì sao không gộp gói, nợ và payment vào một bảng?”

“Vì ba đối tượng có vòng đời khác nhau. Bảng giá có thể thay đổi nhưng lượt mua cần giữ snapshot. Một lượt mua có thể phát sinh nghĩa vụ nợ. Một khoản nợ có thể được thu bằng nhiều payment, nhiều ngày và phương thức. Gộp lại sẽ mất lịch sử hoặc phải thêm nhiều cột khó nhất quán.”

### Nếu hỏi “PT có thể thu tiền không?”

“Có, OWNER và PT có endpoint thu tiền. Với PT, `MemberAccessService` giới hạn theo phạm vi hội viên hợp lệ; `Payment.createdBy` lưu user đang ghi nhận nên lịch sử hiển thị ai đã thu. PT không có quyền quản lý toàn bộ phòng hoặc xem/sửa dữ liệu của khách ngoài phạm vi.”

### Nếu hỏi “JWT có an toàn tuyệt đối không?”

“Không. JWT được ký để chống sửa nội dung, nhưng payload không phải dữ liệu bí mật. Dự án đã có hạn token, kiểm tra user hiện tại và `authVersion` để thu hồi token cũ sau đổi/reset mật khẩu. Khi production vẫn cần HTTPS, quản lý secret, phòng XSS, kiểm thử bảo mật và chính sách thiết bị.”

### Nếu hỏi “AI có dùng dữ liệu cá nhân khách không?”

“Backend tính trước summary/segment và chỉ gửi payload tổng hợp không có tên, điện thoại, email, Zalo, địa chỉ hay từng phiếu thu. Dù vậy không gọi là ẩn danh tuyệt đối vì nhóm quá nhỏ vẫn có rủi ro suy luận. AI không có credential gọi API nghiệp vụ để sửa dữ liệu.”

### Nếu hỏi “Flyway đã dùng chưa?”

“Chưa chạy migration. Dự án có dependency và thư mục migration để chuẩn bị mở rộng, nhưng local hiện dùng `ddl-auto=update`. Nếu triển khai thật, cần baseline schema, migration versioned, backup/restore thử nghiệm và quy trình review trước khi bật Flyway.”

### Nếu hỏi “Soft delete đã hoàn chỉnh chưa?”

“Chưa. `BaseEntity` có cờ `deleted` để định hướng tương lai, nhưng chưa có global filter hoặc cơ chế tự chuyển cờ ở mọi luồng. Với tiền và công nợ, hệ thống ưu tiên giữ lịch sử bằng các bản ghi nghiệp vụ hơn là xóa ẩn chung chung.”
