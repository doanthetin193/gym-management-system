# Sơ Đồ Mermaid Chèn Vào Slide

> File này là **phiên bản mở rộng để xuất ảnh chèn slide**, không phải nguồn để AI sinh nội dung slide. Các sơ đồ trong báo cáo tổng kết vẫn giữ gọn để in DOCX dễ đọc; các sơ đồ dưới đây bổ sung chi tiết kỹ thuật nhưng không thay đổi nghiệp vụ hay mã nguồn.
>
> Số hình được giữ nguyên theo báo cáo tổng kết để có thể trích dẫn nhất quán. **Thứ tự chèn cho slide có thể khác thứ tự số hình**: Slide 10 trình bày hành trình request tổng quát; Slide 11 đi sâu vào JWT, phân quyền và rate limit như cổng kiểm soát của request đã đăng nhập.

## Thứ tự chèn khuyến nghị

| Sau slide nội dung | Sơ đồ nên chèn | Mục đích |
| --- | --- | --- |
| Slide 03 | Hình 3.1 (tùy chọn) | Nhìn nhanh tác nhân và ranh giới quyền. |
| Slide 04 | Hình 3.2 | Kiến trúc tổng thể và các ranh giới tích hợp. |
| Slide 05 | Hình 3.4 (tùy chọn) | Tổ chức frontend theo feature. |
| Slide 07 | Hình 3.12 (tùy chọn) | ERD tài khoản, hội viên, gói, nợ và phiếu thu. |
| Slide 09 | Hình 3.3 (tùy chọn) | Phân tầng backend và vị trí map DTO. |
| Slide 10 | Không bắt buộc thêm sơ đồ | Dùng phần mô tả request pipeline để nối frontend, filter, Controller, Service, Repository và DTO. |
| Slide 11 | Hình 3.11, sau đó Hình 3.5; Hình 3.6 nếu còn thời gian | Cổng JWT/phân quyền, đăng nhập/rate limit, rồi đổi mật khẩu và thu hồi JWT. |
| Slide 13 | Hình 3.7 | Transaction đăng ký/gia hạn gói. |
| Slide 14 | Hình 3.8 | Thu nhiều đợt, `@Version` và đồng bộ công nợ. |
| Slide 16 | Hình 3.9; Hình 3.13 nếu được hỏi sâu | Luồng PT ngang, sau đó ERD nhóm PT/training. |
| Slide 19 | Hình 3.10 | AI advisor và mô phỏng kịch bản. |

## Hình 2.1 — Tổng quan lớp kỹ thuật và tích hợp ngoài

**Vị trí chèn:** Tùy chọn, sau Slide 04 nếu cần một sơ đồ tổng quan đơn giản hơn Hình 3.2.

```mermaid
flowchart LR
    User["Người dùng"] --> Web["Frontend<br/>React + TypeScript"]
    Web -->|"JSON qua HTTP"| Api["Backend<br/>Spring Boot REST API"]
    Api --> Data[("PostgreSQL")]
    Api -->|"Payload tổng hợp ẩn danh"| Groq["Groq AI"]
    Web -->|"Tạo URL ảnh QR"| VietQr["VietQR Image API"]
    Web -->|"Nhúng iframe"| TikTok["TikTok Player v1"]
    Web -->|"Gửi gói đồng bộ"| Sheets["Google Apps Script<br/>và Sheets"]
```

## Hình 3.1 — Tác nhân và nhóm chức năng

**Vị trí chèn:** Tùy chọn, sau Slide 03 khi cần trực quan hóa tác nhân và nhóm quyền.

```mermaid
flowchart LR
    Guest["Khách truy cập"] --> Public["Trang công khai<br/>bảng giá và video"]
    Owner["OWNER / Chủ phòng"] --> Admin["Hồ sơ, gói,<br/>thu tiền và cấu hình"]
    Owner --> Report["Dashboard, báo cáo<br/>và AI advisor"]
    Owner --> PTWork["Phân công, lịch hẹn<br/>và theo dõi PT"]
    Coach["PT"] --> Assisted["Khách được backend<br/>cho phép truy cập"]
    Coach --> Finance["Đăng ký/thu tiền<br/>trong phạm vi khách hợp lệ"]
    Coach --> PTWork
    Member["MEMBER / Hội viên"] --> Portal["Portal tiến trình<br/>cá nhân"]
    Report --> Groq["Dịch vụ Groq"]
```

