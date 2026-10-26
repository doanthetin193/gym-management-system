# Mermaid Diagrams for the English Slide Deck

> This file is the English counterpart of [so-do-mermaid-chen-slide.md](../so-do-mermaid-chen-slide.md). It is intended for rendering individual technical diagrams and inserting them into the completed 21-slide English deck; it is **not** source material for AI slide generation.
>
> The figure numbers, diagram structures, technical meanings, and recommended insertion order are kept consistent with the Vietnamese version. Only the explanatory text and Mermaid labels have been translated into English.

## Recommended insertion order

| Insert after content slide | Diagram | Purpose |
| --- | --- | --- |
| Slide 03 | Figure 3.1 (optional) | Quickly visualise actors and permission boundaries. |
| Slide 04 | Figure 2.1 (optional) | Present a compact technical overview. |
| Slide 04 | Figure 3.2 | Present the overall architecture and integration boundaries. |
| Slide 05 | Figure 3.4 (optional) | Explain feature-based frontend organisation. |
| Slide 07 | Figure 3.12 (optional) | Show the ERD for accounts, members, plans, debts, and receipts. |
| Slide 09 | Figure 3.3 (optional) | Show backend layers and where DTO mapping occurs. |
| Slide 10 | No additional diagram required | Use the request-pipeline explanation to connect frontend, filters, Controller, Service, Repository, and DTOs. |
| Slide 11 | Figure 3.11 | Explain JWT validation and authorization for protected requests. |
| Slide 11 | Figure 3.5 | Explain login rate limiting. |
| Slide 11 | Figure 3.6 (optional) | Explain password change and JWT revocation through `authVersion`. |
| Slide 13 | Figure 3.7 | Explain the registration/renewal transaction. |
| Slide 14 | Figure 3.8 | Explain installment collection, `@Version`, and debt synchronisation. |
| Slide 16 | Figure 3.9 | Explain the horizontal PT workflow. |
| Slide 16 | Figure 3.13 (optional) | Show the PT/training ERD when asked in depth. |
| Slide 19 | Figure 3.10 | Explain the AI advisor and scenario simulation. |

## Figure 2.1 — Technical layers and external integrations

**Insertion position:** Insert after **Slide 04** only. This is optional when a simpler architectural overview than Figure 3.2 is needed.

```mermaid
flowchart LR
    User["User"] --> Web["Frontend<br/>React + TypeScript"]
    Web -->|"JSON over HTTP"| Api["Backend<br/>Spring Boot REST API"]
    Api --> Data[("PostgreSQL")]
    Api -->|"Anonymised aggregate payload"| Groq["Groq AI"]
    Web -->|"Generate QR image URL"| VietQr["VietQR Image API"]
    Web -->|"Embed iframe"| TikTok["TikTok Player v1"]
    Web -->|"Send synchronisation payload"| Sheets["Google Apps Script<br/>and Sheets"]
```

## Figure 3.1 — Actors and functional groups

**Insertion position:** Insert after **Slide 03** only. This is optional when visualising actors and access groups is useful.

```mermaid
flowchart LR
    Guest["Guest"] --> Public["Public pages<br/>price list and videos"]
    Owner["OWNER / Gym owner"] --> Admin["Profiles, plans,<br/>collections and settings"]
    Owner --> Report["Dashboard, reports<br/>and AI advisor"]
    Owner --> PTWork["PT assignment, schedules<br/>and PT tracking"]
    Coach["PT"] --> Assisted["Members the backend<br/>allows the PT to access"]
    Coach --> Finance["Plan registration / collection<br/>within valid member scope"]
    Coach --> PTWork
    Member["MEMBER"] --> Portal["Personal progress<br/>portal"]
    Report --> Groq["Groq service"]
```

## Figure 3.2 — Overall architecture and processing boundaries

**Insertion position:** Insert after **Slide 04** only.

