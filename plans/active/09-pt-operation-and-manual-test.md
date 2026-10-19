# 09 - Vận Hành Khách PT Và Kịch Bản Kiểm Thử

Cập nhật lần cuối: 16/10/2026.

## 1. Mục đích

Tài liệu này giải thích cách một phòng gym nhỏ vận hành khách mua gói PT và cách kiểm thử luồng đó trên hệ thống. Ví dụ dùng hội viên Trần Quốc Khánh với gói Tăng Cơ Giảm Mỡ PT Chuẩn 4 tháng, 40 buổi PT và 40 buổi tự ôn.

Mục tiêu là tách rõ ba việc để tránh làm sai số buổi:

1. Đặt lịch: hẹn thời gian.
2. Ghi buổi tập: xác nhận buổi đã diễn ra và trừ lượt.
3. Đo chỉ số/mục tiêu: theo dõi kết quả.

## 2. Quy tắc vận hành

1. Khách tự tập không vào luồng Lịch PT.
2. Khách PT phải có gói PT đang hiệu lực trước khi phân công.
3. Chủ phòng chọn PT sau khi trao đổi với khách. Hệ thống không tự động phân cấp PT.
4. Chủ phòng có thể tự gán mình nếu chủ phòng cũng là PT.
5. Nếu chủ phòng vắng mặt, PT đang trực có thể tự nhận khách PT chưa có assignment cho chính mình.
6. Một phân công phải còn hiệu lực cùng với gói PT; khi gói hết hạn, PT cũ không tiếp tục thao tác được theo phân công đó.
7. Lịch hẹn không trừ buổi. Chỉ buổi đã diễn ra và được ghi nhận mới trừ buổi.
8. Gói 4 tháng có 40 PT + 40 tự ôn không nghĩa khách phải tập 80 ngày liên tục. Thời gian gói cho phép nghỉ ngơi, đổi lịch và linh động trong hạn; hệ thống vẫn chặn sau ngày hết hạn.
9. Khách hết hạn mà còn buổi thì gói cũ không tự động gia hạn trong MVP. Chủ phòng xử lý gia hạn bằng một gói mới nếu cần.

## 3. Năm tab ở trang Lịch PT

### Khách PT

Tổng quan của học viên được chọn:

- PT phụ trách, thông tin liên hệ và ghi chú sức khỏe.
- Gói PT, buổi PT còn lại, lượt tự ôn còn lại và hạn gói.
- Lịch hẹn sắp tới, nhật ký gần nhất, chỉ số gần nhất và mục tiêu.

Dùng tab này để xem tình hình trước khi thao tác. Các nút Lịch hẹn và Ghi buổi tập đưa đến đúng tab tương ứng.

### Lịch dạy

Dùng để đặt cuộc hẹn:

- Chọn học viên đang được chọn ở cột trái.
- Chọn ngày, giờ bắt đầu, giờ kết thúc và ghi chú.
- Hệ thống chặn ngày quá khứ, PT trùng giờ và học viên trùng giờ.
- Xóa/đổi lịch nếu lịch chưa diễn ra.

Đặt lịch thành công chỉ tạo cuộc hẹn SCHEDULED, không trừ buổi PT.

### Ghi buổi tập

Dùng sau khi buổi tập thật sự kết thúc:

- Chọn đúng gói buổi PT của học viên.
- Chọn Buổi kèm 1-1 để trừ một buổi PT.
- Chọn Tự ôn tập để trừ một lượt tự ôn.
- Nhập ngày tập, cân nặng trước buổi nếu có, nội dung buổi tập và nhận xét/dặn dò.
- Nếu có lịch SCHEDULED đúng ngày và PT của gói, form bắt buộc chọn lịch đúng hoặc xác nhận Ghi buổi độc lập. Chọn lịch thì hệ thống đổi trạng thái lịch sang hoàn thành; ghi độc lập không thay đổi lịch nào.

Không ghi buổi cho một cuộc hẹn chưa diễn ra chỉ để giữ chỗ; việc đó làm sai tiến độ của khách.

### Chỉ số

Dùng để ghi baseline lúc tư vấn đầu kỳ và cập nhật định kỳ, thường mỗi 2-4 tuần:

- Ngày đo.
- Cân nặng, vòng ngực, eo, bụng, mông, đùi, tay; chiều cao nếu cần.
- Ghi chú điều kiện đo.

Cần nhập ít nhất một chỉ số. Ngày đo không được ở tương lai.

### Mục tiêu

Dùng để đặt lộ trình theo dõi:

- Loại mục tiêu.
- Mô tả kết quả mong muốn.
- Ngày dự kiến đạt, cân nặng mục tiêu và vòng eo mục tiêu.
- Ghi chú của PT.

Portal hiển thị tiến độ cân nặng/eo khi cả baseline, chỉ số mới nhất và target có đủ dữ liệu.

## 4. Kịch bản thực tế: Trần Quốc Khánh

### Bước 1 - Tiếp nhận và kích hoạt gói

1. OWNER hoặc PT tạo hồ sơ Trần Quốc Khánh.
2. Chọn gói Tăng Cơ Giảm Mỡ PT Chuẩn 4 tháng.
3. Nhập ngày bắt đầu gói.
4. Nhập số tiền thu ngay nếu khách đã trả. Nếu khách chưa trả, để Thu ngay bằng 0; hệ thống chỉ tạo gói và công nợ, không tạo phiếu thu.
5. Nếu khách trả một phần, chọn ngày thu và phương thức của đợt đó. Các đợt sau thu riêng ở màn hình công nợ.

