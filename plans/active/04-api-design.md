# 04 - THIáº¾T Káº¾ API

## 1. Quy Æ°á»›c chung

Base path:

```text
/api/v1
```

Chuáº©n:

- REST API.
- JSON.
- Auth báº±ng JWT.
- API list cÃ³ pagination.
- Backend luÃ´n kiá»ƒm tra quyá»n.

Pagination response gá»£i Ã½:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```

Error response gá»£i Ã½:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dá»¯ liá»‡u khÃ´ng há»£p lá»‡",
  "details": []
}
```

## 2. Auth API

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
POST /auth/change-password
```

`POST /auth/login`

Request:

```json
{
  "email": "0900000000",
  "password": "secret"
}
```

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "fullName": "Owner",
    "roles": ["OWNER"]
  }
}
```

## 3. Member API

```text
GET    /members
POST   /members
GET    /members/{id}
PUT    /members/{id}
GET    /members/{id}/notes
POST   /members/{id}/notes
GET    /members/{id}/memberships
GET    /members/{id}/payments
GET    /members/{id}/body-measurements
```

Filter `GET /members`:

```text
?keyword=
&membershipStatus=ACTIVE|EXPIRING_SOON|EXPIRED|NO_MEMBERSHIP
&birthdayMonth=
&page=0
&size=20
```

Create member request:

```json
{
  "fullName": "Nguyá»…n VÄƒn A",
  "phone": "0900000000",
  "dateOfBirth": "1998-09-10",
  "gender": "MALE",
  "zaloPhone": "0900000000",
  "source": "WALK_IN",
  "note": "KhÃ¡ch má»›i"
}
```

## 4. Membership API

```text
GET    /membership-plans
POST   /membership-plans
PUT    /membership-plans/{id}
PATCH  /membership-plans/{id}/deactivate

POST   /members/{id}/memberships
POST   /members/{id}/memberships/{membershipId}/renew
GET    /memberships/expiring
GET    /memberships/expired
```

Create membership plan request:

```json
{
  "name": "PT má»›i 20 + 20",
  "planType": "PT",
  "ptLevel": "NEW",
  "durationDays": 90,
  "defaultPrice": 3900000,
  "ptSessionCount": 20,
  "practiceSessionCount": 20,
  "guidanceSessionCount": 0,
  "priceRatio": 0.65
}
```

Enum cáº§n thá»‘ng nháº¥t:

- `planType`: SELF_TRAINING, PT, GUIDANCE, OTHER.
- `ptLevel`: MAIN, NEW. Chá»‰ dÃ¹ng cho gÃ³i PT.
- GÃ³i GiÃ¡o Ã¡n/HÆ°á»›ng Dáº«n dÃ¹ng `planType = GUIDANCE` vÃ  `guidanceSessionCount` lÃ  30, 60 hoáº·c 90.
- KhÃ´ng dÃ¹ng `STUDENT`; cá»™t `Sinh viÃªn` trong Excel cÅ© Ä‘Æ°á»£c hiá»ƒu lÃ  doanh thu/gÃ³i `PT má»›i`.
- KhÃ´ng cÃ²n `contentAccessLevel` trong request/response vÃ¬ thÆ° viá»‡n TikTok public khÃ´ng phÃ¢n táº§ng premium.

Create membership request:

```json
{
  "planId": 1,
  "soldByUserId": 2,
  "ptUserId": null,
  "startDate": "2026-09-01",
  "actualPrice": 900000,
  "discountAmount": 0,
  "initialPaidAmount": 500000,
  "initialPaymentMethod": "BANK_TRANSFER",
  "initialPaymentDate": "2026-09-01",
  "initialPaymentNote": "Thanh toÃ¡n má»™t pháº§n",
  "note": "Thanh toÃ¡n má»™t pháº§n"
}
```

Ghi chÃº:

