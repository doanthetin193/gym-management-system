# 06 - KẾ HOẠCH DEPLOYMENT

## 1. Định hướng deploy

Kế hoạch production nên dùng VPS giá hợp lý.

Lý do:

- Backend Spring Boot cần môi trường ổn định.
- Có PostgreSQL.
- Có scheduled jobs.
- Cần backup database.
- Cần Nginx reverse proxy.
- Dễ kiểm soát vận hành hơn free hosting.

Free hosting có thể dùng để demo nhanh, nhưng production nên theo VPS.

## 2. Cấu hình VPS đề xuất

Giai đoạn MVP:

```text
2 vCPU
2-4 GB RAM
40 GB SSD/NVMe
Ubuntu 22.04/24.04
```

Nếu chỉ demo:

```text
1 vCPU
1-2 GB RAM
```

nhưng không khuyến nghị cho production lâu dài.

## 3. Kiến trúc deploy

```text
Internet
  |
Cloudflare
  |
Nginx :80/:443
  |
  |-- React static files
  |
  |-- /api -> Spring Boot :8080
                  |
                  -> PostgreSQL :5432
```

## 4. Docker Compose services

MVP:

```text
nginx
backend
postgres
```

Phase sau có thể thêm:

- redis.
- minio.
- ml-batch.
- monitoring.

## 5. Cấu trúc server

```text
/opt/gym-duong-double
  docker-compose.yml
  .env
  nginx/
    nginx.conf
  backend/
    Dockerfile
  frontend/
    dist/
  backups/
  logs/
```

## 6. Environment variables

Backend:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://postgres:5432/gym
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
JWT_SECRET=...
JWT_ACCESS_TOKEN_TTL=...
JWT_REFRESH_TOKEN_TTL=...
CORS_ALLOWED_ORIGINS=https://domain.com
```

Frontend:

```text
VITE_API_BASE_URL=https://domain.com/api/v1
```

Postgres:

```text
POSTGRES_DB=gym
POSTGRES_USER=...
POSTGRES_PASSWORD=...
```

## 7. Nginx config mục tiêu

Nginx phụ trách:

- Serve React app.
- Reverse proxy `/api`.
- HTTPS.
- Gzip.
- Cache static assets.
- Security headers cơ bản.

Routing:

```text
/             -> frontend index.html
/assets/*     -> static cache
/api/*        -> backend:8080
```

## 8. Cloudflare

Dùng cho:

- DNS.
- HTTPS.
- CDN static assets.
- Basic bot protection.
- Ẩn IP server ở mức proxy DNS.

## 9. Database migration

Dùng Flyway.

Quy tắc:

- Mọi thay đổi schema phải có migration.
- Không sửa migration đã chạy production.
- Trước migration lớn phải backup.
- Seed roles và financial categories ban đầu bằng migration.

## 10. Backup

Backup PostgreSQL hằng ngày.

Yêu cầu:

- Lưu tối thiểu 7-14 bản backup.
- Backup dạng `.sql.gz`.
- Có script restore.
- Kiểm tra restore định kỳ.

Ví dụ:

```text
backups/
  2026-09-11-gym.sql.gz
  2026-09-12-gym.sql.gz
```

## 11. Logging và health check

Tối thiểu:

- Backend logs.
- Nginx access/error logs.
- Docker restart policy.
- Spring Boot Actuator `/actuator/health`.

Phase sau:

- Uptime monitoring.
- Error tracking.
- Alert nếu backup fail.

## 12. Bảo mật production

- Không expose PostgreSQL ra Internet.
- Bật HTTPS.
- `.env` không commit.
- JWT secret đủ mạnh.
- CORS chỉ cho domain thật.
- Password hash BCrypt.
- Validate input backend.
- Audit log thao tác tài chính.
- Firewall chỉ mở port cần thiết.

## 13. Quy trình deploy lần đầu

1. Trỏ domain về Cloudflare.
2. Tạo VPS Ubuntu.
3. Cài Docker/Docker Compose.
4. Tạo thư mục `/opt/gym-duong-double`.
5. Cấu hình `.env`.
6. Build frontend.
7. Build backend.
8. Chạy `docker compose up -d`.
9. Kiểm tra migration Flyway.
10. Kiểm tra health API.
11. Kiểm tra login.
12. Kiểm tra backup.

## 14. Quy trình deploy cập nhật

1. Backup database.
2. Pull/build phiên bản mới.
3. Chạy migration.
4. Restart backend.
5. Kiểm tra health.
6. Smoke test login/dashboard.

## 15. Smoke test sau deploy

- Login OWNER.
- Mở dashboard.
- Tạo member test.
- Tạo/gia hạn gói test.
- Ghi payment test.
- Kiểm tra công nợ giảm đúng sau khi ghi payment.
- Tạo PT session test.
- Kiểm tra backup.

## 16. Khi nào cần nâng cấp server

Cân nhắc nâng cấp khi:

- RAM thường xuyên > 80%.
- CPU thường xuyên cao.
- Query dashboard chậm.
- Backup quá lâu.
- Số user/traffic tăng mạnh.

Ưu tiên tối ưu query/index trước khi tăng kiến trúc phức tạp.
