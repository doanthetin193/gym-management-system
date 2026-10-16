# 01 - Yêu Cầu Sản Phẩm

Cập nhật lần cuối: 16/10/2026.

Tài liệu này mô tả phạm vi MVP đã hoàn thành của Dương Double Gym Management. Code hiện tại là nguồn sự thật; các ý tưởng chưa làm chỉ được ghi ở tài liệu để triển khai trong một giai đoạn mới, không được hiểu là chức năng đang có.

## 1. Mục tiêu sản phẩm

Hệ thống phục vụ phòng gym nhỏ, giúp chủ phòng và PT vận hành một luồng thống nhất:

1. Lưu hồ sơ hội viên và nguồn khách.
2. Bán hoặc gia hạn gói tập.
3. Ghi nhận tiền đã thu, công nợ và báo cáo doanh thu theo ngày thu tiền thực tế.
4. Điều phối khách có gói PT, lịch hẹn, buổi tập, số đo và mục tiêu.
5. Cho hội viên gói PT xem tiến độ cá nhân qua Portal.
6. Hỗ trợ chủ phòng ra quyết định giữ chân khách và doanh thu bằng AI trên dữ liệu tổng hợp đã ẩn danh.

Hệ thống chỉ quản lý nghiệp vụ gym và dòng tiền thu từ gói tập. Chi phí vận hành, lợi nhuận kế toán, lương PT và thu chi ngoài hệ thống không nằm trong scope MVP.

## 2. Người dùng và quyền vận hành

### OWNER - Chủ phòng

- Quản lý toàn bộ hội viên, gói tập, phiếu thu, công nợ và cấu hình VietQR.
- Tạo, khóa, mở khóa, đổi vai trò và đặt lại mật khẩu tài khoản PT.
- Cấp, khóa, đặt lại mật khẩu và xóa tài khoản Portal của hội viên.
- Chọn PT phụ trách hoặc điều chuyển học viên PT.
- Xem Dashboard, Báo cáo, xuất XLSX, đồng bộ Google Sheet và gọi AI Advisor.
- Quản lý thư viện video TikTok.
- Chủ phòng có thể đồng thời có role PT và trực tiếp dạy học viên.

### PT - Huấn luyện viên

- Tạo, cập nhật hồ sơ hội viên trong phạm vi được phép.
- Bán gói và ghi nhận thu tiền cho khách trong phạm vi dữ liệu PT được phép thao tác.
- Tự nhận một khách có gói PT hợp lệ chưa được phân công; không tự gán khách cho PT khác.
- Xem học viên đang được phân công, đặt lịch, ghi buổi PT, ghi tự ôn tập, cập nhật số đo và mục tiêu.
- Không được xem hoặc sửa lương, tỷ lệ dạy, hoa hồng, cấu hình hệ thống, báo cáo OWNER hay thư viện quản trị.

### MEMBER - Hội viên

- Đăng nhập Portal tại đường dẫn my-progress.
- Chỉ xem dữ liệu của chính mình: gói hiện hiệu lực, công nợ, lịch sử thu tiền, lịch PT, buổi PT còn lại, số đo, mục tiêu và tiến độ.
- Không tự mua/gia hạn gói, không tự xác nhận thanh toán và không sửa dữ liệu vận hành.

### Khách vãng lai

- Xem trang giới thiệu, bảng giá, thư viện TikTok public và thông tin liên hệ.

## 3. Phạm vi chức năng đã hoàn thành

### 3.1 Hội viên

- Tạo, sửa, tìm kiếm và lọc hội viên theo trạng thái gói.
- Lưu tên, số điện thoại, ngày sinh, giới tính, địa chỉ, Zalo, nguồn khách và ghi chú.
- Chuẩn hóa số điện thoại Việt Nam khi lưu và khi đăng nhập bằng số điện thoại; một số điện thoại chỉ có một hồ sơ.
- Trang chi tiết tổng hợp lịch sử gói, thu tiền, công nợ, gói buổi PT và Portal.

