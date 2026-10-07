# 01 - YÊU CẦU SẢN PHẨM

## 1. Mục tiêu sản phẩm

GYM DƯƠNG DOUBLE là hệ thống web quản lý phòng gym nhỏ, thay thế quy trình thủ công bằng Excel, sổ và phiếu giấy.

Mục tiêu cốt lõi:

- Theo dõi khách sắp hết hạn/hết hạn mà không phải dò sổ hằng ngày.
- Lưu lịch sử đăng ký/gia hạn gói.
- Ghi nhận thu, chi, công nợ và tự động tổng hợp tài chính.
- Quản lý khách PT/chương trình: số buổi, check-in, chỉ số cơ thể, mục tiêu và tiến độ.
- Quản lý thư viện bài tập/video TikTok public để học viên xem và chia sẻ.
- Tạo nền tảng dữ liệu sạch cho báo cáo, payroll và AI sau này.

## 2. Bối cảnh thực tế

Phòng gym nhỏ, khoảng 50-70 khách mỗi tháng. Tuy vậy, dữ liệu khách mới/cũ tích lũy qua nhiều tháng/năm khá nhiều.

Mô hình vận hành hiện tại:

- Không có lễ tân riêng.
- Người dùng chính là chủ phòng, PT và member.
- Các nghiệp vụ nhân sự/lễ tân trong requirement gốc được tối ưu theo quy mô nhỏ: MVP chỉ cần hồ sơ PT và gán khách; chấm công, payroll, doanh số/hoa hồng PT để phase sau.

Chủ phòng đang có 10 mẫu Excel/phiếu giấy chính:

| STT | Tài liệu thủ công | Ý nghĩa |
| --- | --- | --- |
| 1 | Lịch dạy PT | Lịch theo giờ/ngày trong tuần |
| 2 | Quản lý khách hàng tháng | Khách, hạn gói, sinh nhật, chi phí |
| 3 | Tính lương PT | Lương cố định, dạy khách, sale, thưởng/phạt |
| 4 | Mục tiêu tháng | Mục tiêu doanh thu/khách theo 3 giai đoạn |
| 5 | Tài chính năm | Tổng thu, tổng chi, lợi nhuận theo tháng |
| 6 | Thu hằng ngày | Thu theo tự tập, giáo án, sinh viên, PT |
| 7 | Tổng chi | Chi phí nhà, điện, nước, marketing, PT |
| 8 | Theo dõi khách theo tuần | Chỉ số cơ thể |
| 9 | Check-in | Buổi PT và buổi ôn tập |
| 10 | Chương trình theo mục tiêu | Mục tiêu tuần, thực tế, kết quả |

## 3. Nhóm người dùng

### OWNER

Chủ phòng, toàn quyền quản lý:

- Khách hàng.
- Gói tập.
- Thanh toán, thu chi, công nợ.
- PT và lịch dạy.
- Dashboard/báo cáo.
- Bài tập/nội dung.
- Cấu hình hệ thống.

### PT

Personal Trainer:

- Xem khách được phân công.
- Xem lịch dạy.
- Cập nhật buổi PT.
- Cập nhật chỉ số cơ thể.
- Cập nhật tiến độ/mục tiêu.

### MEMBER

Khách hàng:

- Xem thông tin cá nhân.
- Xem gói hiện tại/ngày hết hạn.
- Xem thư viện bài tập/video public.

## 4. Phạm vi MVP

### 4.1 Bắt buộc có trong MVP

- Auth/RBAC cho OWNER, PT, MEMBER.
- Quản lý member.
- Quản lý gói tập.
- Đăng ký/gia hạn gói.
- Theo dõi khách sắp hết hạn/hết hạn.
- Thống kê khách mới, khách cũ/tái tục theo tháng.
- Ghi nhận payment.
- Ghi nhận thu/chi cơ bản.
- Theo dõi công nợ cơ bản.
- Dashboard OWNER.
- Gán PT cho khách.
- Gói PT theo số buổi.
- PT session/check-in.
- Body measurement.
- Mục tiêu tập luyện cơ bản.
- Public TikTok exercise library.
- Audit log thao tác quan trọng.
- Lịch dạy PT cơ bản dạng list/tuần.
- Nhắc việc cơ bản trong hệ thống/dashboard: sắp hết hạn, sinh nhật, công nợ, khách PT còn ít buổi.

