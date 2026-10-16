# 06 - Định Hướng Deployment Tương Lai

Cập nhật lần cuối: 16/10/2026.

## 1. Trạng thái hiện tại

Project hiện chạy local development và chưa có deployment production. Tài liệu này chỉ là định hướng cho giai đoạn sau, không phải hạng mục đã triển khai hay điều kiện nghiệm thu MVP.

Mọi URL, thông số máy chủ, Docker, domain, SSL và backup production chưa được provision trong repository.

## 2. Môi trường local đang dùng

- Frontend Vite: localhost:5173.
- Backend Spring Boot: localhost:8080/api.
- PostgreSQL local: gym_duong_double.
- CORS local cho các frontend port 5173, 5174 và 3000.
- Cấu hình nhạy cảm đọc từ biến môi trường trong file .env local, không commit secret.

Biến cần có khi chạy:

- DB_URL, DB_USERNAME, DB_PASSWORD.
- JWT_SECRET, JWT_ACCESS_TOKEN_MINUTES.
- OWNER_EMAIL, OWNER_PASSWORD, OWNER_FULL_NAME, OWNER_PHONE.
- DEMO_SEED_ENABLED và DEMO_MEMBER_PASSWORD nếu cần seed.
- GROQ_API_KEYS, GROQ_MODEL, GROQ_ENDPOINT, GROQ_TIMEOUT_SECONDS nếu bật AI Advisor.

## 3. Điều kiện trước khi deploy

Chưa được deploy chỉ với ddl-auto=update. Trước khi đưa lên môi trường dài hạn cần hoàn thành:

1. Chốt schema PostgreSQL và chuyển thay đổi schema sang Flyway versioned migrations.
2. Bật Flyway, cấu hình JPA ở chế độ validate hoặc chế độ phù hợp.
3. Dùng secret manager hoặc environment của host cho password, JWT secret và Groq keys.
4. Cấu hình HTTPS, reverse proxy và CORS theo domain thật.
5. Sao lưu PostgreSQL định kỳ và thử phục hồi dữ liệu.
6. Hạn chế Actuator chỉ còn health cần thiết.
7. Thay in-memory rate limit bằng Redis/gateway nếu chạy nhiều backend instance.
8. Thiết lập logging, monitoring và quy trình xử lý sự cố phù hợp.

## 4. Định hướng kiến trúc khi cần

Mô hình tối thiểu phù hợp:

Internet
  -> HTTPS reverse proxy
  -> Frontend static build
  -> Spring Boot API
  -> PostgreSQL

Groq, TikTok iframe và Google Apps Script vẫn là dịch vụ ngoài. Cần đánh giá CORS, quota, secret và chính sách dữ liệu trước khi đưa vào môi trường thật.

## 5. Quy trình release tương lai

1. Chạy backend tests, frontend lint và frontend build.
2. Backup database.
3. Chạy Flyway migration.
4. Deploy backend/frontend.
5. Smoke test login, tạo hội viên, kích hoạt gói, thu nợ, PT, Portal, Báo cáo và AI fallback.
6. Kiểm tra health và log.

Không có bước nào trong mục này đã được thực hiện cho MVP local hiện tại.
