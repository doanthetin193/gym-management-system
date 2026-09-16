# GYM DƯƠNG DOUBLE - TÓM TẮT Ý TƯỞNG HỆ THỐNG

## 1. Ý tưởng chính

GYM DƯƠNG DOUBLE là một hệ thống web quản lý phòng gym nhỏ, được xây dựng từ nhu cầu thực tế của chủ phòng đang quản lý bằng Excel, sổ ghi chép và phiếu giấy.

Mục tiêu của hệ thống là số hóa các nghiệp vụ quan trọng, giảm thao tác thủ công và giúp chủ phòng/PT theo dõi khách hàng, gói tập, tài chính và tiến độ tập luyện hiệu quả hơn.

## 2. Bối cảnh thực tế

- Phòng gym quy mô nhỏ, khoảng 50-70 khách mỗi tháng.
- Dữ liệu khách mới và khách cũ từ trước đến nay khá nhiều.
- Hiện tại đang dùng nhiều bảng Excel/phiếu giấy như:
  - Quản lý khách hàng theo tháng.
  - Lịch dạy PT.
  - Tổng thu, tổng chi.
  - Tính lương PT.
  - Mục tiêu tháng/năm.
  - Theo dõi chỉ số cơ thể.
  - Check-in khách PT/chương trình.
  - Tổng kết mục tiêu và thực tế của khách hàng.

## 3. Vấn đề cần giải quyết

- Chủ phòng phải kiểm tra thủ công khách sắp hết hạn và đã hết hạn.
- Dữ liệu khách hàng, thu chi, lịch dạy và tiến độ tập luyện bị phân tán.
- Khó xem lịch sử gia hạn của khách.
- Khó thống kê khách mới, khách cũ, tỷ lệ gia hạn và doanh thu.
- PT phải cập nhật và tổng hợp tiến độ khách hàng thủ công.
- Báo cáo tài chính, mục tiêu tháng/năm và lương PT dễ sai do nhập/tính tay.

## 4. Nhóm người dùng

Hệ thống có 3 nhóm người dùng chính:

- `OWNER`: chủ phòng, quản lý toàn bộ hệ thống.
- `PT`: quản lý khách được phân công, cập nhật buổi tập và tiến độ.
- `MEMBER`: xem thông tin cá nhân, gói tập và nội dung/chương trình được phép.

Không có role lễ tân trong giai đoạn hiện tại vì phòng gym nhỏ, chủ phòng và PT trực tiếp vận hành.

## 5. Giải pháp đề xuất

Xây dựng một web application quản lý phòng gym theo hướng modular monolith, tập trung vào nghiệp vụ thực tế:

- Quản lý member.
- Quản lý gói tập và gia hạn.
- Theo dõi khách sắp hết hạn/hết hạn.
- Quản lý khách có PT.
- Theo dõi buổi tập, số buổi còn lại, chỉ số cơ thể.
- Ghi nhận thu, chi, công nợ.
- Tự động tổng hợp doanh thu, chi phí, lợi nhuận.
- Quản lý mục tiêu tháng/năm.
- Quản lý thư viện bài tập có ảnh/video.

## 6. Phạm vi MVP

MVP nên tập trung vào các chức năng cốt lõi:

- Đăng nhập và phân quyền `OWNER`, `PT`, `MEMBER`.
- Quản lý khách hàng.
- Quản lý gói tập.
- Đăng ký/gia hạn gói.
- Dashboard khách sắp hết hạn, hết hạn, sinh nhật, doanh thu.
- Ghi nhận thanh toán, thu/chi và công nợ cơ bản.
- Gán PT cho khách.
- Ghi nhận buổi PT/check-in chương trình.
- Theo dõi chỉ số cơ thể.
- Quản lý bài tập và video YouTube embed.

## 7. Tối ưu từ Excel sang hệ thống

Không bê nguyên cấu trúc Excel vào database. Hệ thống sẽ tách rõ:

- Dữ liệu nguồn cần lưu thật.
- Báo cáo/tổng hợp sẽ được hệ thống tự tính.

Ví dụ:

| Excel/phiếu hiện tại | Chuyển thành trong hệ thống |
| --- | --- |
| Quản lý khách hàng tháng | Member, gói tập, lịch sử gia hạn |
| Tổng thu | Payment/Income |
| Tổng chi | Expense |
| Tài chính năm | Báo cáo từ thu/chi |
| Lịch dạy tuần | PT Schedule |
| Check-in | PT Session / Activity Log |
| Theo dõi chỉ số | Body Measurement |
| Chương trình theo mục tiêu | Training Program |
| Tính lương PT | Payroll ở phase sau |

## 8. Định hướng database

Database được thiết kế theo entity nghiệp vụ, không theo từng file Excel.

Các nhóm bảng chính:

- User/Role.
- Member.
- Membership.
- Payment/Finance.
- PT Schedule/Session.
- Body Measurement.
- Training Program.
- Exercise Library.
- Notification/Audit.
- Business Goals.