### 4.2 Cuối MVP, có thể hoãn nếu thiếu thời gian

- PT schedule nâng cao dạng calendar kéo-thả.
- Training program theo tuần.
- Business goals theo tháng.
- Báo cáo tiến độ khách PT.
- Notification nâng cao/push/email/Zalo.

### 4.3 Không làm trong MVP

- Payroll PT đầy đủ.
- Commission rules phức tạp.
- Chấm công/HR đầy đủ.
- Import Excel/CSV dữ liệu cũ.
- Auto Zalo.
- Payment online.
- AI/ML thật.
- Computer Vision.
- App mobile native.

## 5. Requirement chi tiết theo nghiệp vụ

### 5.1 Member Management

Chức năng:

- Tạo/sửa/xem member.
- Tìm kiếm theo tên/số điện thoại.
- Lọc theo trạng thái gói.
- Lưu sinh nhật.
- Lưu ghi chú.
- Xem lịch sử gói.
- Xem lịch sử payment.

Thông tin chính:

- Họ tên.
- Số điện thoại.
- Zalo phone.
- Sinh nhật.
- Giới tính.
- Địa chỉ.
- Nguồn khách.
- Ghi chú.

Acceptance:

- OWNER tạo được member mới.
- OWNER tìm được khách bằng số điện thoại.
- OWNER xem được khách nào sắp hết hạn trong 7 ngày.
- Hệ thống không ghi đè lịch sử gói cũ khi khách gia hạn.

### 5.2 Membership/Renewal

Chức năng:

- Tạo gói tập.
- Bán gói cho khách.
- Gia hạn gói.
- Tính ngày hết hạn.
- Lưu giá thực tế, giảm giá, đã trả, còn nợ.
- Lưu người sale/phụ trách bán gói nếu có để sau này tính hoa hồng sale.

Loại gói:

- Tự tập.
- Giáo án/Hướng Dẫn.
- PT. Trong gói PT có phân cấp `PT chính` hoặc `PT mới`.
- Khác.

Ghi chú nghiệp vụ:

- `Giáo án/Hướng Dẫn` là khách từng tập PT, sau đó mua giáo án để tự duy trì tập. Chủ phòng/PT viết giáo án và hỗ trợ khi khách gặp vấn đề.
- `PT chính` là gói PT theo bảng giá chuẩn của phòng, hiện do chủ phòng phụ trách.
- `PT mới` là gói PT do PT mới/học việc phụ trách, giá bằng khoảng 65% gói PT chính. Hiện PT mới là Kiệt.
- Không dùng nhóm `Sinh viên` như một loại doanh thu riêng trong hệ thống; trong file Excel cũ, cột này thực chất là khoản thu của `PT mới`.

Acceptance:

- Gói đã bán không bị xóa cứng.
- Gia hạn tạo record mới.
- Dashboard hiển thị đúng active/sắp hết hạn/hết hạn.

### 5.3 Finance

Chức năng:

- Ghi nhận thu hằng ngày.
- Ghi nhận chi phí.
- Theo dõi công nợ.
- Tự tính tổng thu/tổng chi/lợi nhuận.
- Xem tài chính theo ngày/tháng/năm.

Mapping từ Excel:

- `TỔNG THU` -> payment/income.
- `TỔNG CHI` -> expense.
- `TỔNG 2026` -> report tài chính năm.

Nhóm thu cần hỗ trợ:

- Tự tập.
- Giáo án/Hướng Dẫn.
- PT chính.
- PT mới.
- Thu khác.

Nhóm chi cần hỗ trợ:

- Nhà/mặt bằng.
- Quảng cáo/marketing.
- Điện.
- Nước.
- Rác.
- Wifi.
- Nước lọc.
- Tiền PT/nhân sự.
- Thưởng lễ/thưởng khác.
- Chi khác.

Acceptance:

- OWNER nhập một payment và dashboard doanh thu thay đổi.
- OWNER nhập một expense và lợi nhuận được tính lại.
- Không cần nhập tay bảng tổng năm.

### 5.4 PT Tracking

Chức năng:

- Gán PT cho khách.
- Tạo gói PT theo số buổi.
- Ghi nhận từng buổi PT.
- Ghi nhận buổi ôn tập/thực hành.
- Theo dõi số buổi còn lại.
- Ghi chú buổi tập.

Quy tắc gói PT hiện tại:

