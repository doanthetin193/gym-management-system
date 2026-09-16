# GYM DƯƠNG DOUBLE - ĐỀ XUẤT HỆ THỐNG QUẢN LÝ PHÒNG GYM

## 1. Tổng quan ý tưởng

GYM DƯƠNG DOUBLE là một hệ thống web quản lý phòng gym nhỏ, được xây dựng dựa trên nhu cầu vận hành thực tế của một chủ phòng gym đang quản lý thủ công bằng Excel, sổ ghi chép và các phiếu theo dõi giấy.

Hệ thống hướng đến việc số hóa các nghiệp vụ chính:

- Quản lý khách hàng.
- Quản lý gói tập và gia hạn.
- Theo dõi khách sắp hết hạn.
- Quản lý khách có PT.
- Theo dõi buổi tập, chỉ số cơ thể và tiến độ tập luyện.
- Ghi nhận thu chi, công nợ và báo cáo tài chính.
- Quản lý mục tiêu kinh doanh theo tháng/năm.
- Quản lý thư viện bài tập có hình ảnh/video.
- Chuẩn bị nền tảng dữ liệu để tích hợp AI trong các phase sau.

Mục tiêu của hệ thống không phải là xây dựng một nền tảng lớn ngay từ đầu, mà là tạo ra một hệ thống vừa đủ, thực tế, dễ triển khai trên VPS và giải quyết đúng các vấn đề hiện tại của phòng gym.

## 2. Bối cảnh thực tế

Phòng gym có quy mô nhỏ, hiện mỗi tháng khoảng 50-70 khách. Tuy nhiên, dữ liệu khách hàng mới và cũ từ trước đến nay tương đối nhiều.

Hiện tại, chủ phòng đang quản lý bằng các bảng Excel/phiếu thủ công như:

- Lịch dạy tuần của PT.
- Quản lý khách hàng theo tháng.
- Tính lương PT.
- Mục tiêu tháng.
- Tài chính năm.
- Tổng thu hằng ngày.
- Tổng chi.
- Theo dõi chỉ số khách hàng.
- Check-in khách PT/chương trình.
- Tổng kết mục tiêu và thực tế của khách hàng.

Các bảng này cho thấy phòng gym đã có quy trình vận hành thật, nhưng dữ liệu đang bị phân tán, khó tổng hợp, khó truy vết lịch sử và tốn thời gian tính toán thủ công.

## 3. Vấn đề cần giải quyết

### 3.1 Quản lý khách hàng còn thủ công

Chủ phòng phải tự kiểm tra khách nào sắp hết hạn, khách nào đã hết hạn và khách nào cần nhắc gia hạn. Việc này hiện phải làm bằng cách xem sổ hoặc Excel hằng ngày.

Vấn đề:

- Dễ bỏ sót khách sắp hết hạn.
- Khó xem lịch sử gia hạn.
- Khó biết tỷ lệ khách mới/khách cũ.
- Khó thống kê khách đã quay lại hoặc không quay lại.

### 3.2 Dữ liệu khách PT chưa được hệ thống hóa

Với khách có PT, phòng gym có theo dõi:

- Số buổi đã tập.
- Số buổi còn lại.
- Ngày tập.
- Bài tập.
- Cân nặng và chỉ số cơ thể.
- Mục tiêu theo tuần.
- Kết quả thực tế.

Tuy nhiên các dữ liệu này đang nằm ở phiếu giấy/Excel, khiến PT phải cập nhật và tổng hợp thủ công.

Vấn đề:

- Khó xem tiến độ dài hạn.
- Khó so sánh mục tiêu ban đầu và kết quả đạt được.
- Khó phát hiện khách bị chững tiến độ.
- Khó tạo báo cáo cuối gói.

### 3.3 Tài chính và mục tiêu kinh doanh chưa tự động

Các bảng thu, chi, lợi nhuận, mục tiêu tháng/năm hiện được tổng hợp thủ công.

Vấn đề:

- Dễ sai số khi nhập tay.
- Khó truy ngược từ báo cáo tổng về giao dịch chi tiết.
- Khó xem doanh thu theo loại dịch vụ.
- Khó so sánh thực tế với mục tiêu.

