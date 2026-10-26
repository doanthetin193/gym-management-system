# Presentation Content Source — Duong Double Gym Management System

## Slide 01 — Cover

- **Duong Double Gym Management System**.
- A web-based system for managing members, membership plans, revenue, outstanding debt, personal training operations, member progress, and operational reports.
- Student: **Doan The Tin**.
- Badge ID: **678**.
- Internship organization: **TMA Binh Dinh**.
- Mentor: **Dang Dinh Hung**.
- Core technologies: Java 21, Spring Boot 4.1.1, PostgreSQL, React 19, and TypeScript.

## Slide 02 — Problem, Objectives, Scope, and Value

- A small gym must manage members, plans, expiry dates, payments, debt, and personal trainers at the same time. Spreadsheets or handwritten records easily lose history and create reconciliation errors.
- A member can purchase several plans and pay one purchase in several installments by cash or bank transfer. A planned PT appointment is also different from a session that was actually completed.
- The main objective is to digitize these workflows, preserve consistent data, and give the owner a focused view of gym operations.
- The scope includes accounts, members, plan catalog management, registration and renewal, receipts, debt, PT operations, member portal access, reports, AI advice, and an exercise-video library.
- OWNER manages gym-wide operations; PT works only with members permitted by the backend; MEMBER follows personal progress through the portal.
- Outside the current scope: real operating expenses/profit, PT payroll or commissions, payment webhooks, automated Zalo/SMS, bulk import, database restoration from XLSX, and production deployment.

## Slide 03 — Actors, Permissions, and Data Boundaries

| Actor | Business role | Access boundary |
| --- | --- | --- |
| Public visitor | Views public pages, published plans, and published videos | Cannot access administrative data |
| OWNER | Administers the gym, staff, VietQR, reports, AI, and PT coordination | Full access within the gym scope |
| PT | Serves members allowed by backend rules | Cannot administer all members or configuration |
| MEMBER | Views personal plan, schedule, and progress through the portal | Cannot read or modify another member’s data |

- UI roles help navigation only. The backend makes the final authorization decision through JWT validation, `@PreAuthorize`, and record-level authorization checks.

## Slide 04 — Functional Map and Modular Monolith Architecture

- Backend business modules: `auth`, `user`, `member`, `membership`, `finance`, `pt`, `training`, `dashboard`, `ai`, `exercise`, and `common`.
- Frontend stack: React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS, and Lucide React.
- Backend stack: Java 21, Spring Boot, Spring Security, Spring Data JPA, Bean Validation, and Maven.
- PostgreSQL is the core database. External integrations include Groq, TikTok Player, VietQR, Google Apps Script, and XLSX export.
- The project uses a modular monolith: one Spring Boot application with clear business boundaries. This suits the current gym scale and avoids unnecessary microservice or API Gateway complexity.

## Slide 05 — React, TypeScript, and User Experience

- React organizes the user interface into pages and reusable components, which is suitable for screens whose data and state change frequently.
- TypeScript provides static types for DTOs, API responses, forms, and state. Type mismatches can be detected during development or build time rather than only at runtime.
- Vite provides a fast development server and production asset build. Routes use `lazy` and `Suspense` so pages can load when needed.
- Frontend code is organized by features such as `members`, `payments`, `pt-schedule`, `reports`, `settings`, and `member-portal`; each feature keeps its API, types, pages, and components close to its business purpose.
- Tailwind CSS and Lucide icons maintain a consistent UI. Forms visibly reflect business states such as zero initial payment, expected debt, and rate-limit waiting time.

## Slide 06 — PostgreSQL, JPA, Hibernate, and Entity Strategy

- PostgreSQL stores the source-of-truth business data: users, members, plans, debt, receipts, PT records, measurements, goals, videos, and settings.
- JPA is the Java persistence specification for entities, mappings, and relationships. Hibernate is the ORM implementation that translates Java object operations into PostgreSQL SQL.
- Annotations such as `@Entity`, `@Table`, `@ManyToOne`, `@JoinColumn`, and `@Enumerated` define tables, foreign keys, and enum mappings. Spring Data JPA provides repository abstractions.
- Services own business rules and transaction boundaries. DTOs separate the API contract from entities so the frontend does not depend on internal schema, password hashes, or internal relationships.
- `BaseEntity` provides the primary key and a `deleted` flag; `AuditableEntity` adds `createdAt` and `updatedAt`. `createdBy` is used only on records that need operational traceability, such as payments, membership purchases, PT schedules, and PT logs.
- `spring.jpa.open-in-view=false` prevents the persistence context from remaining open while rendering an HTTP response. Services map entities to DTOs within an appropriate processing boundary.
- The `deleted` field is a foundation for future soft delete. It does not yet have a global filter or automatic marking mechanism. Financial receipts and debt instead preserve history through explicit business records such as cancellation or adjustment policies.