```mermaid
flowchart LR
    User["Guest / OWNER / PT / MEMBER"] --> Web["Frontend<br/>React + TypeScript"]

    Web --> Header["API security headers<br/>applied to every API response"]
    Header --> Route{"Public or protected?"}
    Route -->|"Public"| Access["Controller + Service<br/>role and record-level access"]
    Route -->|"Protected + Bearer JWT"| Jwt["JWT filter<br/>signature, expiry, authVersion"]
    Jwt --> Sensitive["Rate-limit filter<br/>sensitive endpoints only"]
    Sensitive --> Access
    Access --> Jpa["JPA / Hibernate"]
    Jpa --> Db[("PostgreSQL<br/>source of truth")]

    Access -.->|"Anonymised aggregate payload"| Groq["Groq AI"]
    Web -->|"Generate QR image"| VietQr["VietQR"]
    Web -->|"Embed iframe"| TikTok["TikTok Player"]
    Web -->|"Manual export / synchronisation"| Export["XLSX / Google Apps Script"]
```

## Figure 3.11 — JWT and request authorization

**Insertion position:** Insert after **Slide 11** only. It deepens the explanation of the control gate for authenticated requests.

```mermaid
sequenceDiagram
    actor User as User
    participant UI as Frontend
    participant Header as Header filter
    participant JWT as JwtAuthenticationFilter
    participant Users as CustomUserDetailsService
    participant API as Controller and Service

    User->>UI: Perform an authenticated action
    UI->>Header: Request with Authorization Bearer token
    Header->>JWT: Add security headers and continue the request
    JWT->>JWT: Validate token format, HMAC signature, and expiry
    JWT->>Users: Load current user by subject/email
    Users-->>JWT: Current status, roles, and authVersion
    JWT->>JWT: Compare token version claim with authVersion
    JWT->>JWT: Verify account is enabled and unlocked
    alt Invalid token or invalid account
        JWT-->>UI: 401 INVALID_TOKEN or ACCOUNT_LOCKED
    else Valid token
        JWT->>JWT: Put Authentication into SecurityContext
        JWT->>API: Continue filter chain and endpoint execution
        API->>API: @PreAuthorize validates role
        API->>API: Service validates record-level access
        API-->>UI: Response within the permitted data scope
    end
```

## Figure 3.3 — Backend layer structure

**Insertion position:** Insert after **Slide 09** only. This is optional if the mentor asks for a deeper explanation of Spring Boot code organisation.

```mermaid
flowchart TB
    Request["HTTP request"] --> Filter["Security filter chain<br/>headers, JWT, rate limit"]
    Filter --> Controller["Controller<br/>bind request DTO + @Valid"]
    Controller --> Service["Service<br/>business rules, authorization,<br/>transactions and response DTO mapping"]
    Service --> Policy["Shared policies<br/>membership lifecycle, PT assignment,<br/>record-level access"]
    Service --> Repository["Repository<br/>Spring Data JPA"]
    Repository --> Entity["Entity / enum<br/>Hibernate mapping"]
    Entity --> Database[("PostgreSQL")]
    Service --> Response["Response DTO<br/>ApiResponse / PageResponse"]
    Controller --> Exception["GlobalExceptionHandler<br/>validation, not found, conflict"]
    Service --> Exception
```

## Figure 3.4 — Frontend application structure

**Insertion position:** Insert after **Slide 05** only. This is optional when explaining React organisation.

```mermaid
flowchart TB
    Main["main.tsx"] --> App["app/App.tsx<br/>providers and routes"]
    App --> Guard["ProtectedRoute<br/>PublicOnlyRoute / RoleGuard"]
    Guard --> Shell["layouts/AppShell"]
    Shell --> Features["features/*<br/>page, api, types, component"]
    Features --> Client["shared/api/apiClient"]
    Client --> Storage["shared/lib/authStorage"]
    Client --> Backend["Spring Boot API"]
    Shared["shared/*<br/>component, date, text, Zalo"] --> Features
```

## Figure 3.5 — Login and rate limit

**Insertion position:** Insert after **Slide 11** only.