### 3.4 Excel đang trộn dữ liệu nguồn và báo cáo

Trong Excel hiện tại, nhiều bảng vừa là nơi nhập dữ liệu vừa là nơi tính toán báo cáo.

Ví dụ:

- `Tổng thu` là báo cáo, nhưng cũng đang nhập từng khoản thu.
- `Tài chính năm` là báo cáo tổng hợp.
- `Mục tiêu tháng` vừa là target vừa là bảng theo dõi tiến độ.
- `Tính lương PT` là kết quả tính toán từ nhiều nguồn dữ liệu khác.

Khi chuyển sang hệ thống, cần tách rõ:

- Dữ liệu nguồn cần lưu thật.
- Báo cáo sẽ được hệ thống tự tính.

## 4. Giải pháp đề xuất

Xây dựng một web application quản lý phòng gym theo mô hình modular monolith.

Hệ thống gồm 3 nhóm người dùng chính:

| Nhóm người dùng | Vai trò |
| --- | --- |
| OWNER | Chủ phòng, quản lý toàn bộ hệ thống |
| PT | Quản lý khách được phân công, cập nhật buổi tập và tiến độ |
| MEMBER | Xem thông tin cá nhân, gói tập, bài tập/chương trình được phép |

Không có role lễ tân trong giai đoạn hiện tại vì phòng gym nhỏ, chủ phòng và PT trực tiếp vận hành.

## 5. Phạm vi MVP

MVP tập trung vào các nghiệp vụ quan trọng nhất.

### 5.1 Quản lý member

- Tạo và cập nhật thông tin khách hàng.
- Lưu số điện thoại, sinh nhật, ghi chú, nguồn khách.
- Xem lịch sử gói tập.
- Tìm kiếm theo tên/số điện thoại.

### 5.2 Quản lý gói tập và gia hạn

- Tạo gói tự tập, gói PT, gói giáo án/chương trình.
- Đăng ký gói cho khách.
- Gia hạn gói.
- Lưu lịch sử từng lần đăng ký/gia hạn.
- Tự động xác định khách đang hoạt động, sắp hết hạn, hết hạn.

### 5.3 Dashboard chủ phòng

- Tổng số member.
- Member đang hoạt động.
- Member sắp hết hạn.
- Member đã hết hạn.
- Khách mới trong tháng.
- Doanh thu tháng.
- Công nợ.
- Sinh nhật hôm nay.

### 5.4 Tài chính cơ bản

- Ghi nhận thanh toán.
- Ghi nhận thu hằng ngày.
- Ghi nhận chi phí.
- Theo dõi công nợ.
- Tính tổng thu, tổng chi, lợi nhuận theo tháng/năm.

### 5.5 Quản lý khách PT

- Gán PT cho khách.
- Theo dõi gói PT theo số buổi.
- Ghi nhận buổi PT.
- Ghi nhận buổi ôn tập/thực hành nếu có.
- Cập nhật cân nặng/chỉ số cơ thể.
- Theo dõi mục tiêu tập luyện.

### 5.6 Thư viện bài tập

- Quản lý nhóm cơ.
- Quản lý bài tập.
- Lưu hướng dẫn tập.
- Lưu lỗi sai thường gặp.
- Gắn ảnh minh họa.
- Gắn video YouTube embed.

Video bài tập không upload lên VPS. Hệ thống chỉ lưu URL YouTube/thumbnail để giảm tải server.

## 6. Tối ưu từ Excel sang hệ thống

Hệ thống không bê nguyên các sheet Excel vào database. Thay vào đó, các bảng Excel được chuyển thành dữ liệu nguồn và báo cáo như sau:

| Excel/phiếu hiện tại | Hướng chuyển thành hệ thống |
| --- | --- |
| Quản lý khách hàng tháng | Member, gói tập, lịch sử gia hạn, thanh toán |
| Lịch dạy tuần | Lịch dạy PT |
| Tổng thu | Payment/Income transactions |
| Tổng chi | Expense transactions |
| Tài chính năm | Báo cáo tự sinh từ thu/chi |
| Mục tiêu tháng | Business goals và progress |
| Tính lương PT | Payroll phase sau |
| Theo dõi khách hàng | Body measurements |
| Check-in | PT session/activity logs |
| Chương trình theo mục tiêu | Training programs/weekly progress |