## Hình 3.2 — Kiến trúc tổng thể và các ranh giới xử lý

**Vị trí chèn:** Ưu tiên, chèn thành một slide riêng sau Slide 04 và trước Hình 3.11.

```mermaid
flowchart LR
    User["Khách / OWNER / PT / MEMBER"] --> Web["Frontend<br/>React + TypeScript"]

    Web --> Header["API security headers<br/>áp dụng cho mọi API"]
    Header --> Route{"Public hay protected?"}
    Route -->|"Public"| Access["Controller + Service<br/>role và record-level access"]
    Route -->|"Protected + Bearer JWT"| Jwt["JWT filter<br/>chữ ký, hạn, authVersion"]
    Jwt --> Sensitive["Rate limit filter<br/>chỉ endpoint nhạy cảm"]
    Sensitive --> Access
    Access --> Jpa["JPA / Hibernate"]
    Jpa --> Db[("PostgreSQL<br/>nguồn dữ liệu gốc")]

    Access -.->|"Payload tổng hợp ẩn danh"| Groq["Groq AI"]
    Web -->|"Tạo ảnh QR"| VietQr["VietQR"]
    Web -->|"Nhúng iframe"| TikTok["TikTok Player"]
    Web -->|"Xuất / đồng bộ chủ động"| Export["XLSX / Google Apps Script"]
```

## Hình 3.11 — JWT và phân quyền request

**Vị trí chèn:** **Ưu tiên, chèn sau Slide 11 về bảo mật**. Sau khi Slide 10 đã giới thiệu hành trình request và Slide 09 giới thiệu Spring Boot, sơ đồ này đi sâu vào cổng kiểm soát của mọi request đã đăng nhập. Tiếp theo là Hình 3.5 về login/rate limit và, nếu cần, Hình 3.6 về thu hồi JWT.

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Frontend
    participant Header as Header filter
    participant JWT as JwtAuthenticationFilter
    participant Users as CustomUserDetailsService
    participant API as Controller và Service

    User->>UI: Thao tác cần đăng nhập
    UI->>Header: Request + Authorization Bearer token
    Header->>JWT: Gắn header bảo mật, chuyển request
    JWT->>JWT: Kiểm tra định dạng, chữ ký HMAC và exp
    JWT->>Users: Tải user hiện tại bằng sub/email
    Users-->>JWT: Status, role và authVersion hiện tại
    JWT->>JWT: So claim ver với authVersion
    JWT->>JWT: Kiểm tra account enabled và unlocked
    alt Token hoặc tài khoản không hợp lệ
        JWT-->>UI: 401 INVALID_TOKEN hoặc ACCOUNT_LOCKED
    else Token hợp lệ
        JWT->>JWT: Đặt Authentication vào SecurityContext
        JWT->>API: Đi tiếp filter chain và endpoint
        API->>API: @PreAuthorize kiểm tra role
        API->>API: Service kiểm tra record-level access
        API-->>UI: Response đúng phạm vi dữ liệu
    end
```

## Hình 3.3 — Cấu trúc các lớp backend

**Vị trí chèn:** Tùy chọn, sau Slide 09 nếu mentor hỏi sâu cách tổ chức mã Spring Boot.

```mermaid
flowchart TB
    Request["HTTP request"] --> Filter["Security filter chain<br/>headers, JWT, rate limit"]
    Filter --> Controller["Controller<br/>bind request DTO + @Valid"]
    Controller --> Service["Service<br/>rule nghiệp vụ, phân quyền,<br/>transaction và map response DTO"]
    Service --> Policy["Policy dùng chung<br/>membership lifecycle, PT assignment,<br/>record-level access"]
    Service --> Repository["Repository<br/>Spring Data JPA"]
    Repository --> Entity["Entity / enum<br/>Hibernate mapping"]
    Entity --> Database[("PostgreSQL")]
    Service --> Response["Response DTO<br/>ApiResponse / PageResponse"]
    Controller --> Exception["GlobalExceptionHandler<br/>validation, not found, conflict"]
    Service --> Exception