- `soldByUserId` nullable. Náº¿u PT/chá»§ phÃ²ng trá»±c tiáº¿p sale gÃ³i, lÆ°u user Ä‘Ã³ Ä‘á»ƒ phase sau tÃ­nh hoa há»“ng sale.
- `initialPaidAmount` lÃ  sá»‘ tiá»n tráº£ trÆ°á»›c khi táº¡o/gia háº¡n gÃ³i. Backend táº¡o payment, debt vÃ  income transaction trong cÃ¹ng transaction.
- `initialPaymentMethod` báº¯t buá»™c khi `initialPaidAmount > 0`.
- Hoa há»“ng sale phase sau tÃ­nh theo sá»‘ tiá»n khÃ¡ch thá»±c thanh toÃ¡n, nhÆ°ng ngÆ°á»i sale nÃªn Ä‘Æ°á»£c lÆ°u ngay tá»« lÃºc bÃ¡n/gia háº¡n gÃ³i.

Response nÃªn cÃ³:

```json
{
  "id": 10,
  "memberId": 5,
  "planName": "Tá»± táº­p 3 thÃ¡ng",
  "startDate": "2026-09-01",
  "endDate": "2026-12-01",
  "actualPrice": 900000,
  "paidAmount": 500000,
  "debtAmount": 400000,
  "sessionPackageId": null,
  "status": "ACTIVE"
}
```

Quy táº¯c sau khi táº¡o membership:

- Náº¿u plan lÃ  `PT`, backend táº¡o `pt_session_packages` vÃ  response tráº£ vá» `sessionPackageId`.
- Náº¿u plan lÃ  `GUIDANCE`, khÃ´ng táº¡o `pt_session_packages`; check-in GiÃ¡o Ã¡n dÃ¹ng `POST /pt/members/{id}/activity-logs` vá»›i `activityType = GUIDANCE_CHECKIN`.

## 5. Finance API

```text
GET    /payments
POST   /payments
GET    /financial-categories
POST   /financial-categories
GET    /financial-transactions
POST   /financial-transactions
GET    /debts
POST   /debts/{id}/payments
```

Create payment:

```json
{
  "memberId": 5,
  "membershipId": 10,
  "paymentDate": "2026-09-11",
  "amount": 500000,
  "paymentMethod": "BANK_TRANSFER",
  "revenueCategory": "SELF_TRAINING",
  "description": "Thanh toÃ¡n gÃ³i 3 thÃ¡ng"
}
```

`revenueCategory` há»— trá»£:

- SELF_TRAINING.
- GUIDANCE.
- PT_MAIN.
- PT_NEW.
- OTHER_INCOME.

Quy táº¯c Ä‘á»“ng bá»™ finance:

- `POST /payments` táº¡o payment nghiá»‡p vá»¥ vÃ  backend tá»± sinh `financial_transactions` loáº¡i INCOME tÆ°Æ¡ng á»©ng.
- UI khÃ´ng cho nháº­p láº¡i khoáº£n thu khÃ¡ch hÃ ng Ä‘Ã³ báº±ng `POST /financial-transactions` Ä‘á»ƒ trÃ¡nh double-count.
- `POST /financial-transactions` dÃ¹ng chá»§ yáº¿u cho expense vÃ  cÃ¡c khoáº£n thu khÃ¡c khÃ´ng gáº¯n vá»›i membership/payment.

Create expense:

```json
{
  "type": "EXPENSE",
  "categoryId": 3,
  "amount": 1200000,
  "transactionDate": "2026-09-11",
  "description": "Tiá»n Ä‘iá»‡n"
}
```

Reports:

```text
GET /finance/summary?from=2026-09-01&to=2026-09-30
GET /finance/monthly?year=2026
GET /finance/daily-income?date=2026-09-11
GET /finance/expenses?from=2026-09-01&to=2026-09-30
```

Finance summary response:

```json
{
  "totalIncome": 50000000,
  "totalExpense": 20000000,
  "profit": 30000000,
  "debt": 5000000
}
```

## 6. PT API

```text
GET    /pt/my-members
GET    /pt/members/{id}
GET    /pt/schedules
POST   /pt/schedules
PUT    /pt/schedules/{id}
GET    /pt/session-packages
POST   /pt/session-packages
GET    /pt/members/{id}/session-logs
POST   /pt/members/{id}/session-logs
PUT    /pt/session-logs/{id}
POST   /pt/members/{id}/activity-logs
POST   /pt/members/{id}/body-measurements
POST   /pt/members/{id}/goals
```