```mermaid
sequenceDiagram
    actor User as User
    participant UI as Frontend
    participant Auth as AuthService
    participant Limit as InMemoryRateLimiter
    participant Users as UserDetails and PostgreSQL
    participant JWT as JwtService

    User->>UI: Enter identifier and password
    UI->>Auth: POST /v1/auth/login with identifier, password, rememberMe
    Auth->>Limit: requireLoginAllowed(account, IP)
    alt Account or IP is currently locked
        Limit-->>Auth: RateLimitExceededException
        Auth-->>UI: 429 with Retry-After
    else Attempt is allowed
        Auth->>Users: Load user by email or normalised phone number
        Auth->>Auth: BCrypt matches and account enabled/unlocked check
        alt Invalid credentials
            Auth->>Limit: recordLoginFailure(account, IP)
            alt Fifth failure in the tracking window
                Limit->>Limit: lockedUntil = now + 15 minutes
                Limit-->>Auth: 429 with full 15-minute Retry-After
                Auth-->>UI: 429 RATE_LIMITED
            else Fewer than five failures
                Auth-->>UI: 401 Bad Credentials
            end
        else Valid credentials
            Auth->>Users: Update lastLoginAt
            Auth->>Limit: Clear account and IP counters
            Auth->>JWT: Create JWT with uid, roles, ver, iat, exp
            JWT-->>Auth: Access token
            Auth-->>UI: 200 with token and user information
        end
    end
```

## Figure 3.6 — Change password and revoke JWTs

**Insertion position:** Insert after **Slide 11** only. This is optional when a deeper explanation of `authVersion` is needed.

```mermaid
sequenceDiagram
    actor User as Signed-in user
    participant JWT as JwtAuthenticationFilter
    participant Users as CustomUserDetailsService
    participant Sensitive as SensitiveEndpointRateLimitFilter
    participant Auth as AuthService
    participant DB as PostgreSQL

    User->>JWT: POST /v1/auth/change-password with JWT
    JWT->>JWT: Validate signature and expiry
    JWT->>Users: Load current user by subject/email
    Users->>DB: Read current account
    DB-->>Users: Status and authVersion
    Users-->>JWT: Current user
    JWT->>JWT: Validate status and authVersion
    alt Invalid or revoked JWT
        JWT-->>User: 401 - request does not reach the service
    else Valid JWT
        JWT->>Sensitive: Request with Authentication
        Sensitive->>Sensitive: Count by change-password and user/IP
        alt More than 10 requests in 15 minutes
            Sensitive-->>User: 429 with Retry-After
        else Request is allowed
            Sensitive->>Auth: Call changePassword
            Auth->>Auth: BCrypt verifies current password
            Auth->>Auth: PasswordPolicy validates new password
            Auth->>DB: Save new BCrypt hash and increment authVersion
            Auth-->>User: Password changed successfully
            User->>JWT: Call an API with the old JWT
            JWT->>Users: Load user to compare version claim
            Users->>DB: Read new authVersion
            DB-->>Users: User after password change
            Users-->>JWT: New authVersion
            JWT-->>User: 401 because the old token was revoked
        end
    end
```

## Figure 3.7 — Plan registration/renewal and initial collection

**Insertion position:** Insert after **Slide 13** only.

```mermaid
sequenceDiagram
    actor Staff as OWNER or PT with valid member scope
    participant UI as Frontend
    participant Service as MemberMembershipService
    participant DB as PostgreSQL

    Staff->>UI: Choose plan, dates, price, discount, and initial payment
    UI->>Service: POST /members/{id}/memberships
    Service->>Service: Validate access and active plan
    Service->>Service: Validate price, discount, and initialPaidAmount
    Service->>Service: Calculate start/end dates and chain from current plan
    Service->>Service: Block overlaps in historical-data entry
    Service->>DB: Save ACTIVE MemberMembership
    opt Net receivable after discount is greater than zero
        Service->>DB: Create OPEN DebtRecord with @Version
    end
    alt initialPaidAmount is greater than zero
        Service->>Service: Validate payment date is not in the future
        Service->>Service: Validate a payment method is supplied
        Service->>DB: Create first Payment
        Service->>DB: Synchronise paidAmount, remainingAmount, and debt status
    else initialPaidAmount equals zero
        Service->>Service: Do not create Payment, and the UI disables payment date and method
    end
    opt planType equals PT
        Service->>DB: Create PtSessionPackage with session allowance
    end
    Service-->>UI: Registration response after atomic commit
```