```

## Hình 3.4 — Cấu trúc ứng dụng frontend

**Vị trí chèn:** Tùy chọn, sau Slide 05 khi cần giải thích cách tổ chức React.

```mermaid
flowchart TB
    Main["main.tsx"] --> App["app/App.tsx<br/>providers và routes"]
    App --> Guard["ProtectedRoute<br/>PublicOnlyRoute / RoleGuard"]
    Guard --> Shell["layouts/AppShell"]
    Shell --> Features["features/*<br/>page, api, types, component"]
    Features --> Client["shared/api/apiClient"]
    Client --> Storage["shared/lib/authStorage"]
    Client --> Backend["Spring Boot API"]
    Shared["shared/*<br/>component, date, text, Zalo"] --> Features
```

## Hình 3.5 — Đăng nhập và rate limit

**Vị trí chèn:** Ưu tiên, sau Slide 11.

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Frontend
    participant Auth as AuthService
    participant Limit as InMemoryRateLimiter
    participant Users as UserDetails / PostgreSQL
    participant JWT as JwtService

    User->>UI: Nhập định danh và mật khẩu
    UI->>Auth: POST /v1/auth/login + định danh, mật khẩu, rememberMe
    Auth->>Limit: requireLoginAllowed(account, IP)
    alt Account hoặc IP đang bị khóa
        Limit-->>Auth: RateLimitExceededException
        Auth-->>UI: 429 + Retry-After
    else Còn được thử
        Auth->>Users: Tải user theo email hoặc SĐT đã chuẩn hóa
        Auth->>Auth: BCrypt matches và kiểm tra account enabled/unlocked
        alt Sai thông tin
            Auth->>Limit: recordLoginFailure(account, IP)
            alt Lỗi thứ năm trong cửa sổ theo dõi
                Limit->>Limit: lockedUntil = now + 15 phút
                Limit-->>Auth: 429 + Retry-After đầy đủ 15 phút
                Auth-->>UI: 429 RATE_LIMITED
            else Chưa đủ năm lỗi
                Auth-->>UI: 401 Bad Credentials
            end
        else Đúng thông tin
            Auth->>Users: Cập nhật lastLoginAt
            Auth->>Limit: Xóa bộ đếm account và IP
            Auth->>JWT: Sinh JWT có uid, roles, ver, iat, exp
            JWT-->>Auth: Access token
            Auth-->>UI: 200 + token và thông tin user
        end
    end
```

## Hình 3.6 — Đổi mật khẩu và thu hồi JWT

**Vị trí chèn:** Tùy chọn, sau Hình 3.5 nếu cần giải thích sâu `authVersion`.

```mermaid
sequenceDiagram
    actor User as Người dùng đã đăng nhập
    participant JWT as JwtAuthenticationFilter
    participant Users as CustomUserDetailsService
    participant Sensitive as SensitiveEndpointRateLimitFilter
    participant Auth as AuthService
    participant DB as PostgreSQL

    User->>JWT: POST /v1/auth/change-password + JWT
    JWT->>JWT: Kiểm tra chữ ký và exp
    JWT->>Users: Tải user hiện tại bằng sub/email
    Users->>DB: Đọc tài khoản hiện tại
    DB-->>Users: Status và authVersion
    Users-->>JWT: User hiện tại
    JWT->>JWT: Kiểm tra status và authVersion
    alt JWT không hợp lệ hoặc đã cũ
        JWT-->>User: 401, không vào service
    else JWT hợp lệ
        JWT->>Sensitive: Request đã có Authentication
        Sensitive->>Sensitive: Đếm theo change-password + user/IP
        alt Vượt 10 request / 15 phút
            Sensitive-->>User: 429 + Retry-After
        else Còn lượt
            Sensitive->>Auth: Gọi changePassword
            Auth->>Auth: So BCrypt mật khẩu hiện tại
            Auth->>Auth: Kiểm tra PasswordPolicy mật khẩu mới
            Auth->>DB: Lưu BCrypt hash mới và tăng authVersion
            Auth-->>User: Đổi mật khẩu thành công
            User->>JWT: Gọi API bằng JWT cũ
            JWT->>Users: Tải user để so claim ver
            Users->>DB: Đọc authVersion mới
            DB-->>Users: User sau đổi mật khẩu
            Users-->>JWT: authVersion mới
            JWT-->>User: 401 vì token cũ đã bị thu hồi
        end
    end
```