- Gói 1: 20 buổi PT + 20 buổi Ôn tập.
- Gói 2: 40 buổi PT + 40 buổi Ôn tập.
- Gói 3: 60 buổi PT + 60 buổi Ôn tập.
- Buổi Ôn tập đi kèm gói PT để khách tự ôn lại bài, không có PT trực tiếp.
- Phiếu `CHECK IN` 24 dòng chỉ là mẫu in sẵn, không đại diện cho số buổi của mọi gói.

Acceptance:

- PT chỉ thấy khách được phân công.
- OWNER thấy tất cả khách PT.
- Khi thêm buổi PT, số buổi đã dùng/còn lại cập nhật đúng.

### 5.5 Body Measurement

Chức năng:

- Lưu chiều cao, cân nặng, vòng ngực, eo, bụng, mông, đùi, tay.
- Xem lịch sử đo.
- Hiển thị biểu đồ tiến độ cơ bản.

Acceptance:

- PT nhập được chỉ số theo ngày.
- Member/PT/OWNER xem được tiến độ theo thời gian.

### 5.6 Training Program

Trạng thái:

- Không triển khai trong Sprint 5.
- Không biến hệ thống thành LMS/khóa học theo tuần vì không sát nhu cầu hiện tại của chủ phòng.
- Tiến độ PT hiện xử lý bằng `pt_session_logs`, `member_activity_logs`, `body_measurements` và `pt_goals`.
- Nếu sau này chủ phòng thật sự cần giáo án cá nhân hóa theo tuần cho từng khách PT thì mới mở phase riêng.

Acceptance:

- Sprint 5 không tạo màn Training Program theo tuần.
- Không có weekly target/actual trong Sprint 5.
- Không có khóa nội dung theo VIP/premium trong Sprint 5.

### 5.7 Business Goals

Chức năng:

- Tạo mục tiêu tháng.
- Theo dõi tài chính: doanh thu, lợi nhuận.
- Theo dõi số khách member/tự tập.
- Theo dõi khách hướng dẫn/giáo án.
- Theo dõi khách PT mới.
- Theo dõi khách PT chính.
- Theo dõi tiến độ theo giai đoạn ngày 1-10, 11-20, 21-hết tháng.

Acceptance:

- OWNER tạo được mục tiêu theo tháng.
- Hệ thống tính được actual từ dữ liệu nguồn nếu có.
- Các nhóm `Khách Hướng Dẫn/Giáo án`, `Khách PT mới`, `Khách PT chính` được cấu hình rõ để hệ thống tính actual đúng.

### 5.8 Public TikTok Exercise Library

Chức năng:

- Quản lý nhóm bài tập/chủ đề như Ngực, Lưng - Xô, Chân - Mông, Vai - Tay, Bụng - Core, Cardio, Phục hồi.
- Quản lý bài tập/video hướng dẫn dạng public.
- Lưu mô tả ngắn, lưu ý kỹ thuật, lỗi sai thường gặp nếu có.
- Gắn link TikTok của chủ phòng, ưu tiên kênh `@duong.double`.
- Không hỗ trợ provider video khác trong Sprint 5.
- Không upload/stream video bằng VPS.
- Không phân quyền member/VIP/premium; ai có link hoặc vào web đều xem được.
- Hỗ trợ copy link/chia sẻ để gửi cho học viên và kéo tương tác mạng xã hội.

Acceptance:

- Người dùng vãng lai không cần đăng nhập vẫn xem được thư viện.
- Owner thêm/sửa/xuất bản được bài tập bằng link TikTok.
- Trang chi tiết bài tập hiển thị được TikTok embed hoặc fallback nút mở TikTok.
- Có filter/tìm kiếm cơ bản theo nhóm cơ/chủ đề và từ khóa.
- Có nút copy link/chia sẻ.

## 6. Dashboard cần có

### OWNER Dashboard

- Tổng member.
- Active member.
- Sắp hết hạn.
- Đã hết hạn.
- Khách mới tháng này.
- Khách cũ/tái tục tháng này.
- Doanh thu tháng.
- Tổng chi tháng.
- Lợi nhuận tháng.
- Công nợ.
- Sinh nhật hôm nay.
- Khách PT còn ít buổi.

### PT Dashboard

- Lịch hôm nay.
- Khách được phân công.
- Khách còn ít buổi.
- Khách lâu chưa có buổi PT.
- Cập nhật nhanh session/body measurement.

