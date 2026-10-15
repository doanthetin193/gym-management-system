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
  "priceRatio": 0.65
}
```

Enum cần thống nhất:

- `planType`: SELF_TRAINING, PT, GUIDANCE, OTHER.
- `ptLevel`: MAIN, NEW. Chỉ dùng cho gói PT.
- Gói Giáo án/Hướng Dẫn dùng `planType = GUIDANCE` và `guidanceSessionCount` là 30, 60 hoặc 90.
- Không dùng `STUDENT`; cột `Sinh viên` trong Excel cũ được hiểu là doanh thu/gói `PT mới`.
- Không còn `contentAccessLevel` trong request/response vì thư viện TikTok public không phân tầng premium.

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
  "initialPaymentNote": "Thanh toán một phần",
  "note": "Thanh toán một phần"
}
```

Ghi chú:

- `soldByUserId` nullable. Nếu PT/chủ phòng trực tiếp sale gói, lưu user đó để phase sau tính hoa hồng sale.
- `initialPaidAmount` là số tiền trả trước khi tạo/gia hạn gói. Backend tạo payment, debt và income transaction trong cùng transaction.
- `initialPaymentMethod` bắt buộc khi `initialPaidAmount > 0`.
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
GET    /debts
```

Create payment:

```json
{
  "memberId": 5,
  "membershipId": 10,
  "paymentDate": "2026-09-11",
  "amount": 500000,
  "paymentMethod": "BANK_TRANSFER",
  "note": "Thanh toán gói 3 tháng"
}
```

Quy tắc:

- Payment phải gắn với `debtRecordId` hoặc `membershipId` có công nợ đang mở.
- Backend suy ra `revenueCategory` từ loại gói; client không được tự gán nhóm doanh thu.
- `paymentDate` là ngày ghi nhận doanh thu và không được ở tương lai.
- Không có API nhập chi phí hoặc khoản thu ngoài gói tập trong scope MVP.

Reports:

```text
GET /v1/reports/finance?year=2026
GET /v1/reports/finance?year=2026&month=9
```

Finance summary response:

```json
{
  "totalIncome": 50000000,
  "rows": [
    { "month": 9, "income": 50000000 }
  ]
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

Create PT schedule:

```json
{
  "ptUserId": 2,
  "memberId": 5,
  "scheduleDate": "2026-10-12",
  "startTime": "17:00",
  "endTime": "18:00",
  "note": "Buổi thân trên"
}
```

Quy tắc:

- Lịch mới luôn được tạo với trạng thái `SCHEDULED`.
- Client không gửi `status` khi tạo lịch mới.
- Backend chặn lịch trong quá khứ và chặn trùng khung giờ của cùng PT hoặc cùng học viên.

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
- `sessionNumber`, cân nặng, chỉ số cơ thể và mục tiêu cơ thể nếu nhập phải lớn hơn 0.
- Không ghi được buổi PT/ôn tập/hướng dẫn trước ngày bắt đầu gói hoặc sau ngày hết hạn gói.
- Ghi trùng cùng buổi/ngày bị chặn để tránh trừ buổi nhiều lần.

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

Không triển khai trong Sprint 5.

Sprint 5 chỉ làm thư viện video TikTok public. Nếu phase sau cần giáo án cá nhân hóa theo tuần, API Training Program sẽ được thiết kế riêng dựa trên nhu cầu thật.

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
  "title": "Bench Press cơ bản",
  "description": "Video ngắn hướng dẫn form đẩy ngực cho người mới",
  "instruction": "Giữ vai ổn định, hạ tạ kiểm soát.",
  "commonMistakes": "Cong lưng quá mức, khóa khuỷu tay.",
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

Nguyên tắc:

- Public API không yêu cầu đăng nhập.
- Owner/admin API yêu cầu role OWNER.
- Không hỗ trợ provider video khác trong Sprint 5.
- Backend chỉ lưu link TikTok/video id/thumbnail nếu lấy được, không upload video lên VPS.
- Nếu TikTok embed không hoạt động ở frontend, người dùng vẫn có nút mở video trên TikTok.

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

## 10. Notification API

```text
GET /v1/notifications
```

Notification hiện là dữ liệu tính động từ hạn gói, sinh nhật, công nợ và gói PT còn ít buổi. MVP hiện tại không dùng bảng `notifications`, không có trạng thái read/unread persistent.

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
- AI chatbot tự do hoặc AI score cá nhân theo từng hội viên.
- Payment online API.
- Auto Zalo API.
- Export PDF API server-side. Xuất `.xlsx` hiện đã xử lý ở frontend/report flow, không còn xếp là API chặn MVP.
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

### Báo cáo

```text
GET /v1/dashboard/owner
GET /v1/reports/finance
GET /v1/reports/members
GET /v1/notifications
```

Xuất `.xlsx`, full backup và Google Sheet sync hiện được xử lý phía frontend bằng dữ liệu report API; chưa có export API riêng ở backend.

### AI cố vấn giữ chân và doanh thu

```text
POST /v1/ai/retention-revenue-advisor
```

- Chỉ role `OWNER` được gọi.
- Request body có thể truyền `year` và `month`; nếu bỏ trống backend dùng tháng hiện tại theo local business date.
- Backend gom dữ liệu tổng hợp đã ẩn danh rồi mới gọi Groq: tổng hội viên, active/expired/near-expiry, doanh thu tháng này/tháng trước, công nợ mở, khách mới/gia hạn, phân nhóm rủi ro và cơ hội.
- Không gửi tên, SĐT, Zalo, email, địa chỉ hoặc từng giao dịch cá nhân chi tiết sang AI provider.
- Nếu Groq lỗi hoặc trả JSON không ổn định, API vẫn trả `aiGenerated = false` với phân tích rule-based fallback để trang Báo cáo không bị gãy.

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