## Hình 3.7 — Đăng ký/gia hạn gói và thu tiền ban đầu

**Vị trí chèn:** Ưu tiên, sau Slide 13.

```mermaid
sequenceDiagram
    actor Staff as OWNER hoặc PT có quyền trên hội viên
    participant UI as Frontend
    participant Service as MemberMembershipService
    participant DB as PostgreSQL

    Staff->>UI: Chọn gói, ngày, giá, giảm giá, thu ngay
    UI->>Service: POST /members/{id}/memberships
    Service->>Service: Kiểm tra quyền và gói active
    Service->>Service: Kiểm tra giá, giảm giá và initialPaidAmount
    Service->>Service: Tính start/end và nối tiếp gói hiện có
    Service->>Service: Chặn chồng lấp khi nhập dữ liệu lịch sử
    Service->>DB: Lưu MemberMembership trạng thái ACTIVE
    opt Giá phải thu sau giảm > 0
        Service->>DB: Tạo DebtRecord OPEN với @Version
    end
    alt initialPaidAmount > 0
        Service->>Service: Kiểm tra ngày thu không ở tương lai
        Service->>Service: Kiểm tra có phương thức thu
        Service->>DB: Tạo Payment đầu tiên
        Service->>DB: Đồng bộ paidAmount, remainingAmount và trạng thái nợ
    else initialPaidAmount = 0
        Service->>Service: Không tạo Payment, UI khóa ngày và phương thức thu
    end
    opt Gói có planType = PT
        Service->>DB: Tạo PtSessionPackage với định mức buổi
    end
    Service-->>UI: Response lượt đăng ký sau commit nguyên tử
```

## Hình 3.8 — Thu nhiều đợt, đồng bộ công nợ và chống ghi đè

**Vị trí chèn:** Ưu tiên, sau Slide 14.

```mermaid
flowchart LR
    Start["OWNER/PT có quyền<br/>chọn khoản nợ"] --> Input["Nhập số tiền, ngày thu,<br/>phương thức và ghi chú"]
    Input --> Check{"Đúng member/membership/debt;<br/>amount > 0; amount ≤ remaining;<br/>paymentDate ≤ hôm nay?"}
    Check -- "Không" --> Reject["400: từ chối<br/>lỗi nghiệp vụ"]
    Check -- "Có" --> Tx["@Transactional<br/>tạo Payment"]
    Tx --> Sync["Đồng bộ DebtRecord:<br/>paidAmount, remainingAmount,<br/>OPEN/PARTIALLY_PAID/PAID"]
    Sync --> Membership["Đồng bộ MemberMembership:<br/>tổng đã thu và còn nợ"]
    Membership --> Version{"@Version còn khớp<br/>khi commit?"}
    Version -- "Có" --> Done["Commit; trả phiếu thu mới<br/>và báo cáo theo paymentDate"]
    Version -- "Không" --> Conflict["409 CONCURRENT_UPDATE<br/>tải lại trước khi thu lại"]
```

## Hình 3.9 — Phân công, lịch hẹn và ghi buổi PT

**Vị trí chèn:** Ưu tiên, sau Slide 16. Sơ đồ dùng hướng ngang để phù hợp slide 16:9.

```mermaid
flowchart LR
    Assign["1. Phân công PT<br/>PT active • member active<br/>có gói PT hiệu lực<br/>end assignment ≤ end gói"]
    Schedule["2. Lên lịch<br/>không quá khứ; end > start<br/>không trùng lịch SCHEDULED<br/>của PT hoặc hội viên"]
    Log["3. Ghi session log<br/>độc lập hoặc gắn scheduleId<br/>đúng PT/member; gói còn hiệu lực<br/>và còn số buổi"]
    Duplicate["Chống trùng<br/>scheduleId duy nhất; hoặc<br/>package + số buổi/ngày<br/>+ trạng thái tiêu buổi"]
    Status{"Trạng thái log"}
    Consume["COMPLETED / MISSED<br/>trừ 1 buổi PT<br/>đồng bộ lịch nếu có"]
    Keep["CANCELLED / RESCHEDULED<br/>không trừ buổi<br/>đồng bộ lịch nếu có"]

    Assign --> Schedule
    Assign --> Log
    Schedule -->|"Chỉ lưu kế hoạch,<br/>không trừ buổi"| Log
    Log -.->|"Kiểm tra trước khi lưu"| Duplicate
    Log --> Status
    Status --> Consume
    Status --> Keep
```