### MEMBER Dashboard

- Gói hiện tại.
- Ngày hết hạn.
- Lịch sử thanh toán cơ bản.
- Bài tập/chương trình được phép.

## 7. Quy tắc ngoài phạm vi

- Payroll/lương PT không nằm trong MVP, nhưng công thức đã chốt để thiết kế sẵn đường mở rộng.
- Không làm churn ML cho khách tự tập vì không có check-in đại trà.
- Không làm auto Zalo nếu chưa xác minh API/chính sách.
- Không làm streaming video.
- Không import dữ liệu Excel cũ trong MVP vì chủ phòng muốn bắt đầu bằng dữ liệu mới.

## 8. Thông tin nghiệp vụ đã chốt thêm

- `Khách Hướng Dẫn` hay `Khách Tập Giáo Án` là khách từng tập PT, sau đó mua giáo án để tự duy trì. PT/chủ phòng chỉ hỗ trợ khi khách gặp vấn đề.
- Khách Giáo Án vẫn check-in theo số buổi của gói giáo án: 30, 60 hoặc 90 buổi.
- Khách tự tập không check-in.
- `PT chính` là PT đạt chuẩn phòng tập, bán theo bảng giá chính. Hiện PT chính là chủ phòng.
- `PT mới` là PT mới học việc xong, kinh nghiệm ít hơn, bán gói bằng khoảng 65% giá PT chính. Hiện PT mới là Kiệt.
- Cột `Sinh viên` trong bảng thu Excel thực chất là khoản thu gói PT mới, không phải nhóm sinh viên/discount riêng.
- Gói PT hiện tại gồm `20 PT + 20 Ôn tập`, `40 PT + 40 Ôn tập`, `60 PT + 60 Ôn tập`.
- Lương dạy PT chỉ tính trên số buổi PT đã dạy, không tính buổi Ôn tập.
- Công thức lương dạy PT: `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale PT: `10% * số tiền khách đã thanh toán`.
- Chủ phòng không yêu cầu import dữ liệu cũ từ Excel ở MVP; hệ thống bắt đầu với dữ liệu mới.

Thông tin đã làm rõ:

- `Kiệt` là tên nhân sự/PT.
- `Tiên PT` là khoản liên quan chị Tiên với vai trò PT.
- `Tiên MKT` là khoản liên quan chị Tiên với vai trò marketing.
- Các khoản chi theo tên người hoặc vai trò không nên hard-code; OWNER tự tạo danh mục chi hoặc ghi chú khi nhập expense.

## 9. Tiêu chí hoàn thành MVP

MVP hoàn thành khi:

- OWNER thay được bảng quản lý khách/gói bằng hệ thống.
- OWNER xem được khách hết hạn/sắp hết hạn.
- OWNER nhập được thu/chi và xem lợi nhuận cơ bản.
- PT nhập được buổi tập và chỉ số.
- Public TikTok exercise library xem/chia sẻ được.
- Hệ thống deploy được trên VPS.

## 10. Cập nhật theo implementation hiện tại

Sau giai đoạn nâng cấp UI và bổ sung nghiệp vụ, tài liệu chốt hiện trạng là `plans/active/10-current-implementation-alignment.md`.

Các thay đổi sản phẩm đã được chấp nhận vào scope hiện tại:

- Hệ thống không còn role `STAFF`; PT kiêm vận hành cơ bản khi chủ phòng không trực.
- Có portal hội viên `/my-progress` cho MEMBER xem tiến trình cá nhân, chỉ số cơ thể, mục tiêu, gói hiện tại, công nợ và lịch sử thanh toán.
- OWNER/PT có thể tạo tài khoản portal nhanh cho hội viên, nhưng hội viên chỉ xem dữ liệu và liên hệ Zalo thủ công, không tự mua gói hay xác nhận thanh toán online.
- OWNER quản lý tài khoản PT tại `/settings`.
- VietQR là công cụ hỗ trợ chuyển khoản thủ công, không phải payment gateway tự động.
- Báo cáo hỗ trợ xuất `.xlsx`, full backup nhiều sheet và đồng bộ Google Sheet qua Apps Script/token.
- Nhắc việc Zalo là bán tự động: hệ thống soạn/copy tin nhắn và mở Zalo, không tự gửi tin.
- Thư viện video public chỉ hỗ trợ TikTok trong scope hiện tại.