Kết quả mong đợi: có member membership, PT session package 40 PT + 40 tự ôn và debt nếu còn thiếu tiền.

### Bước 2 - Phân công PT

1. Mở Lịch PT, bấm Gán học viên mới.
2. Chọn PT phụ trách và Trần Quốc Khánh.
3. Ngày phân công mặc định theo ngày hiện tại/luồng thao tác; ghi note nếu cần.

Kết quả mong đợi: Khách xuất hiện trong danh sách học viên của PT đó. Khách tự tập không xuất hiện để chọn.

### Bước 3 - Buổi đánh giá đầu kỳ

Trước hoặc ngày buổi đầu, PT:

1. Vào Mục tiêu, đặt mục tiêu Giảm mỡ, cân nặng 80 kg và eo 94 cm theo ví dụ.
2. Vào Chỉ số, ghi baseline: cân nặng 92 kg, eo 102 cm và các vòng đo cần thiết.
3. Vào Lịch dạy, đặt lịch buổi đầu tiên, ví dụ 17/10 lúc 18:00-19:00, kèm note khách cần mang nước.

Kết quả mong đợi: Lịch hẹn xuất hiện ở Lịch PT và Portal của Khánh; buổi còn lại vẫn 40/40.

### Bước 4 - Kết thúc buổi PT đầu tiên

Chỉ sau khi Khánh đã tập xong:

1. Mở Ghi buổi tập.
2. Chọn Buổi kèm 1-1 và đúng gói buổi của Khánh.
3. Chọn ngày tập, nhập nội dung buổi: đánh giá thể lực, hướng dẫn squat, lat pulldown, chest press, cardio nhẹ.
4. Nhập nhận xét về form và dặn dò dinh dưỡng.
5. Chọn lịch 17/10 đã đặt ở bước trước, rồi lưu.

Kết quả mong đợi:

- Nhật ký buổi PT xuất hiện.
- Buổi PT còn lại đổi từ 40 thành 39.
- Lịch liên kết chuyển COMPLETED nếu đã chọn lịch.
- Portal hiển thị nhật ký và tiến độ mới.

### Bước 5 - Buổi tự ôn

Nếu Khánh tự tập theo hướng dẫn:

1. Vào Ghi buổi tập.
2. Chọn Tự ôn tập.
3. Chọn đúng session package và ngày tập thực tế.
4. Nhập note ngắn, ví dụ cardio 20 phút và ôn squat.
5. Lưu.

Kết quả mong đợi: Lượt tự ôn giảm từ 40 thành 39; buổi PT vẫn giữ 39.

### Bước 6 - Theo dõi định kỳ và Portal

1. Sau 2-4 tuần, PT vào Chỉ số và thêm lần đo mới.
2. MEMBER đăng nhập Portal my-progress.
3. Khánh xem được hạn gói, công nợ, phiếu thu, buổi còn lại, lịch sắp tới, số đo, mục tiêu và tiến độ cân nặng/eo.

MEMBER không thể sửa số đo, đặt lịch, kích hoạt gói hay xác nhận thanh toán.

## 5. Checklist kiểm thử PT

| STT | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Gán khách tự tập cho PT | Bị chặn, khách không nằm trong danh sách hợp lệ. |
| 2 | PT tự gán khách PT chưa có assignment cho mình | Thành công nếu gói PT/PT account đều hợp lệ. |
| 3 | PT tự gán khách cho một PT khác | Bị chặn. |
| 4 | Đặt hai lịch trùng giờ cho cùng PT | Bị chặn. |
| 5 | Đặt hai lịch trùng giờ cho cùng học viên | Bị chặn. |
| 6 | Đặt lịch | Chỉ tạo SCHEDULED, không trừ buổi. |
| 7 | Ghi buổi COMPLETED | Trừ đúng một PT session. |
| 8 | Ghi tự ôn | Trừ đúng một practice session, không trừ PT session. |
| 9 | Ghi buổi sai session package/member | Bị chặn. |
| 10 | Ghi buổi trên gói PENDING_PAYMENT, hết hạn, hủy hay hết lượt | Bị chặn. |
| 11 | Ghi buổi/số đo ngày tương lai | Bị chặn. |
| 12 | MEMBER mở Portal | Chỉ thấy dữ liệu của chính mình. |
| 13 | PT xem khách của PT khác sau khi đã được phân công | Bị chặn. |

## 6. Nhịp vận hành đề xuất

Hằng ngày:

1. Kiểm tra lịch hôm nay.
2. Xác nhận lịch với khách qua Zalo/phone nếu cần.
3. Kết thúc buổi nào thì ghi nhận buổi đó ngay, không để dồn nhiều buổi.

Hằng tuần:

1. Kiểm tra học viên còn nhiều buổi nhưng ít lịch.
2. Đặt lịch tuần tới.
3. Nhắc khách sắp hết hạn hoặc còn công nợ.

Mỗi 2-4 tuần:

1. Đo chỉ số.
2. Xem lại mục tiêu.
3. Điều chỉnh giao tiếp, lịch hẹn và dặn dò thực tế bên ngoài hệ thống.

## 7. Cách trình bày ngắn với mentor

Hệ thống tách dữ liệu điều phối, tiêu thụ buổi và kết quả để tránh nhầm lẫn. Lịch hẹn chỉ giữ thời gian. Nhật ký buổi PT chỉ được ghi sau khi buổi thật sự diễn ra và sẽ trừ một lượt. Số đo và mục tiêu theo dõi kết quả theo định kỳ. Portal của học viên là read-only, nên PT và OWNER vẫn giữ quyền kiểm soát nghiệp vụ.