## Hình 3.10 — Phân tích AI giữ chân, doanh thu và kịch bản

**Vị trí chèn:** Ưu tiên, sau Slide 19.

```mermaid
sequenceDiagram
    actor Owner as OWNER
    participant UI as Trang báo cáo
    participant Limit as Sensitive rate limit
    participant Service as RetentionRevenueAdvisorService
    participant DB as PostgreSQL
    participant Groq as GroqAiClient

    Owner->>UI: Chọn kỳ và tùy chọn nhập 3 tỷ lệ kịch bản
    UI->>Limit: POST /v1/ai/retention-revenue-advisor
    alt Vượt 10 request / 15 phút
        Limit-->>UI: 429 + Retry-After
    else Còn lượt
        Limit->>Service: Request hợp lệ
        Service->>DB: Đọc member active và lượt đăng ký gói
        Service->>DB: Đọc payment, debt, gói PT và lịch sử hoạt động
        Service->>Service: Tính rule và segment rủi ro/cơ hội
        Service->>Service: Tạo payload tổng hợp không có PII
        opt Có scenario 0–100 hợp lệ
            Service->>Service: Calculator tính 3 giá trị và tổng tác động
            Service->>Service: AI chỉ diễn giải, không tính lại số tiền
        end
        Service->>Groq: System prompt và AdvisorPayload
        Service->>Groq: Yêu cầu json_object, temperature 0.2
        alt Groq trả JSON hợp lệ
            Groq-->>Service: Overview, risks và opportunities
            Groq-->>Service: Kế hoạch 7 ngày, metrics và scenario
            Service-->>UI: aiGenerated = true
        else 401 / 403 / 429
            Service->>Groq: Thử API key kế tiếp theo thứ tự
            Groq-->>Service: JSON hợp lệ hoặc lỗi tiếp
            Service-->>UI: JSON AI hoặc fallback theo rule
        else Thiếu cấu hình, provider lỗi hoặc JSON sai
            Service-->>UI: Fallback rule, aiGenerated = false
        end
    end
```

## Hình 3.12 — ERD tài khoản, hội viên, gói và tài chính

