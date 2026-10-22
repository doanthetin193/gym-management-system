# Stage 8: Kiểm thử, frontend và vận hành local

1. [Kiểm thử backend và quy trình đối chiếu](01_kiem_thu_backend.md)
2. [Khởi động local và đọc lỗi thường gặp](02_chay_local_va_doc_loi.md)
3. [Frontend: route, API client và kết nối backend](03_frontend_ket_noi_backend.md)
4. [AI Advisor và kịch bản vận hành](04_ai_advisor_va_kich_ban.md)

## Mục tiêu của stage này

Stage 8 không phải “chạy vài lệnh rồi tuyên bố hệ thống không lỗi”. Nó hướng dẫn cách ghép ba loại bằng chứng: test tự động đang có, kiểm thử API/UI theo nghiệp vụ, và chẩn đoán môi trường local. Sau stage này, bạn nên biết một lệnh test chứng minh điều gì, phần nào vẫn phải test thủ công, cách frontend biến request/response thành trải nghiệm, và vì sao lỗi cổng/biến môi trường/bytecode không đồng nghĩa lỗi database.

Khi đọc kết quả kiểm thử, hãy ghi rõ câu lệnh, ngày chạy, môi trường, test nào đã chạy và test nào chưa có. Không biến tài liệu hướng dẫn thành biên bản PASS cố định.