## Slide 07 — Financial Data Design and ERD

- `MembershipPlan` is the listed catalog price. `MemberMembership` represents each real purchase or renewal and stores a snapshot of price, discount, and duration.
- `DebtRecord` represents the amount receivable for a purchase. `Payment` represents each independent receipt, including payment date, payment method, and the staff member who recorded it.
- This separation supports repeated purchases, multiple installments for one purchase, and different payment methods while preserving a transparent history.
- Revenue is calculated from `Payment.paymentDate`, not merely from the plan registration date. Outstanding debt always reflects the remaining receivable amount.
- The training domain is separated into `PtProfile`, `PtAssignment`, `PtSchedule`, `PtSessionPackage`, `PtSessionLog`, body measurements, and training goals.

## Slide 08 — `@Transactional`, ACID, `BigDecimal`, `@Version`, and Flyway

- `@Transactional` ensures related changes commit together or roll back together. Plan registration can create a membership purchase, debt record, initial payment, and PT session package in one operation.
- ACID is applied at the application level: atomic transactions, validation and constraints preserve consistency, and PostgreSQL keeps committed data durable.
- `BigDecimal` is used for monetary values to avoid binary precision errors caused by `float` or `double`.
- `@Version` provides optimistic locking on `DebtRecord` and `PtSessionPackage`. Hibernate detects conflicting updates instead of silently overwriting debt balances or remaining sessions. `GlobalExceptionHandler` returns `409 CONCURRENT_UPDATE` so the UI can reload current data.
- Local development uses Hibernate `ddl-auto=update`. Flyway dependencies and migration folders are prepared, but `spring.flyway.enabled=false`. Versioned migrations, backups, and data testing are planned for future expansion.

## Slide 09 — Spring Boot Architecture and Dependency Injection

- The application runs as one Spring Boot backend, which fits a small gym and reduces operational overhead.
- Each module contains suitable controller/DTO, service, repository, entity, and policy layers. Changes in finance or PT logic do not require touching the whole project.
- Spring Dependency Injection manages beans through constructors, avoiding manual dependency creation and improving testability and maintainability.
- Controllers receive requests and return DTOs; services coordinate rules and transactions; repositories access data; entities describe database mapping.
- Shared concerns such as security, standard responses, exceptions, validation, and phone normalization are located in the `common` module.

## Slide 10 — HTTP Request Lifecycle, DTOs, Validation, and Pagination

1. The frontend sends JSON to `/api/v1/...`, with a Bearer JWT for endpoints that require authentication.
2. The security filter chain processes security headers, JWT validation, and route-specific rate limiting before a request reaches the business layer.
3. The controller binds request data to a DTO and uses `@Valid` and constraints to reject malformed data early.
4. The service checks business rules, roles, and data scope, and opens a transaction when one request changes multiple records.
5. Repository/JPA/Hibernate reads or writes PostgreSQL; the service maps the result to a DTO inside `ApiResponse`.
6. Validation, not-found, and business-conflict errors generally pass through `GlobalExceptionHandler`; JWT/token errors are handled in the filter path before the controller.
7. Member, payment, and debt lists use `PageResponse`; `page` is zero-based, the default `size` is 10, and filters are passed through query parameters.

## Slide 11 — Layered Security: JWT, Authorization, Rate Limit, and API Protection

