# 04 - Thiết Kế API

Cập nhật lần cuối: 16/10/2026.

Base URL local dev: http://localhost:8080/api

Tất cả API nghiệp vụ dùng tiền tố /v1. Response thành công theo ApiResponse; lỗi được trả nhất quán qua GlobalExceptionHandler. JSON request/response dùng UTF-8.

## 1. Quy ước bảo mật

- Ngoài trừ login, health và /v1/public/**, request cần Bearer JWT.
- Method security và service security cùng kiểm tra role/phạm vi dữ liệu.
- Login và endpoint nhạy cảm có rate limit; khi bị giới hạn trả HTTP 429 và Retry-After.
- API response có no-cache và security headers.
- Ngày thu tiền, ngày ghi buổi và ngày đo không được ở tương lai.

## 2. Auth và profile

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| POST | /v1/auth/login | Public | Đăng nhập bằng email hoặc số điện thoại và password. |
| GET | /v1/auth/me | Authenticated | Lấy tài khoản hiện tại và roles. |
| POST | /v1/auth/change-password | Authenticated | Đổi mật khẩu của chính mình, đồng thời thu hồi JWT cũ. |

Login nhận rememberMe để quyết định thời hạn token. Password policy áp dụng cho tạo, reset và đổi mật khẩu.

## 3. Hội viên và Portal

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | /v1/members | OWNER, PT | Tìm kiếm/lọc hội viên trong phạm vi phân quyền. |
| POST | /v1/members | OWNER, PT | Tạo hội viên. |
| GET | /v1/members/{id} | OWNER, PT | Lấy chi tiết hội viên. |
| PUT | /v1/members/{id} | OWNER, PT | Cập nhật hồ sơ hội viên. |
| POST | /v1/members/{id}/portal-account | OWNER | Cấp tài khoản Portal MEMBER. |
| PUT | /v1/members/{id}/portal-account/status | OWNER | Khóa/mở khóa Portal. |
| POST | /v1/members/{id}/portal-account/reset-password | OWNER | Đặt lại mật khẩu Portal và thu hồi JWT cũ. |
| DELETE | /v1/members/{id}/portal-account | OWNER | Gỡ liên kết tài khoản Portal khỏi hội viên. |
| GET | /v1/member-portal/me | MEMBER | Lấy toàn bộ dữ liệu chỉ đọc của chính hội viên. |

PT không được dùng API để xem tùy ý khách tự tập hay khách của PT khác. Service kiểm tra vai trò, phân công và gói PT.

## 4. Bảng giá và đăng ký gói

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | /v1/membership-plans | OWNER, PT | Lấy gói đang active để bán. |
| GET | /v1/membership-plans/all | OWNER | Lấy cả gói active/inactive để quản lý. |
| POST | /v1/membership-plans | OWNER | Tạo bảng giá. |
| PUT | /v1/membership-plans/{id}/active | OWNER | Bật/tắt gói. |
| POST | /v1/members/{memberId}/memberships | OWNER, PT | Kích hoạt gói/gia hạn, có thể kèm thu ngay. |
| GET | /v1/members/{memberId}/memberships | OWNER, PT | Lấy lịch sử gói của hội viên. |

Request tạo membership có planId, startDate, giá, giảm giá, initialPaidAmount và thông tin phiếu thu ban đầu nếu có. Khi initialPaidAmount bằng 0, request không cần tạo payment ngày đó.

## 5. Thu tiền, công nợ và VietQR

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| POST | /v1/payments | OWNER, PT | Lập phiếu thu mới, bao gồm thu nợ từng phần. |
| GET | /v1/payments | OWNER, PT | Lọc phiếu thu theo hội viên, khoảng ngày và phương thức. |
| GET | /v1/debts | OWNER, PT | Lấy công nợ theo phạm vi dữ liệu. |
| GET | /v1/settings/vietqr | OWNER | Lấy cấu hình VietQR đầy đủ. |
| PUT | /v1/settings/vietqr | OWNER | Cập nhật cấu hình VietQR. |
| GET | /v1/public/vietqr-setting | Public | Lấy thông tin VietQR cần hiển thị trong luồng thu tiền. |

CreatePaymentRequest yêu cầu amount dương và paymentMethod. paymentDate nếu bỏ trống sẽ theo quy tắc service, nhưng không bao giờ được là ngày tương lai.

## 6. PT, lịch hẹn và tiến độ

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | /v1/pt/profiles | OWNER, PT | Danh sách PT phục vụ phân công. |
| POST | /v1/pt/profiles | OWNER, PT | Tạo/cập nhật profile PT theo phạm vi quyền. |
| GET | /v1/pt/my-members | OWNER, PT | Danh sách học viên PT. PT chỉ lấy dữ liệu của mình. |
| POST | /v1/pt/assignments | OWNER, PT | Phân công PT; PT chỉ được tự nhận chính mình. |
| PUT | /v1/pt/assignments/{id}/reassign | OWNER | Điều chuyển học viên sang PT khác. |
| GET | /v1/pt/schedules | OWNER, PT | Lấy lịch PT theo PT/khoảng ngày. |
| POST | /v1/pt/schedules | OWNER, PT | Đặt lịch dạy. |
| DELETE | /v1/pt/schedules/{id} | OWNER, PT | Xóa lịch phù hợp phạm vi quyền. |
| GET | /v1/pt/session-packages | OWNER, PT | Lấy gói buổi PT. |
| GET | /v1/pt/members/{memberId} | OWNER, PT | Lấy hồ sơ vận hành PT của học viên. |
| POST | /v1/pt/members/{memberId}/session-logs | OWNER, PT | Ghi buổi PT 1-1. |
| POST | /v1/pt/members/{memberId}/activity-logs | OWNER, PT | Ghi tự ôn tập hoặc check-in hướng dẫn. |
| POST | /v1/pt/members/{memberId}/body-measurements | OWNER, PT | Lưu số đo cơ thể. |
| POST | /v1/pt/members/{memberId}/goals | OWNER, PT | Lưu mục tiêu PT. |

Backend xác thực phân công, gói PT, ngày, khách, PT, lịch và session package trước khi chấp nhận request ghi buổi.

## 7. Dashboard, báo cáo và nhắc việc

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | /v1/dashboard/owner | OWNER | Chỉ số vận hành Dashboard. |
| GET | /v1/reports/finance | OWNER | Báo cáo doanh thu theo payment_date. |
| GET | /v1/reports/members | OWNER | Báo cáo tình trạng hội viên. |
| GET | /v1/notifications | OWNER | Nhắc việc động về hạn gói, công nợ và sinh nhật. |
| POST | /v1/ai/retention-revenue-advisor | OWNER | Phân tích giữ chân và doanh thu theo tháng. |

XLSX được tạo ở frontend từ dữ liệu API hiện có. Đồng bộ Google Sheet là request trực tiếp từ frontend đến Apps Script URL do OWNER cấu hình; không có API backend riêng cho export hay sync.

## 8. Tài khoản nhân sự

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | /v1/settings/team-users | OWNER | Danh sách tài khoản OWNER/PT. |
| POST | /v1/settings/team-users | OWNER | Tạo tài khoản nhân sự. |
| PUT | /v1/settings/team-users/{id}/role | OWNER | Đổi role hợp lệ. |
| PUT | /v1/settings/team-users/{id}/status | OWNER | Khóa/mở khóa tài khoản. |
| POST | /v1/settings/team-users/{id}/reset-password | OWNER | Đặt lại mật khẩu và thu hồi JWT cũ. |

## 9. Thư viện TikTok

Public:

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | /v1/public/exercise-categories | Lấy danh mục active. |
| GET | /v1/public/exercises | Tìm/lọc video public. |
| GET | /v1/public/exercises/{slugOrId} | Lấy chi tiết bài tập. |

OWNER:

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET, POST | /v1/owner/exercise-categories | Liệt kê/tạo danh mục. |
| PUT | /v1/owner/exercise-categories/{id} | Sửa danh mục. |
| GET, POST | /v1/owner/exercises | Liệt kê/tạo bài tập. |
| PUT | /v1/owner/exercises/{id} | Sửa bài tập. |
| PATCH | /v1/owner/exercises/{id}/published | Ẩn/hiện video public. |
| DELETE | /v1/owner/exercises/{id} | Xóa bài tập. |

Không có endpoint tăng lượt xem TikTok.

## 10. Health

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | /v1/health | Public | Kiểm tra backend nhanh. |
| GET | /actuator/health | Public | Health endpoint của Actuator. |

## 11. Endpoint không có trong MVP

- Import Excel/CSV.
- Expense, profit, payroll và business goals.
- Payment gateway/webhook.
- Zalo API.
- Training program theo tuần.
- AI phân tích chỉ số cá nhân.
- Video view count.

Tài liệu đối chiếu hiện trạng chi tiết: 08-current-implementation-alignment.md.
