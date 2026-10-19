# Khởi động local và đọc lỗi thường gặp

## 1. Cấu hình và khởi động backend

[`backend/pom.xml`](../../../backend/pom.xml) khai báo Java 21, Spring Boot, Maven dependencies cho web, JPA, security, validation, PostgreSQL và test. [`application.yml`](../../../backend/src/main/resources/application.yml) chọn profile dev mặc định, port 8080, context `/api`, datasource từ biến môi trường và Flyway tắt.

Từ thư mục gốc, chạy `.\run-backend.bat`. File này chuyển vào thư mục `backend`, gọi [`run-backend.ps1`](../../../backend/run-backend.ps1); script đọc `.env` ở thư mục gốc và chỉ đặt biến process nếu biến tương ứng chưa có. Script yêu cầu `DB_PASSWORD`, `JWT_SECRET`, `OWNER_PASSWORD`; không chép giá trị thật vào Git hay báo cáo. Điều này giải thích vì sao chạy Maven trực tiếp trong một terminal mới có thể không có cấu hình tương đương script.

Database PostgreSQL phải có sẵn và kết nối hợp lệ. Script không phải backup, cũng không phải migration Flyway. Không xóa database để xử lý lỗi khởi động thông thường.

## 2. Health và cổng

Khi service báo đã start, kiểm tra endpoint health đã cấu hình, chẳng hạn `http://localhost:8080/api/actuator/health`. Nếu báo `Port 8080 was already in use`, tìm process đang nghe cổng bằng PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Sau đó kiểm tra đúng process và chỉ dừng process nếu biết đó là instance mình muốn dừng; không tự động kết thúc process không rõ. Nếu backend của dự án đã chạy, không khởi động một instance khác cùng cổng. Nếu đổi cổng, frontend API base URL cũng phải được cấu hình khớp.

## 3. Lỗi class được biên dịch và database

`ClassFormatError` ở file `.class` trong `target` có thể là file build lỗi/hỏng; đọc stack trace và xác nhận class/path. Nếu cần build lại sạch, dừng những tiến trình backend đang dùng cùng output, sau đó dùng Maven clean/test phù hợp. `clean` xóa output build của Maven, không xóa database; vẫn phải kiểm tra lệnh và thư mục làm việc trước khi chạy.

Lỗi kết nối database cần kiểm tra service PostgreSQL, URL, database, username/password và biến môi trường đang thực sự được process nhận. Lỗi authentication database không giống lỗi cổng backend bận. Tránh đăng nguyên log có secret lên chat hoặc issue.

## 4. Frontend

Trong `frontend`, dùng `npm install` khi cần cài dependency và `npm run dev` để chạy Vite; xem URL/cổng thực tế trong terminal. `VITE_API_BASE_URL` được [`apiClient.ts`](../../../frontend/src/shared/api/apiClient.ts) dùng nếu cấu hình; mặc định là `http://localhost:8080/api`. CORS backend phải cho phép origin frontend tương ứng. Chỉ chạy local không có nghĩa đã triển khai production.

## 5. Đọc log theo nguyên nhân, không chỉ dòng cuối

Ví dụ log `Port 8080 was already in use`: JVM có thể đã kết nối database và khởi tạo JPA nhưng không bind được cổng web. Kiểm tra process đang nghe cổng, xác định có phải backend đã chạy hay chương trình khác trước khi dừng. Không tùy tiện tắt process không biết chủ sở hữu. Cấu hình cổng khác chỉ có tác dụng khi frontend/CORS cũng trỏ đúng cổng.

Ví dụ `ClassFormatError` với file trong `target/classes`: đây là lỗi bytecode runtime không đọc được, không tự chứng minh entity Java hay PostgreSQL bị sai. Kiểm tra môi trường Java, quá trình build; có thể biên dịch lại sạch output Maven sau khi bảo đảm không có build khác đang dùng, rồi chạy lại. Maven clean xóa output build, không phải thao tác xóa database, nhưng vẫn cần đọc lệnh và chạy đúng thư mục.

## 6. Chuỗi chẩn đoán lỗi đăng nhập local

1. Backend có log khởi động hoàn tất và cổng lắng nghe chưa? Xác nhận process trước khi khởi động bản thứ hai.
2. Frontend gọi đúng base URL `/api` và origin được backend cho phép không? Kiểm tra Network, không công bố token.
3. PostgreSQL chạy và biến kết nối trỏ đúng database dev không? Không chép `.env` hoặc mật khẩu vào ảnh/log báo cáo.
4. Response là 401, 403, 429 hay lỗi mạng? 429 có thể là bộ đếm trong RAM, không đồng nghĩa sai schema database.
5. Xem stack trace ở server, ghép request với exception, chỉ thay đổi cấu hình sau khi xác định nguyên nhân.

Không cần xóa database để chữa lỗi chiếm cổng hay bytecode. Sao lưu và kiểm tra mục tiêu trước mọi thao tác tác động dữ liệu.