### 3.2 Gói tập và gia hạn

- Quản lý bảng giá, bật/tắt gói đang bán và giữ lịch sử các gói đã bán.
- Gói inactive không được bán mới.
- Lượt đăng ký lưu giá bán thực tế, giảm giá, ngày bắt đầu, ngày kết thúc, người bán và ghi chú.
- Gia hạn sớm không làm mất gói đang hiệu lực: hệ thống ưu tiên gói có hiệu lực trong ngày khi hiển thị trạng thái hội viên.
- Gói PT tạo gói buổi riêng để theo dõi buổi PT và buổi tự ôn.

### 3.3 Thu tiền, công nợ và VietQR

- Khi kích hoạt gói, người dùng có thể thu ngay một phần, thu đủ, hoặc chưa thu.
- Nếu thu ngay lớn hơn 0, hệ thống tạo một phiếu thu với ngày thu và phương thức thu đã chọn.
- Nếu thu ngay bằng 0, không tạo phiếu thu; ngày thu và phương thức thu không có ý nghĩa trong giao dịch đó.
- Phần chưa thu tạo công nợ. Mỗi lần thu nợ sau đó tạo một phiếu thu riêng, nên một gói có thể có nhiều lần thu và nhiều phương thức thu khác nhau.
- Doanh thu báo cáo dựa trên payment_date, không dựa trên ngày bắt đầu gói. Ngày thu chỉ được phép là hôm nay hoặc quá khứ.
- VietQR chỉ tạo thông tin chuyển khoản để thu thủ công; không có webhook hay tự động đối soát ngân hàng.

### 3.4 Vận hành PT

- Chỉ hội viên có gói PT đang hiệu lực mới đủ điều kiện được phân công PT. Khách tự tập không xuất hiện trong luồng gán PT.
- Phân công phụ thuộc vào PT đang hoạt động, ngày bắt đầu/kết thúc và gói PT còn hiệu lực.
- Lịch hẹn là điều phối thời gian, không trừ buổi và không phát sinh doanh thu.
- Chỉ khi buổi dạy đã diễn ra, PT mới ghi nhật ký buổi PT và trừ một buổi PT.
- Tự ôn tập và buổi hướng dẫn được ghi riêng và trừ đúng loại lượt của gói.
- Hệ thống chặn ghi nhận ở ngày tương lai, ngoài hạn gói, trên gói chờ thanh toán, gói đã hủy/hết hạn, hết lượt, sai khách, sai gói và trùng buổi.
- PT có thể nhập số đo cơ thể và mục tiêu; số đo và goal chỉ dùng để theo dõi tiến độ, không gọi AI phân tích chỉ số cá nhân.

### 3.5 Portal hội viên

- OWNER cấp tài khoản Portal cho hội viên cần theo dõi tiến độ; kịch bản sử dụng chính là khách gói PT.
- Portal hiển thị dữ liệu đồng bộ từ nghiệp vụ PT: gói, hạn, buổi còn lại, lịch hẹn, nhật ký PT, số đo, mục tiêu, phiếu thu và công nợ.
- Endpoint cấp Portal hiện cần số điện thoại và chưa ràng buộc plan_type PT. Đây là chủ động để OWNER có thể cấp quyền xem cho hội viên cần thiết; quy trình vận hành ưu tiên cấp cho khách PT.
- Portal là chế độ chỉ đọc. Mọi thay đổi về gói, tiền và lịch tập do OWNER/PT xử lý.

### 3.6 Nhắc việc, báo cáo và dữ liệu

