# 04 - THIẾT KẾ API

## 1. Quy ước chung

Base path:

```text
/api/v1
```

Chuẩn:

- REST API.
- JSON.
- Auth bằng JWT.
- API list có pagination.
- Backend luôn kiểm tra quyền.

Pagination response gợi ý:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```

Error response gợi ý:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
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
  "usernameOrPhone": "0900000000",
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
  "fullName": "Nguyễn Văn A",
  "phone": "0900000000",
  "dateOfBirth": "1998-09-10",
  "gender": "MALE",
  "zaloPhone": "0900000000",
  "source": "WALK_IN",
  "note": "Khách mới"
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
  "name": "PT mới 20 + 20",
  "planType": "PT",
  "ptLevel": "NEW",
  "durationDays": 90,
  "defaultPrice": 3900000,
  "ptSessionCount": 20,
  "practiceSessionCount": 20,
  "guidanceSessionCount": 0,
  "contentAccessLevel": "PREMIUM",
  "priceRatio": 0.65
}
```

Enum cần thống nhất:

- `planType`: SELF_TRAINING, PT, GUIDANCE, OTHER.
- `ptLevel`: MAIN, NEW. Chỉ dùng cho gói PT.
- `contentAccessLevel`: NONE, BASIC, PREMIUM.
- Gói Giáo án/Hướng Dẫn dùng `planType = GUIDANCE` và `guidanceSessionCount` là 30, 60 hoặc 90.
- Không dùng `STUDENT`; cột `Sinh viên` trong Excel cũ được hiểu là doanh thu/gói `PT mới`.

Create membership request:

```json
{
  "planId": 1,
  "soldByUserId": 2,
  "startDate": "2026-09-01",
  "actualPrice": 900000,
  "paidAmount": 500000,
  "discountAmount": 0,
  "note": "Thanh toán một phần"
}
```

Ghi chú:

- `soldByUserId` nullable. Nếu PT/chủ phòng trực tiếp sale gói, lưu user đó để phase sau tính hoa hồng sale.
- Hoa hồng sale phase sau tính theo số tiền khách thực thanh toán, nhưng người sale nên được lưu ngay từ lúc bán/gia hạn gói.

Response nên có:

```json
{
  "id": 10,
  "memberId": 5,
  "planName": "Tự tập 3 tháng",
  "startDate": "2026-09-01",
  "endDate": "2026-12-01",
  "actualPrice": 900000,
  "paidAmount": 500000,
  "debtAmount": 400000,
  "sessionPackageId": null,
  "status": "ACTIVE"
}
```

Quy tắc sau khi tạo membership:

- Nếu plan là `PT`, backend tạo `pt_session_packages` và response trả về `sessionPackageId`.
- Nếu plan là `GUIDANCE`, không tạo `pt_session_packages`; check-in Giáo án dùng `POST /pt/members/{id}/activity-logs` với `activityType = GUIDANCE_CHECKIN`.

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
  "description": "Thanh toán gói 3 tháng"
}
```

`revenueCategory` hỗ trợ:

- SELF_TRAINING.
- GUIDANCE.
- PT_MAIN.
- PT_NEW.
- OTHER_INCOME.

Quy tắc đồng bộ finance:

- `POST /payments` tạo payment nghiệp vụ và backend tự sinh `financial_transactions` loại INCOME tương ứng.
- UI không cho nhập lại khoản thu khách hàng đó bằng `POST /financial-transactions` để tránh double-count.
- `POST /financial-transactions` dùng chủ yếu cho expense và các khoản thu khác không gắn với membership/payment.

Create expense:

```json
{
  "type": "EXPENSE",
  "categoryId": 3,
  "amount": 1200000,
  "transactionDate": "2026-09-11",
  "description": "Tiền điện"
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
  "content": "Ngực, vai, tay sau",
  "note": "Tập tốt"
}
```

Create activity log cho Ôn tập/Giáo án:

```json
{
  "membershipId": 10,
  "sessionPackageId": 1,
  "activityType": "PRACTICE",
  "activityDate": "2026-09-12",
  "sessionNumber": 5,
  "weight": 70.2,
  "note": "Ôn lại bài ngực vai"
}
```

Quy tắc:

- `activityType = PRACTICE` dùng cho buổi Ôn tập đi kèm gói PT, nên truyền `sessionPackageId`.
- `activityType = GUIDANCE_CHECKIN` dùng cho khách Giáo án/Hướng Dẫn, bắt buộc truyền `membershipId`, `sessionPackageId` có thể null.
- Khách tự tập không dùng activity log.

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
  "note": "Tuần 2"
}
```