Create PT session:

```json
{
  "sessionPackageId": 1,
  "sessionDate": "2026-09-11",
  "sessionNumber": 5,
  "weight": 70.5,
  "status": "COMPLETED",
  "content": "Ngá»±c, vai, tay sau",
  "note": "Táº­p tá»‘t"
}
```

Create activity log cho Ã”n táº­p/GiÃ¡o Ã¡n:

```json
{
  "membershipId": 10,
  "sessionPackageId": 1,
  "activityType": "PRACTICE",
  "activityDate": "2026-09-12",
  "sessionNumber": 5,
  "weight": 70.2,
  "note": "Ã”n láº¡i bÃ i ngá»±c vai"
}
```

Quy táº¯c:

- `activityType = PRACTICE` dÃ¹ng cho buá»•i Ã”n táº­p Ä‘i kÃ¨m gÃ³i PT, nÃªn truyá»n `sessionPackageId`.
- `activityType = GUIDANCE_CHECKIN` dÃ¹ng cho khÃ¡ch GiÃ¡o Ã¡n/HÆ°á»›ng Dáº«n, báº¯t buá»™c truyá»n `membershipId`, `sessionPackageId` cÃ³ thá»ƒ null.
- KhÃ¡ch tá»± táº­p khÃ´ng dÃ¹ng activity log.

Create body measurement:

```json
{
  "recordedAt": "2026-09-11",
  "height": 170,
  "weight": 70.5,
  "chest": 95,
  "waist": 78,
  "abdomen": 82,
  "hip": 96,
  "thigh": 55,
  "arm": 32,
  "note": "Tuáº§n 2"
}
```

## 7. Training Program API

KhÃ´ng triá»ƒn khai trong Sprint 5.

Sprint 5 chá»‰ lÃ m thÆ° viá»‡n video TikTok public. Náº¿u phase sau cáº§n giÃ¡o Ã¡n cÃ¡ nhÃ¢n hÃ³a theo tuáº§n, API Training Program sáº½ Ä‘Æ°á»£c thiáº¿t káº¿ riÃªng dá»±a trÃªn nhu cáº§u tháº­t.

## 8. Public TikTok Exercise Library API

```text
GET    /public/exercise-categories
GET    /public/exercises
GET    /public/exercises/{slugOrId}
POST   /public/exercises/{id}/view

GET    /owner/exercise-categories
POST   /owner/exercise-categories
PUT    /owner/exercise-categories/{id}

GET    /owner/exercises
POST   /owner/exercises
PUT    /owner/exercises/{id}
PATCH  /owner/exercises/{id}/publish
```

Create exercise:

```json
{
  "categoryId": 1,
  "title": "Bench Press cÆ¡ báº£n",
  "description": "Video ngáº¯n hÆ°á»›ng dáº«n form Ä‘áº©y ngá»±c cho ngÆ°á»i má»›i",
  "instruction": "Giá»¯ vai á»•n Ä‘á»‹nh, háº¡ táº¡ kiá»ƒm soÃ¡t.",
  "commonMistakes": "Cong lÆ°ng quÃ¡ má»©c, khÃ³a khuá»·u tay.",
  "level": "BEGINNER",
  "muscleGroup": "CHEST",
  "equipment": "BARBELL",
  "tiktokUrl": "https://www.tiktok.com/@duong.double/video/...",
  "featured": true,
  "published": true
}
```

Public list filter:

```json
{
  "categorySlug": "nguc",
  "level": "BEGINNER",
  "keyword": "bench",
  "featured": true
}
```

NguyÃªn táº¯c:

- Public API khÃ´ng yÃªu cáº§u Ä‘Äƒng nháº­p.
- Owner/admin API yÃªu cáº§u role OWNER.
- KhÃ´ng há»— trá»£ provider video khÃ¡c trong Sprint 5.
- Backend chá»‰ lÆ°u link TikTok/video id/thumbnail náº¿u láº¥y Ä‘Æ°á»£c, khÃ´ng upload video lÃªn VPS.
- Náº¿u TikTok embed khÃ´ng hoáº¡t Ä‘á»™ng á»Ÿ frontend, ngÆ°á»i dÃ¹ng váº«n cÃ³ nÃºt má»Ÿ video trÃªn TikTok.