## Figure 3.8 — Installment collection, debt synchronisation, and overwrite prevention

**Insertion position:** Insert after **Slide 14** only.

```mermaid
flowchart LR
    Start["OWNER/PT with valid scope<br/>selects a debt record"] --> Input["Enter amount, payment date,<br/>method, and note"]
    Input --> Check{"Correct member/membership/debt;<br/>amount > 0; amount <= remaining;<br/>paymentDate <= today?"}
    Check -- "No" --> Reject["400: reject<br/>business-rule error"]
    Check -- "Yes" --> Tx["@Transactional<br/>create Payment"]
    Tx --> Sync["Synchronise DebtRecord:<br/>paidAmount, remainingAmount,<br/>OPEN/PARTIALLY_PAID/PAID"]
    Sync --> Membership["Synchronise MemberMembership:<br/>total collected and outstanding debt"]
    Membership --> Version{"Does @Version still match<br/>at commit?"}
    Version -- "Yes" --> Done["Commit; return new receipt<br/>and report by paymentDate"]
    Version -- "No" --> Conflict["409 CONCURRENT_UPDATE<br/>reload before collecting again"]
```

## Figure 3.9 — PT assignment, scheduling, and session recording

**Insertion position:** Insert after **Slide 16** only. The diagram is horizontal to fit a 16:9 slide.

```mermaid
flowchart LR
    Assign["1. Assign PT<br/>PT active; member active<br/>effective PT plan exists<br/>assignment end <= plan end"]
    Schedule["2. Create schedule<br/>not in the past; end > start<br/>no SCHEDULED conflict<br/>for PT or member"]
    Log["3. Record session log<br/>standalone or linked by scheduleId<br/>correct PT/member; effective package<br/>and remaining allowance"]
    Duplicate["Prevent duplicates<br/>unique scheduleId; or<br/>package + session/date<br/>+ consuming status"]
    Status{"Log status"}
    Consume["COMPLETED / MISSED<br/>consume one PT session<br/>synchronise schedule when linked"]
    Keep["CANCELLED / RESCHEDULED<br/>consume no session<br/>synchronise schedule when linked"]

    Assign --> Schedule
    Assign --> Log
    Schedule -->|"Stores a plan only;<br/>does not consume a session"| Log
    Log -.->|"Validate before saving"| Duplicate
    Log --> Status
    Status --> Consume
    Status --> Keep
```

## Figure 3.10 — AI retention, revenue, and scenario analysis

**Insertion position:** Insert after **Slide 19** only.

```mermaid
sequenceDiagram
    actor Owner as OWNER
    participant UI as Reports page
    participant Limit as Sensitive rate limit
    participant Service as RetentionRevenueAdvisorService
    participant DB as PostgreSQL
    participant Groq as GroqAiClient

    Owner->>UI: Select period and optionally enter three scenario percentages
    UI->>Limit: POST /v1/ai/retention-revenue-advisor
    alt More than 10 requests in 15 minutes
        Limit-->>UI: 429 with Retry-After
    else Request is allowed
        Limit->>Service: Valid request
        Service->>DB: Read active members and membership registrations
        Service->>DB: Read payments, debt, PT packages, and activity history
        Service->>Service: Calculate rule-based risk and opportunity segments
        Service->>Service: Build an aggregate payload without PII
        opt Valid scenario values from 0 to 100
            Service->>Service: Calculator computes three values and total impact
            Service->>Service: AI interprets priorities and does not recalculate money
        end
        Service->>Groq: System prompt and AdvisorPayload
        Service->>Groq: Request json_object with temperature 0.2
        alt Groq returns valid JSON
            Groq-->>Service: Overview, risks, and opportunities
            Groq-->>Service: Seven-day plan, metrics, and scenario interpretation
            Service-->>UI: aiGenerated = true
        else 401 / 403 / 429
            Service->>Groq: Try the next configured API key in order
            Groq-->>Service: Valid AI JSON or another error
            Service-->>UI: AI JSON or rule-based fallback
        else Missing configuration, provider error, or invalid JSON
            Service-->>UI: Rule-based fallback, aiGenerated = false
        end
    end
```