## 7. Training Program API

```text
GET    /training-programs
POST   /training-programs
GET    /training-programs/{id}
PUT    /training-programs/{id}
GET    /training-programs/{id}/weeks
POST   /training-programs/{id}/weeks
PUT    /training-program-weeks/{id}
```

Create weekly progress:

```json
{
  "weekNumber": 1,
  "targetSessions": 3,
  "targetDescription": "Làm quen kỹ thuật",
  "actualSessions": 2,
  "actualResult": "Hoàn thành 2/3 buổi",
  "note": "Cần bổ sung một buổi"
}
```

Khi kết thúc chương trình/gói PT, `PUT /training-programs/{id}` có thể cập nhật:

```json
{
  "status": "COMPLETED",
  "finalResult": "Giảm 3kg, vòng eo giảm 4cm, hoàn thành 18/20 buổi PT",
  "evaluationNote": "Đạt phần lớn mục tiêu ban đầu, cần duy trì lịch ôn tập",
  "completedAt": "2026-11-30"
}
```

## 8. Exercise API

```text
GET    /exercise-categories
POST   /exercise-categories
PUT    /exercise-categories/{id}

GET    /exercises
POST   /exercises
GET    /exercises/{id}
PUT    /exercises/{id}
POST   /exercises/{id}/media
```

Create exercise:

```json
{
  "categoryId": 1,
  "name": "Bench Press",
  "description": "Bài tập ngực cơ bản",
  "instruction": "Giữ vai ổn định, hạ tạ kiểm soát",
  "commonMistakes": "Cong lưng quá mức, khóa khuỷu tay",
  "difficulty": "BEGINNER",
  "primaryMuscle": "CHEST",
  "equipment": "BARBELL",
  "visibility": "MEMBER_ONLY"
}
```

Media:

```json
{
  "mediaType": "VIDEO",
  "provider": "YOUTUBE",
  "url": "https://youtube.com/watch?v=...",
  "thumbnailUrl": "https://...",
  "sortOrder": 1
}
```

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
  "note": "Mục tiêu doanh thu tháng 9"
}
```

Progress response cần thể hiện được các nhóm từ Excel:

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

Import dữ liệu cũ không nằm trong MVP vì chủ phòng đã chốt bắt đầu với dữ liệu mới. Phần này chỉ mở lại ở phase sau nếu có nhu cầu nhập lịch sử Excel.

```text
POST /imports/members
POST /imports/memberships
POST /imports/payments
GET  /imports/{batchId}
```

Yêu cầu:

- Có preview/validate trước khi import thật nếu dữ liệu phức tạp.
- Trả về số dòng thành công/thất bại.
- Không import mù dữ liệu tài chính nếu chưa kiểm tra.

## 13. API chưa làm trong MVP

- Payroll API.
- AI score API.
- Payment online API.
- Auto Zalo API.
- Export PDF/Excel API.
- Import API.

## 14. Quyền truy cập API

OWNER:

- Được gọi tất cả API quản trị.

PT:

- Chỉ gọi API liên quan khách được phân công.
- Không gọi API finance tổng.

MEMBER:

- Chỉ gọi API `/member/me/*`.

## 15. Ghi chú triển khai

- Các API tạo/sửa dữ liệu tài chính phải ghi audit log.
- Các API list phải pagination.
- Các API dashboard không nên query quá nặng; có thể tối ưu sau bằng cache.