## 9. Dashboard API

OWNER:

```text
GET /dashboard/owner
GET /dashboard/owner/expiring-members
GET /dashboard/owner/birthdays
GET /dashboard/owner/revenue
GET /dashboard/owner/debts
```

OWNER dashboard response:

```json
{
  "totalMembers": 350,
  "activeMembers": 260,
  "expiringSoon": 18,
  "expired": 42,
  "newMembersThisMonth": 35,
  "renewedMembersThisMonth": 22,
  "monthlyIncome": 50000000,
  "monthlyExpense": 20000000,
  "monthlyProfit": 30000000,
  "totalDebt": 5000000
}
```

PT:

```text
GET /dashboard/pt
GET /dashboard/pt/today-schedule
GET /dashboard/pt/low-session-members
GET /dashboard/pt/progress-alerts
```

MEMBER:

```text
GET /dashboard/member
GET /member/me/membership
GET /member/me/training-content
```

## 10. Business Goals API

```text
GET    /business-goals
POST   /business-goals
PUT    /business-goals/{id}
GET    /business-goals/progress?month=9&year=2026
```

Create goal:

```json
{
  "year": 2026,
  "month": 9,
  "category": "FINANCE",
  "metricName": "REVENUE",
  "targetValue": 100000000,
  "unit": "VND",
  "note": "Má»¥c tiÃªu doanh thu thÃ¡ng 9"
}
```

Progress response cáº§n thá»ƒ hiá»‡n Ä‘Æ°á»£c cÃ¡c nhÃ³m tá»« Excel:

```json
{
  "month": 9,
  "year": 2026,
  "items": [
    {
      "category": "FINANCE",
      "metricName": "REVENUE",
      "targetValue": 100000000,
      "actualValue": 45000000,
      "progressPercent": 45
    },
    {
      "category": "NEW_PT_CUSTOMER",
      "metricName": "PT_CUSTOMER_COUNT",
      "targetValue": 4,
      "actualValue": 2,
      "progressPercent": 50
    }
  ]
}
```

## 11. Notification API

```text
GET   /notifications
PATCH /notifications/{id}/read
GET   /notifications/unread-count
```

## 12. Import API

Import dá»¯ liá»‡u cÅ© khÃ´ng náº±m trong MVP vÃ¬ chá»§ phÃ²ng Ä‘Ã£ chá»‘t báº¯t Ä‘áº§u vá»›i dá»¯ liá»‡u má»›i. Pháº§n nÃ y chá»‰ má»Ÿ láº¡i á»Ÿ phase sau náº¿u cÃ³ nhu cáº§u nháº­p lá»‹ch sá»­ Excel.

```text
POST /imports/members
POST /imports/memberships
POST /imports/payments
GET  /imports/{batchId}
```

YÃªu cáº§u:

- CÃ³ preview/validate trÆ°á»›c khi import tháº­t náº¿u dá»¯ liá»‡u phá»©c táº¡p.
- Tráº£ vá» sá»‘ dÃ²ng thÃ nh cÃ´ng/tháº¥t báº¡i.
- KhÃ´ng import mÃ¹ dá»¯ liá»‡u tÃ i chÃ­nh náº¿u chÆ°a kiá»ƒm tra.

## 13. API chÆ°a lÃ m trong MVP

- Payroll API.
- AI score API.
- Payment online API.
- Auto Zalo API.
- Export PDF API server-side. Xuáº¥t `.xlsx` hiá»‡n Ä‘Ã£ xá»­ lÃ½ á»Ÿ frontend/report flow, khÃ´ng cÃ²n xáº¿p lÃ  API cháº·n MVP.
- Import API.

## 14. Quyá»n truy cáº­p API

OWNER:

- ÄÆ°á»£c gá»i táº¥t cáº£ API quáº£n trá»‹.

PT:

- Chá»‰ gá»i API liÃªn quan khÃ¡ch Ä‘Æ°á»£c phÃ¢n cÃ´ng.
- KhÃ´ng gá»i API finance tá»•ng.

