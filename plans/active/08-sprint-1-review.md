# 08 - Review Sprint 1 Backend

Ngày chốt: 22/09/2026

## 1. Phạm vi đã hoàn thành

Sprint 1 backend đã hoàn thành phần nền tảng để hệ thống có thể chạy API end-to-end với PostgreSQL local.

Các phần chính đã có:

- Chuẩn hóa response API bằng `ApiResponse` và `ApiError`.
- Xử lý lỗi tập trung bằng `GlobalExceptionHandler`.
- Authentication bằng email/password.
- JWT access token.
- Spring Security stateless.
- RBAC cơ bản với role `OWNER`, `PT`, `MEMBER`.
- Seed dữ liệu nền tảng: roles, tài khoản OWNER, danh mục tài chính, system settings.
- API quản lý gói tập.
- API quản lý hội viên.
- API đăng ký gói cho hội viên.
- Tự sinh công nợ khi hội viên đăng ký gói.
- API ghi nhận thanh toán.
- Đồng bộ `paidAmount` và `debtAmount` sau thanh toán.
- Tự tạo financial transaction khi ghi nhận payment.
- Kịch bản kiểm thử thủ công bằng `backend/http/sprint1.http`.

## 2. API hiện có

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

## 3. Tài khoản test local

Tài khoản OWNER được seed khi chạy backend:

```text
email: owner@gymduongdouble.local
password: change_me
```

Ghi chú bảo mật:

- `change_me` chỉ là mật khẩu seed cho môi trường local/dev.
- Production bắt buộc override bằng biến môi trường `OWNER_PASSWORD`.
- `JWT_SECRET` production phải dùng chuỗi bí mật đủ mạnh, không dùng giá trị dev.

## 4. Kết quả kiểm thử

Đã chạy kiểm thử API thực tế trên server local:

```text
ALL SPRINT 1 API TESTS PASSED: 36 checks
```

Các nhóm đã test:

- Health check.
- Login đúng.
- Login sai mật khẩu.
- Login Sai email.
- Lấy thông tin user hiện tại.
- Thiếu token.
- Token sai.
- Tạo gói self-training.
- Tạo gói giáo án/hướng dẫn.
- Tạo gói PT chính.
- Gói inactive không xuất hiện trong danh sách active.
- Tạo gói PT thiếu `ptLevel` bị chặn.
- Tạo hội viên.
- Chặn trùng số điện thoại.
- Xem chi tiết hội viên.
- Tìm hội viên theo tên.
- Tìm hội viên theo số điện thoại.
- Hội viên không tồn tại trả 404.
- Đăng ký gói cho hội viên.
- Chặn đăng ký gói inactive.
- Chặn đăng ký gói không tồn tại.
- Xem lịch sử gói của hội viên.
- Thanh toán đủ gói tự tập.
- Thanh toán một phần gói giáo án.
- Thanh toán gói PT chính.
- Chặn thanh toán khi membership không thuộc member.
- Chặn payment amount bằng 0.

## 5. Những điểm đã điều chỉnh trong quá trình test

- Sửa seed OWNER để Hibernate không lỗi khi merge quan hệ role.
- Chuẩn hóa lỗi login Sai email thành `401 BAD_CREDENTIALS`.
- Cho phép tìm hội viên theo cả tên và số điện thoại.
- Set UTF-8 cho các response lỗi security để Postman/curl không lỗi dấu tiếng Việt.
- Bổ sung `sprint1.http` thành kịch bản test đầy đủ hơn, không chỉ happy path.

## 6. Giới hạn hiện tại

- Chưa có frontend React.
- Chưa có API cập nhật hội viên.
- Chưa có API cập nhật gói tập.
- Chưa có API lọc khách sắp hết hạn/hết hạn.
- Chưa có flow gia hạn riêng; hiện tại đăng ký/gia hạn được biểu diễn bằng việc tạo thêm `member_memberships`.
- Chưa có dashboard.
- Flyway đã có dependency nhưng dev profile đang tắt để dùng Hibernate `ddl-auto: update` trong giai đoạn dựng entity/API ban đầu.

## 7. Hướng tiếp theo

Sau khi commit/push mốc này, bước tiếp theo nên là Sprint 2 backend:

- Hoàn thiện quản lý hội viên.
- Bổ sung cập nhật thông tin hội viên.
- Bổ sung filter khách theo trạng thái gói.
- Bổ sung danh sách khách sắp hết hạn/hết hạn.
- Chuẩn hóa flow gia hạn gói.
- Làm rõ API phục vụ màn hình member list/member detail của frontend.

