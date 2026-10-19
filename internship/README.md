# Cách sử dụng thư mục thực tập

Thư mục này có hai nhóm tài liệu khác mục đích:

- [`de-cuong-thuc-tap-java-backend-intern.md`](de-cuong-thuc-tap-java-backend-intern.md) và bản `.docx` cùng tên là **đề cương, tiến độ dự kiến** cho thực tập. Hai bản có mức độ tóm tắt và cách chia giai đoạn khác nhau; không nên coi chúng là báo cáo xác nhận ngày đã thực hiện hay bảng đặc tả từng chức năng hiện tại. Các chỗ trong ngoặc như họ tên, mã sinh viên, đơn vị thực tập vẫn là thông tin cần người viết hoàn thiện.
- [`workflow/README.md`](workflow/README.md) là lộ trình **đọc lại code hiện tại** theo module. Bắt đầu từ đây khi cần hiểu controller, service, entity, kiểm thử và cách vận hành local.

Ví dụ cần phân biệt: đề cương dự kiến có nhắc Flyway trong phần khởi tạo, còn [`application.yml`](../backend/src/main/resources/application.yml) hiện đặt `spring.flyway.enabled: false` và JPA `ddl-auto: update`. Không thể trình bày rằng các migration hiện đang tự chạy chỉ dựa vào đề cương. Các mốc trong đề cương là dự kiến, không được tự suy thành tiến độ thực tế; đối chiếu nhật ký công việc và tài liệu triển khai khi viết báo cáo.

Các bản đề cương gốc được giữ nguyên để tránh tự ý thay đổi tài liệu hành chính. Khi nộp hoặc sửa đề cương, đối chiếu lại bản chính thức với người hướng dẫn và lựa chọn nội dung phù hợp. Bộ `workflow` bám mã nguồn trong workspace nhưng không thay thế test hoặc bằng chứng vận hành; nếu code thay đổi cần cập nhật lại.
