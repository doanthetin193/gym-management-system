# Lộ trình tự học từ mã nguồn Gym Dương Double

Bộ tài liệu này dành cho người đã biết Java và Spring Boot cơ bản, muốn đọc lại **mã nguồn hiện tại** để hiểu dự án từ bên trong. Nội dung được tổ chức theo chủ đề, không cố tái hiện chính xác lịch sử từng sprint. Các stage bên dưới đã có bài về những module chính; trạng thái này không có nghĩa từng nhánh code đã được giải thích hoặc kiểm thử hết.

Trước khi bắt đầu, xem [bản đồ tra cứu code và nghiệp vụ](00_ban_do_code.md) để tìm module, entity và route cần đọc.

Sau khi nắm bản đồ, dùng [danh mục thành phần, API và dữ liệu](01_doi_chieu_thanh_phan_va_api.md) để rà theo từng controller và entity. Đọc thêm [hướng dẫn thư mục thực tập](../README.md) để phân biệt đề cương dự kiến và tài liệu code hiện tại.

## Thứ tự đọc và tiến độ

| Giai đoạn | Nội dung | Trạng thái |
| --- | --- | --- |
| [Stage 1](stage_1/README.md) | Cấu trúc backend, luồng request, dữ liệu và lỗi chung | Đã viết, đối chiếu mã nguồn |
| [Stage 2](stage_2/README.md) | Tài khoản, đăng nhập, JWT, phân quyền và bảo vệ API | Đã viết, đối chiếu mã nguồn |
| [Stage 3](stage_3/README.md) | Hội viên, gói tập và vòng đời đăng ký | Đã viết, đối chiếu mã nguồn |
| [Stage 4](stage_4/README.md) | Thanh toán, công nợ và ngày thu | Đã viết, đối chiếu mã nguồn |
| [Stage 5](stage_5/README.md) | Phân công PT, lịch, buổi tập, chỉ số và mục tiêu | Đã viết, đối chiếu mã nguồn |
| [Stage 6](stage_6/README.md) | Portal hội viên, nhân sự, thư viện bài tập và cấu hình | Đã viết, đối chiếu mã nguồn |
| [Stage 7](stage_7/README.md) | Dashboard, báo cáo, xuất dữ liệu và AI | Đã viết, đối chiếu mã nguồn |
| [Stage 8](stage_8/README.md) | Kiểm thử, frontend và vận hành local | Đã viết, đối chiếu mã nguồn |

Các bài đã được bổ sung đoạn code, ví dụ và câu hỏi thực hành, nhưng mức độ đào sâu giữa các phần chưa đồng đều. Tài liệu không thay thế code hoặc bảo đảm rằng toàn hệ thống không có lỗi. Khi code thay đổi, cần kiểm tra lại tài liệu liên quan.

## Cách học đề xuất

1. Đọc một tài liệu, mở từng đường dẫn mã nguồn được dẫn trong tài liệu.
2. Tự lần theo luồng từ controller xuống service, repository, entity rồi quay về response.
3. Dùng dữ liệu demo và môi trường local để thực hành; tránh dùng dữ liệu thật hay chia sẻ mật khẩu, JWT và API key.
4. Trả lời các câu hỏi tự kiểm tra cuối bài. Nếu không khớp, lấy code hiện tại làm căn cứ và cập nhật tài liệu.

### Cách đọc ví dụ code

- Đoạn ghi “trích” lấy từ source, có thể được nói rõ là đã lược import, các method hay nhánh không liên quan. Mở file gốc để xem ngữ cảnh và thứ tự đầy đủ.
- Đoạn ghi “minh họa” hoặc “giả” dùng để giải thích ý tưởng; không mặc định là code có thể copy chạy, không phải kết quả test thực tế.
- Ví dụ tên, số tiền, ngày và tài khoản là dữ liệu học tập. Không dán mật khẩu, API key, JWT hoặc dữ liệu khách thật vào tài liệu.
- Lời giải thích về kết quả mong đợi là kịch bản kiểm thử; chỉ đánh dấu PASS sau khi tự chạy trong môi trường test và đối chiếu response, database.

Các stage đã có bài giải thích theo các module chính. Đây là tài liệu học tập theo trạng thái code được đối chiếu, không phải bằng chứng rằng mọi nhánh và mọi chức năng đã được kiểm thử. Hai file đề cương trong thư mục `internship` không thuộc bộ workflow này và được giữ nguyên.