- Nhắc việc gia hạn, công nợ và sinh nhật; hệ thống tạo nội dung để nhân viên copy hoặc mở Zalo thủ công.
- Dashboard cho OWNER và trang Báo cáo theo dõi hội viên, doanh thu, công nợ, xu hướng doanh thu và trạng thái gói.
- Xuất XLSX cho hội viên, lịch sử thu tiền, công nợ, bảng giá và bản sao lưu nhiều sheet.
- Đồng bộ Google Sheet qua Apps Script URL và token do chủ phòng cấu hình.

### 3.7 AI Cố vấn Giữ chân và Doanh thu

- OWNER chủ động bấm phân tích theo tháng trên trang Báo cáo.
- Rule nội bộ nhận diện nhóm sắp hết hạn, đã hết hạn, công nợ, khách PT còn nhiều buổi gần hết hạn và khách PT gián đoạn.
- Groq chỉ nhận số liệu tổng hợp và segment ẩn danh; không gửi tên, số điện thoại, Zalo, email, địa chỉ hay giao dịch cá nhân.
- Kết quả gồm tổng quan sức khỏe phòng gym, rủi ro, cơ hội doanh thu, kế hoạch 7 ngày và chỉ số cần theo dõi.
- Nếu AI provider lỗi, hệ thống trả về kết quả rule-based để luồng Báo cáo vẫn hoạt động.

### 3.8 Thư viện video TikTok

- OWNER quản lý danh mục và bài tập/video: tên, slug, mô tả, hướng dẫn, lỗi thường gặp, độ khó, nhóm cơ, dụng cụ, TikTok URL và trạng thái hiển thị.
- Khách vãng lai xem thư viện public và trang chi tiết.
- TikTok chỉ được nhúng để xem; MVP không quản lý lượt xem, tác giả TikTok hay phân tích hiệu suất video.

## 4. Bảo mật đã có trong MVP

- JWT stateless, token có thời hạn và token version.
- Đổi/reset mật khẩu thu hồi hiệu lực JWT cũ ngay lập tức.
- Đăng nhập giới hạn 5 lần sai trong 15 phút theo cả IP và tài khoản; frontend hiển thị thời gian chờ.
- Endpoint nhạy cảm có giới hạn theo người dùng: đổi mật khẩu, tạo/reset tài khoản, Portal và AI Advisor.
- Mật khẩu tối thiểu 8 ký tự, có chữ và số, không trùng email, số điện thoại hay mật khẩu cũ.
- API có security headers, CSP cơ bản, chặn iframe, no-cache cho dữ liệu JWT/API và CORS local dev rõ ràng.
- Lưu lastLoginAt sau đăng nhập thành công.

## 5. Ngoài phạm vi đã chốt

- Deploy production, domain, VPS, Docker và quy trình vận hành production.
- Nhập Excel/CSV tự động.
- Thanh toán online, webhook ngân hàng và Zalo API gửi tin tự động.
- Quản lý chi phí, lợi nhuận, payroll, hoa hồng tính lương và mục tiêu vận hành.
- Training program/LMS theo tuần, chatbot tự do, AI soạn giáo án và AI phân tích chỉ số cá nhân.
- Ứng dụng mobile native, audit log đầy đủ và soft-delete hoàn chỉnh.

## 6. Tiêu chí nghiệm thu MVP

- OWNER hoàn thành được luồng tạo hội viên, bán gói, thu nợ, xem báo cáo và cấu hình tài khoản.
- PT chỉ truy cập được học viên/giao dịch trong phạm vi phân quyền và ghi nhận đúng buổi tập thực tế.
- MEMBER chỉ xem dữ liệu của mình.
- Dữ liệu doanh thu về đúng kỳ theo ngày thu tiền thực tế; công nợ và phiếu thu nhiều đợt khớp nhau.
- Ghi nhận PT không làm sai số buổi hoặc thời hạn gói.
- AI Advisor ẩn danh có fallback.
- Backend test, frontend lint và frontend build được chạy trong các đợt chốt tính ổn định.

Tài liệu đối chiếu hiện trạng chi tiết: 08-current-implementation-alignment.md.