**Vị trí chèn:** Tùy chọn, sau Slide 07. Cùng Hình 3.13, hai sơ đồ bao phủ **toàn bộ 18 entity và bảng nối `user_roles`** đang ánh xạ PostgreSQL. Đây là ERD logic: chỉ giữ khóa/quan hệ quan trọng, không lặp các cột kế thừa `BaseEntity`/audit như `deleted`, `createdAt`, `updatedAt`. Các quan hệ audit tới `users` được gộp theo ý nghĩa “bán/tạo/ghi nhận”. `system_settings` độc lập nên không có đường nối.

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : co
    ROLES ||--o{ USER_ROLES : duoc_gan
    USERS o|--o| MEMBERS : tai_khoan_portal
    USERS o|--o{ MEMBER_MEMBERSHIPS : ban_hoac_tao
    USERS o|--o{ PAYMENT_TRANSACTIONS : ghi_nhan
    MEMBERS ||--o{ MEMBER_MEMBERSHIPS : dang_ky
    MEMBERSHIP_PLANS ||--o{ MEMBER_MEMBERSHIPS : duoc_chon
    MEMBERS ||--o{ DEBT_RECORDS : co_no
    MEMBER_MEMBERSHIPS o|--o{ DEBT_RECORDS : lien_quan
    MEMBERS ||--o{ PAYMENT_TRANSACTIONS : thanh_toan
    MEMBER_MEMBERSHIPS o|--o{ PAYMENT_TRANSACTIONS : thu_cho
    DEBT_RECORDS o|--o{ PAYMENT_TRANSACTIONS : phieu_thu

    USERS {
        bigint id PK
        string email UK
        bigint auth_version
    }
    MEMBERS {
        bigint id PK
        string phone UK
        bigint user_id FK
    }
    MEMBER_MEMBERSHIPS {
        bigint id PK
        bigint member_id FK
        bigint plan_id FK
        decimal actual_price
    }
    DEBT_RECORDS {
        bigint id PK
        bigint member_id FK
        bigint membership_id FK
        bigint version
    }
    PAYMENT_TRANSACTIONS {
        bigint id PK
        bigint member_id FK
        bigint membership_id FK
        bigint debt_record_id FK
        date payment_date
    }
    SYSTEM_SETTINGS {
        string setting_key PK
        string value
    }
```

## Hình 3.13 — ERD PT, theo dõi tiến trình và thư viện

**Vị trí chèn:** Tùy chọn, sau Slide 16. Các bảng `users`, `members` và `member_memberships` xuất hiện lại vì là điểm nối của miền PT; kết hợp với Hình 3.12 sẽ bao phủ toàn bộ bảng nghiệp vụ. Một lịch hẹn có thể chưa có nhật ký, nhưng service chỉ cho phép tối đa một `PtSessionLog` liên kết cùng một `scheduleId`; đây là quy tắc nghiệp vụ, chưa phải UNIQUE constraint trong database.

```mermaid
erDiagram
    USERS ||--o| PT_PROFILES : co_profile
    USERS ||--o{ PT_ASSIGNMENTS : phu_trach
    MEMBERS ||--o{ PT_ASSIGNMENTS : duoc_gan
    USERS ||--o{ PT_SCHEDULES : dung_lich_hoac_tao
    MEMBERS o|--o{ PT_SCHEDULES : co_lich
    USERS o|--o{ PT_SESSION_PACKAGES : pt_phu_trach_tuy_chon
    MEMBERS ||--o{ PT_SESSION_PACKAGES : so_huu
    MEMBER_MEMBERSHIPS ||--o{ PT_SESSION_PACKAGES : tao_dinh_muc
    PT_SESSION_PACKAGES ||--o{ PT_SESSION_LOGS : co_nhat_ky
    MEMBERS ||--o{ PT_SESSION_LOGS : tap
    USERS o|--o{ PT_SESSION_LOGS : ghi_hoac_tao
    PT_SCHEDULES o|--o| PT_SESSION_LOGS : toi_da_mot_nhat_ky
    MEMBERS ||--o{ MEMBER_ACTIVITY_LOGS : tu_on_tap
    MEMBER_MEMBERSHIPS o|--o{ MEMBER_ACTIVITY_LOGS : theo_goi
    PT_SESSION_PACKAGES o|--o{ MEMBER_ACTIVITY_LOGS : tru_dinh_muc
    MEMBERS ||--o{ BODY_MEASUREMENTS : duoc_do
    USERS o|--o{ BODY_MEASUREMENTS : recorded_by
    MEMBERS ||--o{ PT_GOALS : co_muc_tieu
    USERS o|--o{ PT_GOALS : pt_phu_trach
    EXERCISE_CATEGORIES o|--o{ EXERCISES : phan_loai

    PT_PROFILES {
        bigint id PK
        bigint user_id FK
    }
    PT_ASSIGNMENTS {
        bigint id PK
        bigint pt_user_id FK
        bigint member_id FK
    }
    PT_SCHEDULES {
        bigint id PK
        bigint pt_user_id FK
        bigint member_id FK
        date schedule_date
    }
    PT_SESSION_PACKAGES {
        bigint id PK
        bigint member_id FK
        bigint pt_user_id FK
        bigint membership_id FK
        bigint version
    }
    PT_SESSION_LOGS {
        bigint id PK
        bigint session_package_id FK
        bigint schedule_id FK
        bigint member_id FK
    }
    MEMBER_ACTIVITY_LOGS {
        bigint id PK
        bigint member_id FK
        bigint membership_id FK
        bigint session_package_id FK
    }
    BODY_MEASUREMENTS {
        bigint id PK
        bigint member_id FK
        bigint recorded_by FK
    }
    PT_GOALS {
        bigint id PK
        bigint member_id FK
        bigint pt_user_id FK
    }
    EXERCISES {
        bigint id PK
        bigint category_id FK
    }
```