Ước lượng:

- MVP gọn: khoảng 20-24 bảng.
- Bản đầy đủ theo các phase: khoảng 32-40 bảng.

Các enum như `status`, `plan_type`, `payment_method` sẽ nằm trong code, không tạo bảng riêng nếu không cần quản trị động.

## 9. Công nghệ sử dụng

Frontend:

- React.
- TypeScript.
- Tailwind CSS.

Backend:

- Java.
- Spring Boot.
- Spring Security.
- Spring Data JPA.

Database:

- PostgreSQL.

Deploy:

- VPS Ubuntu.
- Docker Compose.
- Nginx.
- Cloudflare/HTTPS.

## 10. Định hướng video và media

- Video bài tập sẽ embed từ YouTube.
- Hệ thống không upload/stream video trực tiếp bằng VPS.
- Database chỉ lưu URL video, thumbnail và metadata.
- Cách này giúp giảm tải server, tiết kiệm storage và dễ deploy.

## 11. Khả năng tích hợp AI

AI không nằm trong MVP bắt buộc, nhưng hệ thống sẽ lưu dữ liệu đúng để có thể mở rộng sau.

Các hướng AI/ML khả thi:

### PT Customer Progress Analysis

Phân tích tiến độ khách PT dựa trên:

- Buổi tập.
- Bài tập.
- Cân nặng.
- Chỉ số cơ thể.
- Mục tiêu theo tuần.
- Kết quả thực tế.

Mục tiêu: đánh giá khách đang tiến bộ tốt, chững lại hay cần PT can thiệp.

### PT Drop-off Risk

Dự đoán/cảnh báo khách PT có nguy cơ bỏ ngang hoặc không mua tiếp gói PT.

Dữ liệu có thể dùng:

- Số ngày từ buổi PT gần nhất.
- Số buổi còn lại.
- Tần suất tập gần đây.
- Progress score.
- Công nợ.
- Lịch sử gia hạn.

### Customer Segmentation

Phân nhóm khách:

- Khách mới.
- Khách trung thành.
- Khách giá trị cao.
- Khách cần chăm sóc.

Có thể bắt đầu bằng rule-based, sau này dùng K-Means nếu dữ liệu đủ.

### Renewal Analytics

Áp dụng cho khách tự tập không check-in.

Không dự đoán churn bằng hành vi tập luyện vì không có dữ liệu check-in. Thay vào đó, hệ thống theo dõi:

- Khách sắp hết hạn.
- Lịch sử gia hạn.
- Tỷ lệ gia hạn.
- Nhóm khách cần chăm sóc.

### Revenue Forecasting

Khi có đủ dữ liệu doanh thu, có thể dự báo:

- Doanh thu tháng tới.
- Khả năng đạt mục tiêu.
- Xu hướng tăng/giảm doanh thu.

## 12. Roadmap triển khai

### Phase 1 - MVP

- Auth/RBAC.
- Member management.
- Membership/gia hạn.
- Payment/thu chi cơ bản.
- Dashboard chủ phòng.
- PT session log.
- Body measurement.
- Exercise library.

### Phase 2 - Vận hành nâng cao

- PT schedule.
- Training program theo tuần.
- Business goals.
- Import dữ liệu Excel/CSV.
- Báo cáo tài chính nâng cao.
- Báo cáo tiến độ khách PT.

### Phase 3 - Payroll và báo cáo

- Tính lương PT.
- Hoa hồng sale.
- Hoa hồng buổi dạy.
- Thưởng/phạt.
- Export Excel/PDF.

### Phase 4 - AI/Analytics

- PT Progress Analysis.
- PT Drop-off Risk.
- Customer Segmentation.
- Renewal Analytics.
- Revenue Forecasting.

## 13. Giá trị kỳ vọng

Đối với chủ phòng:

- Giảm thời gian quản lý thủ công.
- Không bỏ sót khách sắp hết hạn.
- Theo dõi doanh thu, chi phí, lợi nhuận rõ hơn.
- Quản lý mục tiêu kinh doanh tốt hơn.

Đối với PT:

- Dễ theo dõi khách được phân công.
- Cập nhật buổi tập và chỉ số nhanh hơn.
- Có dữ liệu đánh giá tiến độ khách.

Đối với member:

- Xem được thông tin gói tập.
- Xem bài tập/chương trình được phép.
- Theo dõi tiến độ tốt hơn nếu là khách PT.

## 14. Kết luận

Hệ thống GYM DƯƠNG DOUBLE giải quyết một bài toán thực tế: chuyển quy trình quản lý phòng gym từ Excel/phiếu giấy sang hệ thống web có dữ liệu tập trung.

Hướng triển khai phù hợp là làm MVP gọn trước, tập trung vào member, gói tập, gia hạn, tài chính cơ bản và PT tracking. Sau đó mở rộng sang lịch PT, mục tiêu kinh doanh, payroll, báo cáo nâng cao và AI/analytics.
