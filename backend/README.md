# Gym Duong Double Backend

Backend Spring Boot cho hệ thống quản lý phòng gym Dương Double.

## Công Nghệ

- Java 21
- Spring Boot
- Spring Web MVC
- Spring Data JPA / Hibernate
- Spring Security
- PostgreSQL
- Flyway
- Maven Wrapper

## PostgreSQL Local

Ứng dụng dùng PostgreSQL local:

```properties
host=localhost
port=5432
database=gym_duong_double
username=postgres
password=your_local_password
```

Các giá trị này có thể override bằng biến môi trường:

```properties
DB_URL=jdbc:postgresql://localhost:5432/gym_duong_double
DB_USERNAME=postgres
DB_PASSWORD=your_local_password
```

Tạo database trước khi chạy app:

```sql
CREATE DATABASE gym_duong_double;
```

Trong giai đoạn phát triển ban đầu, Hibernate đang dùng:

```yaml
spring.jpa.hibernate.ddl-auto: update
```

Flyway đã được cài dependency và cấu hình sẵn theo profile, nhưng profile `dev` hiện tạm tắt Flyway để phát triển entity nhanh. Khi database ổn định hơn sẽ chuyển sang migration versioned.

## Chạy Backend

```powershell
$env:DEBUG='false'
$env:DB_PASSWORD='your_local_password'
.\mvnw.cmd spring-boot:run
```

API base path:

```text
http://localhost:8080/api
```

Health check:

```text
GET http://localhost:8080/api/v1/health
```

Nếu app báo `password authentication failed`, hãy kiểm tra lại username/password PostgreSQL đang dùng trong DBeaver. Project hiện đang default theo user PostgreSQL phổ biến là `postgres`.

## Kiểm thử local

Set biến môi trường trước khi chạy lần đầu để seed tài khoản OWNER:

```powershell
$env:DEBUG='false'
$env:DB_PASSWORD='your_local_password'
$env:JWT_SECRET='change_me_to_a_long_random_secret_at_least_32_chars'
$env:OWNER_PASSWORD='your_owner_password'
.\mvnw.cmd spring-boot:run
```

Các file request `sprint*.http` đã được loại bỏ vì là kịch bản lịch sử và không còn khớp toàn bộ API hiện hành. Dùng tài liệu kiểm thử đang được duy trì cùng mã nguồn thay cho các request cũ:

```text
plans/active/09-pt-operation-and-manual-test.md
internship/final_report/bao-cao-tong-ket-do-an.md (Chương 5)
```

Luồng kiểm thử trọng yếu gồm đăng nhập, tạo hội viên, đăng ký gói, thu tiền/công nợ, phân công và ghi nhận PT, portal hội viên, quyền truy cập và AI advisor. Luôn dùng dữ liệu demo hoặc database test; không chạy kịch bản thử nghiệm trên dữ liệu vận hành thật.