## Figure 3.12 — ERD: accounts, members, plans, and finance

**Insertion position:** Insert after **Slide 07** only. This is optional. Together with Figure 3.13, these diagrams cover all 18 mapped entities and the `user_roles` join table in PostgreSQL. They are logical ERDs: only important keys and relationships are shown; inherited `BaseEntity`/audit columns such as `deleted`, `createdAt`, and `updatedAt` are not repeated. Audit relationships to `users` are summarised by their business meanings: “sold/created/recorded”. `system_settings` is independent, so no relationship line is drawn.

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned
    USERS o|--o| MEMBERS : portal_account
    USERS o|--o{ MEMBER_MEMBERSHIPS : sold_or_created
    USERS o|--o{ PAYMENT_TRANSACTIONS : recorded
    MEMBERS ||--o{ MEMBER_MEMBERSHIPS : registers
    MEMBERSHIP_PLANS ||--o{ MEMBER_MEMBERSHIPS : selected
    MEMBERS ||--o{ DEBT_RECORDS : owes
    MEMBER_MEMBERSHIPS o|--o{ DEBT_RECORDS : related_to
    MEMBERS ||--o{ PAYMENT_TRANSACTIONS : pays
    MEMBER_MEMBERSHIPS o|--o{ PAYMENT_TRANSACTIONS : collected_for
    DEBT_RECORDS o|--o{ PAYMENT_TRANSACTIONS : receipt

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

## Figure 3.13 — ERD: PT, progress tracking, and exercise library

**Insertion position:** Insert after **Slide 16** only. This is optional. The `users`, `members`, and `member_memberships` tables are repeated because they connect the PT domain. Combined with Figure 3.12, the two diagrams cover the business tables. A schedule may have no session log, but the service allows at most one `PtSessionLog` linked to the same `scheduleId`; this is a business rule, not a database UNIQUE constraint.

```mermaid
erDiagram
    USERS ||--o| PT_PROFILES : has_profile
    USERS ||--o{ PT_ASSIGNMENTS : assigned_to
    MEMBERS ||--o{ PT_ASSIGNMENTS : is_assigned
    USERS ||--o{ PT_SCHEDULES : teaches_or_creates
    MEMBERS o|--o{ PT_SCHEDULES : has_schedule
    USERS o|--o{ PT_SESSION_PACKAGES : optional_responsible_pt
    MEMBERS ||--o{ PT_SESSION_PACKAGES : owns
    MEMBER_MEMBERSHIPS ||--o{ PT_SESSION_PACKAGES : creates_allowance
    PT_SESSION_PACKAGES ||--o{ PT_SESSION_LOGS : has_logs
    MEMBERS ||--o{ PT_SESSION_LOGS : trains
    USERS o|--o{ PT_SESSION_LOGS : records_or_creates
    PT_SCHEDULES o|--o| PT_SESSION_LOGS : at_most_one_log
    MEMBERS ||--o{ MEMBER_ACTIVITY_LOGS : self_practices
    MEMBER_MEMBERSHIPS o|--o{ MEMBER_ACTIVITY_LOGS : under_plan
    PT_SESSION_PACKAGES o|--o{ MEMBER_ACTIVITY_LOGS : consumes_allowance
    MEMBERS ||--o{ BODY_MEASUREMENTS : measured
    USERS o|--o{ BODY_MEASUREMENTS : recorded_by
    MEMBERS ||--o{ PT_GOALS : has_goals
    USERS o|--o{ PT_GOALS : responsible_pt
    EXERCISE_CATEGORIES o|--o{ EXERCISES : categorises

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
