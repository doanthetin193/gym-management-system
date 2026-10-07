# 08 - Review Sprint 1 Backend

NgÃ y chá»‘t: 22/09/2026

## 1. Pháº¡m vi Ä‘Ã£ hoÃ n thÃ nh

Sprint 1 backend Ä‘Ã£ hoÃ n thÃ nh pháº§n ná»n táº£ng Ä‘á»ƒ há»‡ thá»‘ng cÃ³ thá»ƒ cháº¡y API end-to-end vá»›i PostgreSQL local.

CÃ¡c pháº§n chÃ­nh Ä‘Ã£ cÃ³:

- Chuáº©n hÃ³a response API báº±ng `ApiResponse` vÃ  `ApiError`.
- Xá»­ lÃ½ lá»—i táº­p trung báº±ng `GlobalExceptionHandler`.
- Authentication báº±ng email/password.
- JWT access token.
- Spring Security stateless.
- RBAC cÆ¡ báº£n vá»›i role `OWNER`, `PT`, `MEMBER`.
- Seed dá»¯ liá»‡u ná»n táº£ng: roles, tÃ i khoáº£n OWNER, danh má»¥c tÃ i chÃ­nh, system settings.
- API quáº£n lÃ½ gÃ³i táº­p.
- API quáº£n lÃ½ há»™i viÃªn.
- API Ä‘Äƒng kÃ½ gÃ³i cho há»™i viÃªn.
- Tá»± sinh cÃ´ng ná»£ khi há»™i viÃªn Ä‘Äƒng kÃ½ gÃ³i.
- API ghi nháº­n thanh toÃ¡n.
- Äá»“ng bá»™ `paidAmount` vÃ  `debtAmount` sau thanh toÃ¡n.
- Tá»± táº¡o financial transaction khi ghi nháº­n payment.
- Ká»‹ch báº£n kiá»ƒm thá»­ thá»§ cÃ´ng báº±ng `backend/http/sprint1.http`.

## 2. API hiá»‡n cÃ³

Base URL local:

```text
http://localhost:8080/api
```

Auth:

- `POST /v1/auth/login`
- `GET /v1/auth/me`

Health:

- `GET /v1/health`

Membership plan:

- `POST /v1/membership-plans`
- `GET /v1/membership-plans`

Member:

- `POST /v1/members`
- `GET /v1/members`
- `GET /v1/members/{id}`

Member membership:

- `POST /v1/members/{memberId}/memberships`
- `GET /v1/members/{memberId}/memberships`

Payment:

- `POST /v1/payments`

## 3. TÃ i khoáº£n test local

TÃ i khoáº£n OWNER Ä‘Æ°á»£c seed khi cháº¡y backend:

```text
email: owner@gymduongdouble.local
password: change_me
```

Ghi chÃº báº£o máº­t:

- `change_me` chá»‰ lÃ  máº­t kháº©u seed cho mÃ´i trÆ°á»ng local/dev.
- Production báº¯t buá»™c override báº±ng biáº¿n mÃ´i trÆ°á»ng `OWNER_PASSWORD`.
- `JWT_SECRET` production pháº£i dÃ¹ng chuá»—i bÃ­ máº­t Ä‘á»§ máº¡nh, khÃ´ng dÃ¹ng giÃ¡ trá»‹ dev.

## 4. Káº¿t quáº£ kiá»ƒm thá»­

ÄÃ£ cháº¡y kiá»ƒm thá»­ API thá»±c táº¿ trÃªn server local:

```text
ALL SPRINT 1 API TESTS PASSED: 36 checks
```

CÃ¡c nhÃ³m Ä‘Ã£ test:

- Health check.
- Login Ä‘Ãºng.
- Login sai máº­t kháº©u.
- Login Sai email.
- Láº¥y thÃ´ng tin user hiá»‡n táº¡i.
- Thiáº¿u token.
- Token sai.
- Táº¡o gÃ³i self-training.
- Táº¡o gÃ³i giÃ¡o Ã¡n/hÆ°á»›ng dáº«n.
- Táº¡o gÃ³i PT chÃ­nh.
- GÃ³i inactive khÃ´ng xuáº¥t hiá»‡n trong danh sÃ¡ch active.
- Táº¡o gÃ³i PT thiáº¿u `ptLevel` bá»‹ cháº·n.
- Táº¡o há»™i viÃªn.
- Cháº·n trÃ¹ng sá»‘ Ä‘iá»‡n thoáº¡i.
- Xem chi tiáº¿t há»™i viÃªn.
- TÃ¬m há»™i viÃªn theo tÃªn.
- TÃ¬m há»™i viÃªn theo sá»‘ Ä‘iá»‡n thoáº¡i.
- Há»™i viÃªn khÃ´ng tá»“n táº¡i tráº£ 404.
- ÄÄƒng kÃ½ gÃ³i cho há»™i viÃªn.
- Cháº·n Ä‘Äƒng kÃ½ gÃ³i inactive.
- Cháº·n Ä‘Äƒng kÃ½ gÃ³i khÃ´ng tá»“n táº¡i.
- Xem lá»‹ch sá»­ gÃ³i cá»§a há»™i viÃªn.
- Thanh toÃ¡n Ä‘á»§ gÃ³i tá»± táº­p.
- Thanh toÃ¡n má»™t pháº§n gÃ³i giÃ¡o Ã¡n.
- Thanh toÃ¡n gÃ³i PT chÃ­nh.
- Cháº·n thanh toÃ¡n khi membership khÃ´ng thuá»™c member.
- Cháº·n payment amount báº±ng 0.

## 5. Nhá»¯ng Ä‘iá»ƒm Ä‘Ã£ Ä‘iá»u chá»‰nh trong quÃ¡ trÃ¬nh test

- Sá»­a seed OWNER Ä‘á»ƒ Hibernate khÃ´ng lá»—i khi merge quan há»‡ role.
- Chuáº©n hÃ³a lá»—i login Sai email thÃ nh `401 BAD_CREDENTIALS`.
- Cho phÃ©p tÃ¬m há»™i viÃªn theo cáº£ tÃªn vÃ  sá»‘ Ä‘iá»‡n thoáº¡i.
- Set UTF-8 cho cÃ¡c response lá»—i security Ä‘á»ƒ Postman/curl khÃ´ng lá»—i dáº¥u tiáº¿ng Viá»‡t.
- Bá»• sung `sprint1.http` thÃ nh ká»‹ch báº£n test Ä‘áº§y Ä‘á»§ hÆ¡n, khÃ´ng chá»‰ happy path.

## 6. Giá»›i háº¡n hiá»‡n táº¡i

- ChÆ°a cÃ³ frontend React.
- ChÆ°a cÃ³ API cáº­p nháº­t há»™i viÃªn.
- ChÆ°a cÃ³ API cáº­p nháº­t gÃ³i táº­p.
- ChÆ°a cÃ³ API lá»c khÃ¡ch sáº¯p háº¿t háº¡n/háº¿t háº¡n.
- ChÆ°a cÃ³ flow gia háº¡n riÃªng; hiá»‡n táº¡i Ä‘Äƒng kÃ½/gia háº¡n Ä‘Æ°á»£c biá»ƒu diá»…n báº±ng viá»‡c táº¡o thÃªm `member_memberships`.
- ChÆ°a cÃ³ dashboard.
- Flyway Ä‘Ã£ cÃ³ dependency nhÆ°ng dev profile Ä‘ang táº¯t Ä‘á»ƒ dÃ¹ng Hibernate `ddl-auto: update` trong giai Ä‘oáº¡n dá»±ng entity/API ban Ä‘áº§u.

## 7. HÆ°á»›ng tiáº¿p theo

Sau khi commit/push má»‘c nÃ y, bÆ°á»›c tiáº¿p theo nÃªn lÃ  Sprint 2 backend:

- HoÃ n thiá»‡n quáº£n lÃ½ há»™i viÃªn.
- Bá»• sung cáº­p nháº­t thÃ´ng tin há»™i viÃªn.
- Bá»• sung filter khÃ¡ch theo tráº¡ng thÃ¡i gÃ³i.
- Bá»• sung danh sÃ¡ch khÃ¡ch sáº¯p háº¿t háº¡n/háº¿t háº¡n.
- Chuáº©n hÃ³a flow gia háº¡n gÃ³i.
- LÃ m rÃµ API phá»¥c vá»¥ mÃ n hÃ¬nh member list/member detail cá»§a frontend.