- Spring Security uses `STATELESS` sessions. HMAC-SHA256 JWTs contain `sub`, `uid`, `name`, `roles`, `ver`, `iat`, and `exp`. Base64URL is not encryption, so tokens never include passwords or secrets.
- `JwtAuthenticationFilter` checks signature, expiration, current user existence, account status, roles, and compares the `ver` claim against `authVersion` in the database.
- `@PreAuthorize` checks OWNER/PT/MEMBER roles; services then enforce record-level access, especially for PT access to assigned members.
- Password changes or resets use `PasswordEncoder` and increment `authVersion`; old JWTs are rejected on their next request. `lastLoginAt` is updated after successful login but is not a complete audit log.
- Passwords must contain at least 8 characters, include letters and numbers, and must not equal the user email or phone number. The rule applies to password changes/resets, PT accounts, and portal accounts.
- `InMemoryRateLimiter` tracks login identity and IP: five failures in 15 minutes; the fifth failure creates a fresh 15-minute lock and returns `429` with `Retry-After`.
- `SensitiveEndpointRateLimitFilter` limits password changes, team-account creation/reset, portal operations, and AI operations to at most 10 requests per 15 minutes per operation and actor/IP.
- API headers include `nosniff`, `X-Frame-Options: DENY`, CSP, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control: no-store`. CORS limits development origins and exposes `Retry-After`.
- The rate limiter is in-memory and single-instance: a restart clears its state, and it is not a distributed Redis solution. Headers do not replace HTTPS, secret management, or production security testing.

## Slide 12 — Members, Phone Normalization, and Plan Validity

- Creating a member creates only a profile. It does not automatically create a plan, debt, portal account, PT assignment, or schedule.
- Vietnamese phone numbers are normalized before duplicate checks; `members.phone` has a unique constraint to reduce duplicate profiles created with different formatting.
- OWNER manages all members. PT can update or act only within the member scope that backend authorization allows. OWNER can also be a PT when the user has the required roles and a PT profile.
- `MembershipLifecyclePolicy` calculates validity from `startDate` and `endDate`: an `ACTIVE` plan that starts in the future is not effective today, and a past plan is interpreted as `EXPIRED` when read.
- No bulk scheduler changes expiration enums daily; displayed status is calculated from the date at query time.

## Slide 13 — Plan Registration/Renewal and Initial Collection

1. OWNER or permitted PT enters a plan, start date, selling price, discount, initial amount collected, and note.
2. `MemberMembershipService` validates authorization, plan, dates, monetary values, and prevents invalid overlapping periods.
3. The system creates `MemberMembership`, creates `DebtRecord` from the discounted receivable amount, and creates `PtSessionPackage` for a PT plan.
4. If `initialPaidAmount > 0`, the system creates the first `Payment` and synchronizes debt in the same transaction.
5. If the initial amount is zero, the system creates no payment and records no payment date or method. The UI disables those fields so it does not imply money has been received.
6. When the member pays later, the debt-collection flow creates a new payment using the actual payment date and method.

## Slide 14 — Installment Collection, Debt, and Revenue by Payment Date

- OWNER or an authorized PT selects a debt, enters the amount, payment date, payment method, and note.
- `PaymentService` validates that the member, membership, and debt are correctly linked; the amount must be positive, cannot exceed the remaining balance, and `paymentDate` cannot be in the future.
- Every collection creates an independent `Payment` for history. For example, a 11.2 million VND plan paid as 5 million by transfer and 6.2 million in cash creates two separate receipts.
- The transaction synchronizes `paidAmount`, `remainingAmount`, debt status, and the membership’s total paid and remaining debt.
- Revenue reports read each `paymentDate`, so money received in different months is attributed to the correct reporting period.
- `@Version` on debt detects concurrent updates rather than silently overwriting a balance.

## Slide 15 — PT Assignment and Appointment Coordination

- An assignment is valid when the PT is active, the member is active, the member has an appropriate PT plan on the start date, and the assignment duration does not exceed plan boundaries.
- An owner can also be a PT because `User` has a set of roles and may have a PT profile.
- Schedule creation validates authorization, date/time, and `SCHEDULED` conflicts for both PT and member. Two time ranges that only touch at an endpoint are not considered overlapping.
- An appointment is a time plan, not evidence that a session occurred, so creating a schedule does not consume a session allowance.
- Schedules that already have a session log or are no longer in a suitable state cannot be arbitrarily deleted, preserving operational history.

## Slide 16 — PT Session Recording, Practice Check-ins, Measurements, and Goals

- A PT session log can be independent or linked to a `scheduleId` that is `SCHEDULED` for the correct PT and member. The backend verifies an effective package with remaining sessions.
- `COMPLETED` and `MISSED` consume one session under the policy; `CANCELLED` and `RESCHEDULED` do not consume a session and synchronize the linked schedule when applicable.
- Duplicate logging is blocked: schedule ID is the business key when a schedule exists; independent logs check session number or date plus a consuming status.
- Practice check-ins use `MemberActivityLog` and a separate allowance, so they are never confused with one-to-one PT sessions.
- `BodyMeasurement` requires at least one actual measurement. `PtGoal` represents a target and training pathway; it is not automatically marked `COMPLETED` merely because one measurement reaches a threshold.

## Slide 17 — Member Portal

- OWNER can create a portal account for an `ACTIVE` member with a phone number and at least one effective membership. A PT plan is not mandatory; a member with an effective self-training plan may also receive portal access.
- The portal identifies the member from the user ID in `SecurityContext`. A MEMBER cannot supply an arbitrary member ID to read someone else’s information.
- MEMBER can view personal plans, session allowances, PT schedules, measurements, goals, payments, and debt.
- MEMBER primarily tracks progress and changes password. Plan activation, payment confirmation, and business updates remain OWNER/PT operations.
- A linked portal account is not automatically deleted solely because a plan expires. OWNER manages account status, reset, or removal when needed.

## Slide 18 — Dashboard, Reports, and Operational Integrations

- Dashboard and reports aggregate members, plan status, collected revenue, debt, and priority groups. Reminder pages do not automatically send Zalo or SMS messages.
- The system does not calculate real profit because it has no expense module. Financial data represents system revenue/payments and receivable debt only.
- VietQR generates a QR image from receiving-account configuration and an amount. There is no bank webhook, so scanning or displaying a QR never automatically creates a payment or reduces debt.
- TikTok Player v1 embeds an iframe using `tiktokVideoId`. The backend stores only metadata/link/video ID; it does not download video or manage view counts.
- XLSX is generated by the frontend from loaded data. Google Apps Script receives a data snapshot actively sent by OWNER. Neither feature replaces PostgreSQL or restores the database.

## Slide 19 — AI Advisor and Scenario Simulation

- `RetentionRevenueAdvisorService` reads business data, applies rules, and builds risk/opportunity segments before calling Groq.
- `AdvisorPayload` is aggregated and anonymized: it excludes names, phone numbers, Zalo IDs, emails, addresses, and individual transaction details.
- Groq receives a system prompt and JSON payload, then returns a JSON contract containing overview, risks, opportunities, a 7-day plan, and metrics. AI has no permission to write gym data.
- `GroqAiClient` uses `temperature = 0.2` to reduce randomness and requests `response_format.type = json_object`; the backend validates and parses the result before returning it to the UI.
- OWNER enters three percentages from 0 to 100. `RetentionRevenueScenarioCalculator` calculates monetary values, rounding, and total impact deterministically in the backend. Groq only interprets the priorities.
- The renewal base excludes members already included in PT-risk groups to avoid double counting. Simulation never creates a payment, debt, membership, or schedule.
- Missing keys, provider errors, or invalid JSON return rule-based fallback with `aiGenerated=false`. Keys that fail with 401/403/429 can fail over sequentially to the next configured key, not round-robin.

## Slide 20 — Testing and Current Evaluation

- Manual functional testing was performed locally with React, Spring Boot, PostgreSQL, and demonstration data.
- Reviewed flows include login/rate limit, member management, plans, payments/debt, PT operations, portal, reporting, AI, and export.
- Key edge cases include PT access scope, future payment dates, overpayment, plan validity, schedule conflicts, and session-consuming states.
- The backend includes automated tests for key policies; the frontend was checked by linting and a production build.
- The project does not claim full coverage, load testing, penetration testing, deep security testing, or complete production-grade concurrency testing.

## Slide 21 — Conclusion, Limitations, and Future Work

### Achieved results

- A gym operations system was completed with explicit data and rule separation: a plan differs from a real purchase; a purchase differs from debt; debt differs from a payment; a planned schedule differs from a completed session.
- The backend applies transactions, `@Version`, JWT/`authVersion`, RBAC and record-level access, rate limiting, and security headers.
- AI interprets aggregated data with fallback behavior and does not replace OWNER decision-making authority.

### Limitations and future direction

- This is a local MVP: Flyway is not yet active; there is no database backup/restore workflow, audit log, distributed rate limiting, or production deployment.
- Soft delete is only a prepared direction. Future adoption requires filtering, restoration, and policy rules specific to each data type.
- Future work includes versioned migrations; integration, concurrency, and performance tests; and PT payroll/commission only after the gym owner confirms a real calculation formula.
