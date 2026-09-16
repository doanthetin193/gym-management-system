# GYM DƯƠNG DOUBLE - REQUIREMENT GỐC ĐÃ ĐỒNG BỘ

Tài liệu này giữ lại các yêu cầu ban đầu từ chủ phòng gym, đồng thời cập nhật theo các thông tin đã chốt:

- Phòng gym nhỏ, hiện mỗi tháng khoảng 50-70 khách.
- Dữ liệu khách mới và khách cũ từ trước đến nay khá nhiều.
- Hệ thống chỉ có 3 nhóm người dùng chính: chủ phòng, PT, member.
- Không có lễ tân trong giai đoạn hiện tại.
- Khách tự tập muốn đi lúc nào thì đi, hiện không điểm danh.
- Khách có PT chắc chắn có ghi lại ngày tập, bài tập, buổi tập và tiến độ.

## Phần 1: Dành Cho Chủ Phòng / Quản Lý

### 1. Khách Member tự tập

Yêu cầu:

- Quản lý thông tin đầu vào của khách: họ tên, số điện thoại, sinh nhật, gói tập, thời hạn, chi phí.
- Theo dõi khách sắp hết hạn, hết hạn hôm nay, đã hết hạn.
- Không cần lật sổ hằng ngày để kiểm tra hạn gói.
- Có thể mở nhanh Zalo/chat với khách nếu cần chăm sóc/gia hạn.
- Thống kê hằng tháng tỷ lệ khách mới, khách cũ.
- Thống kê tỷ lệ gia hạn, lịch sử gia hạn và doanh thu theo gói.
- Nhắc sinh nhật khách hàng.

Lưu ý đã chốt:

- Khách tự tập không có check-in nên không theo dõi được hành vi đi tập.
- Không nên cố dự đoán churn bằng ML dựa trên hành vi tập luyện cho nhóm này.
- Nhóm này phù hợp với expiry management, renewal analytics, thống kê khách mới/cũ và rule-based reminder.

### 2. Khách kèm PT

Yêu cầu:

- Quản lý thông tin giống khách member.
- Gán PT phụ trách khách.
- Quản lý hành trình khách hàng của PT.
- Theo dõi số buổi đã tập, số buổi còn lại.
- Ghi lại ngày tập, nội dung buổi tập, bài tập đã tập.
- Theo dõi chỉ số cơ thể thay đổi theo tuần/tháng.
- Theo dõi lộ trình tập luyện theo từng giai đoạn.
- Theo dõi mức độ tiến bộ hằng tuần.
- Thống kê, đánh giá kết quả khách hàng khi kết thúc gói tập.
- So sánh mục tiêu ban đầu và kết quả đạt được.

Lưu ý đã chốt:

- Đây là nhóm dữ liệu có giá trị cao nhất để làm AI sau này.
- Có thể phát triển PT Progress Analysis và PT Drop-off Risk dựa trên session log, exercise log, body measurement và lịch sử gia hạn PT.

### 3. Tài chính

Yêu cầu:

- Thống kê chi tiết các khoản thu và chi.
- Ghi nhận thanh toán khi khách mua/gia hạn gói.
- Theo dõi công nợ.
- Tự động tính doanh thu, chi phí và lợi nhuận theo ngày, tháng, quý, năm.

MVP:

- Làm tài chính cơ bản trước: payment, thu/chi, doanh thu tháng, công nợ.

Phase sau:

- Báo cáo tài chính nâng cao.
- Export Excel.
- Dự báo doanh thu nếu có đủ dữ liệu lịch sử.

### 4. Nhân sự

Yêu cầu ban đầu:

- Lên lịch làm việc, chấm công.
- Theo dõi và thống kê doanh số từng nhân sự/PT.
- Tính lương: lương cứng, hoa hồng sale, hoa hồng buổi dạy.

Điều chỉnh theo thực tế:

- Vì phòng gym nhỏ và không có lễ tân, nhân sự không nằm trong MVP.
- Phase sau chỉ tập trung vào hồ sơ PT, lịch làm việc PT, hoa hồng PT và payroll nếu chủ phòng có công thức rõ.

### 5. Mục tiêu và chiến lược dài hạn

Yêu cầu:

- Thống kê doanh số theo ngày, tuần, tháng, quý, năm.
- Lập biểu đồ so sánh với mục tiêu đề ra đầu năm.
- Theo dõi tỷ lệ khách mới/cũ.
- Theo dõi tỷ lệ gia hạn và nhóm khách cần chăm sóc.

Phase sau:

- Business goals.
- Advanced analytics.
- Customer segmentation.
- Revenue forecasting nếu dữ liệu đủ dài.

## Phần 2: Dành Cho PT

### 1. Báo cáo

Yêu cầu:

- Báo cáo/cập nhật lịch dạy hằng ngày.
- Xem danh sách khách được phân công.
- Xem khách nào còn ít buổi.
- Xem khách nào có tiến độ chậm hoặc lâu chưa có buổi PT.

### 2. Cập nhật tiến độ khách hàng

Yêu cầu:

- Cập nhật buổi tập.
- Cập nhật bài tập đã tập.
- Cập nhật sets/reps/mức tạ nếu cần.
- Cập nhật ghi chú sau buổi tập.
- Cập nhật chỉ số cơ thể.
- Cập nhật đánh giá tiến độ theo từng giai đoạn.

MVP:

- Session log.
- Body measurement.
- Số buổi đã tập/còn lại.
- Ghi chú PT.

Phase sau:

- Exercise log chi tiết.
- Progress score.
- Báo cáo cuối gói.
- AI PT Progress Analysis.
- PT Drop-off Risk.

## Phần 3: Dành Cho Member

### 1. Chương trình tập

Yêu cầu:

- Nơi lưu trữ các chương trình tập theo từng mục tiêu.
- Có hình ảnh hoặc video minh họa.
- Khách Member/VIP mới được truy cập một số nội dung premium nếu chủ phòng muốn thương mại hóa nội dung.

Định hướng kỹ thuật:

- Video bài tập embed từ YouTube.
- Không upload/stream video trực tiếp bằng VPS.
- Database chỉ lưu URL video, thumbnail và metadata.

### 2. Kiến thức và hướng dẫn tập luyện

Yêu cầu:

- Nơi cập nhật kiến thức chuyên môn.
- Nơi chia sẻ hướng dẫn tập luyện.
- Có thể phân quyền public/member-only/premium.

Phase sau:

- Knowledge base.
- Rule-based exercise recommendation.
- RAG chatbot nếu có đủ nội dung tốt và chấp nhận chi phí API/model.

## Kết Luận Requirement Đã Chốt

MVP nên tập trung:

- Auth và phân quyền OWNER/PT/MEMBER.
- Quản lý member.
- Quản lý gói tập.
- Đăng ký/gia hạn gói.
- Theo dõi hết hạn/sắp hết hạn.
- Dashboard chủ phòng.
- Tài chính cơ bản.
- PT session log và body measurement.
- Thư viện bài tập có ảnh và YouTube embed.
- Member portal cơ bản.

Không làm sớm:

- Microservices.
- Upload/stream video bằng VPS.
- Auto Zalo khi chưa xác minh API/chính sách.
- Payment online.
- Payroll phức tạp.
- Churn ML cho toàn bộ khách tự tập khi không có check-in.
- Computer Vision.