Nguyên tắc:

- Dữ liệu nhập một lần, dùng cho nhiều báo cáo.
- Báo cáo tổng hợp được hệ thống tự tính.
- Không tạo bảng riêng cho từng tháng/năm.
- Lưu lịch sử thay vì ghi đè.

## 7. Kiến trúc kỹ thuật

### 7.1 Công nghệ đề xuất

Frontend:

- React.
- TypeScript.
- Tailwind CSS v4.
- React Router.
- TanStack Query.
- React Hook Form + Zod.
- Recharts.

Backend:

- Java 21.
- Spring Boot 3.
- Spring Web.
- Spring Security.
- Spring Data JPA.
- Bean Validation.
- Flyway.
- Spring Scheduler.
- Caffeine Cache.

Database:

- PostgreSQL.

Deploy:

- VPS Ubuntu.
- Docker Compose.
- Nginx reverse proxy.
- Cloudflare DNS/CDN.
- HTTPS.

### 7.2 Mô hình kiến trúc

```text
Internet
  |
Cloudflare
  |
Nginx
  |
  |-- React static files
  |
  |-- /api -> Spring Boot Modular Monolith
                 |
                 -> PostgreSQL
```

Backend chia module theo domain:

```text
auth
user
member
membership
finance
pt
training
exercise
notification
dashboard
common
```

Mô hình modular monolith phù hợp vì:

- Phòng gym quy mô nhỏ/vừa.
- Dễ deploy trên VPS.
- Dễ bảo trì hơn microservices ở giai đoạn đầu.
- Vẫn có ranh giới module rõ để mở rộng sau này.

## 8. Thiết kế dữ liệu tổng quan

Các nhóm bảng chính:

- User/Role.
- Member.
- Membership.
- Payment/Finance.
- PT schedule/session.
- Body measurement.
- Training program.
- Exercise library.
- Notification/Audit.
- Business goals.

Ước lượng:

- MVP gọn: khoảng 20-24 bảng.
- MVP đầy đủ hơn: khoảng 27 bảng.
- Full phase sau: khoảng 32-40 bảng.

Các enum như `status`, `plan_type`, `payment_method`, `goal_type` sẽ nằm trong code, không tạo thành bảng riêng nếu không cần quản trị động.

## 9. Khả năng tích hợp AI

AI không nằm trong MVP bắt buộc, nhưng hệ thống được thiết kế để thu thập dữ liệu đúng ngay từ đầu.

### 9.1 PT Customer Progress Analysis

Áp dụng cho khách có PT.

Dữ liệu đầu vào:

- Buổi tập.
- Bài tập.
- Cân nặng.
- Chỉ số cơ thể.
- Mục tiêu theo tuần.
- Kết quả thực tế.

Mục tiêu:

- Đánh giá tiến độ khách hàng.
- Phát hiện tiến độ chững lại.
- Gợi ý PT điều chỉnh kế hoạch.
- Hỗ trợ tạo báo cáo cuối gói.

Giai đoạn đầu có thể dùng rule-based scoring. Khi dữ liệu đủ lớn có thể áp dụng ML nhẹ.

### 9.2 PT Drop-off Risk

Áp dụng cho khách PT/chương trình.

Mục tiêu:

- Cảnh báo khách có nguy cơ bỏ ngang chương trình hoặc không mua tiếp gói PT.

Feature có thể dùng:

- Số ngày từ buổi PT gần nhất.
- Tỷ lệ buổi đã dùng.
- Số buổi còn lại.
- Tần suất tập gần đây.
- Progress score.
- Công nợ.
- Lịch sử gia hạn PT.

Model phù hợp sau này:

- Logistic Regression.
- Random Forest.
- XGBoost/LightGBM.

Không cần Deep Learning/GPU ở giai đoạn đầu.

### 9.3 Customer Segmentation

Mục tiêu:

- Phân nhóm khách để hỗ trợ chăm sóc và marketing.

Ví dụ nhóm:

- Khách mới.
- Khách trung thành.
- Khách giá trị cao.
- Khách cần chăm sóc.

Giai đoạn đầu có thể dùng rule-based segmentation. Sau này có thể dùng K-Means nếu dữ liệu đủ.

### 9.4 Renewal Analytics cho khách tự tập

Khách tự tập đại trà không check-in, nên không nên dự đoán churn bằng hành vi đi tập.

Hướng phù hợp:

- Theo dõi sắp hết hạn.
- Theo dõi lịch sử gia hạn.
- Tỷ lệ gia hạn.
- Gợi ý nhóm khách cần chăm sóc.

Đây nên là analytics/rule-based reminder, không gọi là churn ML nếu không có dữ liệu hành vi.

### 9.5 Revenue Forecasting

Khi có đủ dữ liệu doanh thu nhiều tháng, có thể dự báo:

- Doanh thu tháng tới.
- Khả năng đạt mục tiêu tháng/năm.
- Xu hướng tăng/giảm doanh thu.

Model có thể dùng:

- Moving average.
- Linear Regression.
- Random Forest Regression.

## 10. Roadmap triển khai

### Phase 1 - MVP Core

- Auth/RBAC.
- Member management.
- Membership/gia hạn.
- Payment/thu chi cơ bản.
- Dashboard chủ phòng.
- PT session log.
- Body measurement.
- Exercise library với YouTube embed.

### Phase 2 - Vận hành nâng cao

- PT schedule.
- Training program theo tuần.
- Business goals.
- Import dữ liệu Excel/CSV.
- Báo cáo tài chính nâng cao.
- Báo cáo tiến độ khách PT.

### Phase 3 - Payroll và báo cáo nâng cao

- Tính lương PT.
- Hoa hồng dạy khách.
- Hoa hồng sale.
- Thưởng/phạt.
- Export Excel/PDF.

### Phase 4 - AI/Analytics

- PT Progress Analysis.
- PT Drop-off Risk.
- Customer Segmentation.
- Renewal Analytics.
- Revenue Forecasting.

## 11. Giá trị kỳ vọng

Đối với chủ phòng:

- Giảm thời gian theo dõi thủ công.
- Không bỏ sót khách sắp hết hạn.
- Nắm được doanh thu, chi phí, lợi nhuận.
- Theo dõi mục tiêu kinh doanh rõ hơn.

Đối với PT:

- Theo dõi khách được phân công.
- Cập nhật buổi tập và chỉ số dễ hơn.
- Có dữ liệu để đánh giá tiến độ khách.
- Giảm thời gian làm báo cáo thủ công.

Đối với member:

- Xem được thông tin gói tập.
- Xem chương trình/bài tập được phép.
- Có thể theo dõi tiến độ rõ hơn nếu là khách PT.

Đối với hệ thống:

- Dữ liệu được chuẩn hóa.
- Báo cáo được tự động hóa.
- Có khả năng mở rộng sang AI/analytics sau này.
- Dễ deploy và vận hành trên VPS.

## 12. Kết luận

GYM DƯƠNG DOUBLE là một bài toán thực tế, có dữ liệu và quy trình vận hành rõ ràng. Hướng triển khai phù hợp là xây dựng một hệ thống quản lý phòng gym dạng modular monolith, tập trung trước vào member, membership, finance cơ bản và PT tracking.

Các bảng Excel hiện tại không nên được sao chép nguyên trạng vào hệ thống, mà cần được chuẩn hóa thành dữ liệu nguồn và báo cáo tự sinh. Điều này giúp hệ thống gọn hơn, dễ bảo trì hơn và có nền tảng tốt cho các phase sau như payroll, business analytics và AI.

AI có thể tích hợp hiệu quả nhất ở nhóm khách PT, nơi có dữ liệu buổi tập, chỉ số cơ thể và mục tiêu tập luyện. Với khách tự tập không check-in, nên ưu tiên renewal analytics và rule-based reminder thay vì cố xây dựng churn model thiếu dữ liệu hành vi.