MEMBER:

- Chá»‰ gá»i API `/member/me/*`.

## 15. Ghi chÃº triá»ƒn khai

- CÃ¡c API táº¡o/sá»­a dá»¯ liá»‡u tÃ i chÃ­nh pháº£i ghi audit log.
- CÃ¡c API list pháº£i pagination.
- CÃ¡c API dashboard khÃ´ng nÃªn query quÃ¡ náº·ng; cÃ³ thá»ƒ tá»‘i Æ°u sau báº±ng cache.

## 16. Cập nhật theo implementation hiện tại

Tài liệu chốt hiện trạng sau nâng cấp UI nằm tại `plans/active/10-current-implementation-alignment.md`.

Các nhóm API đã được bổ sung/chốt theo code hiện tại:

### Auth và tài khoản

```text
POST /v1/auth/login
GET  /v1/auth/me
POST /v1/auth/change-password

GET    /v1/settings/team-users
POST   /v1/settings/team-users
PUT    /v1/settings/team-users/{id}/role
PUT    /v1/settings/team-users/{id}/status
POST   /v1/settings/team-users/{id}/reset-password
DELETE /v1/settings/team-users/{id}
```

Không còn endpoint `staff-users`; tên hiện tại là `team-users`, nhưng role vận hành chỉ dùng `PT`.

### Portal hội viên

```text
GET    /v1/member-portal/me

POST   /v1/members/{id}/portal-account
PUT    /v1/members/{id}/portal-account/status
POST   /v1/members/{id}/portal-account/reset-password
DELETE /v1/members/{id}/portal-account
```

MEMBER chỉ đọc dữ liệu liên kết với tài khoản của mình, không tự thao tác gói/thanh toán.

### VietQR

```text
GET /v1/settings/vietqr
PUT /v1/settings/vietqr
GET /v1/public/vietqr-setting
```

`/v1/settings/vietqr` chỉ dành cho OWNER. Public endpoint chỉ dùng để hiển thị QR, không sửa cấu hình.

### PT và phân quyền dữ liệu

```text
GET    /v1/pt/profiles
POST   /v1/pt/profiles
GET    /v1/pt/my-members
POST   /v1/pt/assignments
GET    /v1/pt/schedules
POST   /v1/pt/schedules
DELETE /v1/pt/schedules/{scheduleId}
GET    /v1/pt/session-packages
GET    /v1/pt/members/{memberId}
POST   /v1/pt/members/{memberId}/session-logs
POST   /v1/pt/members/{memberId}/activity-logs
POST   /v1/pt/members/{memberId}/body-measurements
POST   /v1/pt/members/{memberId}/goals
```

PT chỉ được truy cập member được phân công hoặc member gói PT chưa có assignment để xử lý đăng ký mới.

### Gói tập active/inactive

```text
GET /v1/membership-plans
GET /v1/membership-plans/all
PUT /v1/membership-plans/{id}/active
```

Dropdown bán/gia hạn chỉ dùng danh sách gói active.

### Báo cáo và mục tiêu

```text
GET /v1/dashboard/owner
GET /v1/business-goals
POST /v1/business-goals
PUT /v1/business-goals/{id}
GET /v1/business-goals/progress
GET /v1/reports/finance
GET /v1/reports/members
GET /v1/notifications
PATCH /v1/notifications/{id}/read
```

Xuất `.xlsx`, full backup và Google Sheet sync hiện được xử lý phía frontend bằng dữ liệu report API; chưa có export API riêng ở backend.

### Thư viện TikTok public

```text
GET  /v1/public/exercise-categories
GET  /v1/public/exercises
GET  /v1/public/exercises/{slugOrId}
POST /v1/public/exercises/{id}/view

GET    /v1/owner/exercise-categories
POST   /v1/owner/exercise-categories
PUT    /v1/owner/exercise-categories/{id}
GET    /v1/owner/exercises
POST   /v1/owner/exercises
PUT    /v1/owner/exercises/{id}
PATCH  /v1/owner/exercises/{id}/published
DELETE /v1/owner/exercises/{id}
```

