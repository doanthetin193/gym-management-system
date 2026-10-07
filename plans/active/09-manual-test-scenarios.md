# Kịch bản test thủ công Gym Management System

Tài liệu này dùng để test thủ công các luồng chính trước khi chốt đồ án. Mô hình role hiện tại đã tối ưu theo phòng gym nhỏ:

- `OWNER`: chủ phòng, toàn quyền quản trị.
- `PT`: huấn luyện viên kiêm vận hành cơ bản.
- `MEMBER`: hội viên xem tiến trình cá nhân.
- Khách vãng lai: không đăng nhập, chỉ xem nội dung public.

## Thông tin test chung

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080/api`
- Database dev dùng seed dữ liệu mẫu.
- Sau mỗi nhóm test nên đăng xuất rồi đăng nhập lại bằng tài khoản khác để kiểm tra phân quyền.
- Nếu trình duyệt còn cache giao diện cũ, dùng `Ctrl + F5`.

## 1. Chủ phòng OWNER

### Tài khoản

```text
Email: owner@gymduongdouble.local
Password: ChangeMe@2026
Role: OWNER
```

### Mục tiêu test

OWNER là tài khoản toàn quyền. Chủ phòng phải quản lý được hội viên, gói tập, thanh toán, công nợ, nhắc việc, PT, báo cáo, mục tiêu, thư viện video và cài đặt VietQR.

### Kịch bản 1: Đăng nhập và điều hướng

- Vào `/login`.
- Đăng nhập bằng tài khoản OWNER.
- Kết quả mong đợi:
  - Đăng nhập thành công.
  - Vào được vùng quản trị.
  - Sidebar có các mục: Tổng quan, Hội viên, Gói tập, Nhắc việc, Thanh toán, Báo cáo, Lịch PT, Thư viện, Mục tiêu, Cài đặt.
  - Bấm tên tài khoản mở được hồ sơ cá nhân.

### Kịch bản 2: Dashboard tổng quan

- Vào `/dashboard`.
- Kiểm tra tổng hội viên, hội viên đang hoạt động, hội viên hết hạn, tổng công nợ, doanh thu.
- Kết quả mong đợi:
  - Số liệu tải được.
  - Không trắng màn hình.
  - Biểu đồ/khối thống kê không vỡ layout.

### Kịch bản 3: Quản lý hội viên

- Vào `/members`.
- Tìm kiếm theo tên hoặc số điện thoại.
- Lọc tất cả, đang tập, sắp hết hạn, đã hết hạn.
- Tạo hội viên mới.
- Mở chi tiết hội viên vừa tạo.
- Sửa thông tin hội viên.
- Kết quả mong đợi:
  - Tạo/sửa thành công.
  - Không cho trùng số điện thoại.
  - Danh sách cập nhật lại đúng.
  - Chi tiết hội viên có thông tin cá nhân, gói active, lịch sử gói, gói PT nếu có, công nợ.

### Kịch bản 4: Gán gói, gia hạn và đổi gói

- Mở chi tiết một hội viên.
- Chọn gia hạn/đổi gói.
- Chọn một gói thường, ví dụ `Tự Tập - Full 1 Tháng`.
- Test 2 trường hợp:
  - Trả đủ tiền.
  - Trả thiếu tiền.
- Kết quả mong đợi:
  - Gói mới xuất hiện trong lịch sử gói.
  - Nếu trả đủ, công nợ bằng 0.
  - Nếu trả thiếu, sinh công nợ đúng số còn lại.
  - Nếu hội viên còn hạn, ngày bắt đầu gói gia hạn nối tiếp sau ngày hết hạn cũ.
  - Nếu hội viên đã hết hạn, ngày bắt đầu tính theo ngày kích hoạt mới.

### Kịch bản 5: Gói tập và bảng giá

- Vào `/membership-plans`.
- Kiểm tra danh sách gói.
- Kết quả mong đợi:
  - Có đúng 21 gói active.
  - Đủ 5 nhóm chương trình.
  - Giá, thời hạn, số buổi PT/hướng dẫn đúng theo bảng chuẩn.
  - Tìm kiếm/lọc gói hoạt động đúng.

### Kịch bản 6: Thanh toán và công nợ

- Vào `/payments`.
- Xem tab công nợ.
- Chọn một khoản nợ.
- Lập phiếu thu một phần.
- Lập phiếu thu phần còn lại.
- Kết quả mong đợi:
  - Thanh toán một phần làm giảm số còn nợ.
  - Thanh toán hết chuyển trạng thái công nợ sang đã thanh toán.
  - Lịch sử thanh toán có bản ghi mới.
  - `paidAmount` và `debtAmount` của gói hội viên được đồng bộ.

### Kịch bản 7: VietQR

- Vào `/settings`.
- Cập nhật ngân hàng, số tài khoản, tên chủ tài khoản, tiền tố nội dung chuyển khoản.
- Mở chi tiết hội viên còn nợ.
- Kiểm tra QR thanh toán.
- Kết quả mong đợi:
  - Cấu hình lưu được.
  - QR hiển thị đúng thông tin tài khoản.
  - Số tiền và nội dung chuyển khoản khớp khoản cần thu.

### Kịch bản 8: Nhắc việc Zalo

- Vào `/reminders`.
- Test các nhóm: hết hạn, còn nợ, sinh nhật.
- Copy tin nhắn.
- Copy và mở Zalo.
- Kết quả mong đợi:
  - Tin nhắn soạn sẵn đúng từng loại nhắc việc.
  - Link Zalo mở theo số Zalo/số điện thoại hội viên.
  - Hệ thống chỉ hỗ trợ thủ công, không tự gửi tin nhắn.

### Kịch bản 9: PT, lịch tập và chỉ số

- Vào `/pt-schedule`.
- Kiểm tra lịch PT.
- Vào chi tiết hội viên PT.
- Kiểm tra gói PT, số buổi còn lại, log buổi tập, chỉ số cơ thể, mục tiêu PT.
- Kết quả mong đợi:
  - Dữ liệu PT hiển thị đúng.
  - Chỉ số cơ thể dùng cho hội viên PT, không bắt buộc hội viên tự tập.
  - Khi có chỉ số mới, portal hội viên hiển thị biểu đồ và tiến độ mục tiêu.

### Kịch bản 10: Báo cáo

- Vào `/reports`.
- Kiểm tra tổng hội viên, tổng doanh thu, tổng công nợ, lượt đăng ký/gia hạn.
- Kiểm tra biểu đồ trạng thái hội viên và doanh thu 6 tháng gần nhất.
- Test xuất file nếu chức năng đã có.
- Kết quả mong đợi:
  - Biểu đồ hiển thị rõ.
  - Số liệu khớp tương đối với hội viên, thanh toán và công nợ hiện có.
  - Chức năng xuất file không lỗi.

### Kịch bản 11: Hồ sơ cá nhân và đổi mật khẩu

- Bấm vào tên tài khoản ở sidebar.
- Vào hồ sơ cá nhân.
- Đổi mật khẩu nếu cần test.
- Đăng xuất, đăng nhập lại bằng mật khẩu mới.
- Kết quả mong đợi:
  - Cập nhật mật khẩu thành công.
  - Mật khẩu mới đăng nhập được.

## 2. Huấn luyện viên PT

### Tài khoản

```text
Email: kiet.pt@gymduongdouble.local
Password: ChangeMe@2026
Role: PT
```

```text
Email: tien.pt@gymduongdouble.local
Password: ChangeMe@2026
Role: PT
```

### Mục tiêu test

PT là người hỗ trợ vận hành tại phòng gym nhỏ: xem/tạo/sửa hội viên, xem bảng giá, gia hạn/gán gói, thu tiền, nhắc việc, quản lý lịch PT và chỉ số học viên. PT không được xem báo cáo chủ phòng, mục tiêu kinh doanh, cài đặt hệ thống hoặc quản lý thư viện admin.

### Kịch bản 1: Đăng nhập và kiểm tra menu

- Đăng nhập bằng tài khoản PT.
- Kết quả mong đợi:
  - PT thấy các mục vận hành: Hội viên, Gói tập, Nhắc việc, Thanh toán, Lịch PT.
  - PT không thấy Báo cáo, Mục tiêu, Cài đặt, Thư viện admin.
  - PT vào `/dashboard`, `/reports`, `/settings`, `/goals`, `/owner/exercises` thì bị chặn hoặc chuyển hướng.

### Kịch bản 2: PT quản lý hội viên

- Vào `/members`.
- Tìm kiếm hội viên.
- Tạo hội viên mới.
- Sửa thông tin hội viên.
- Mở chi tiết hội viên.
- Kết quả mong đợi:
  - PT thao tác được nghiệp vụ hội viên cơ bản.
  - Không bị lỗi 403 ở các chức năng được phép.
  - Dữ liệu tạo/sửa phản ánh lại trên danh sách.

### Kịch bản 3: PT gán gói và thu tiền

- Mở chi tiết một hội viên.
- Gán hoặc gia hạn gói.
- Test trả đủ và trả thiếu.
- Vào `/payments`.
- Thu một phần công nợ.
- Kết quả mong đợi:
  - PT lập phiếu thu được.
  - Công nợ cập nhật đúng.
  - Lịch sử thanh toán ghi nhận đúng ngày, phương thức, số tiền.
  - PT không vào được báo cáo doanh thu tổng hợp.

### Kịch bản 4: PT dùng nhắc việc Zalo

- Vào `/reminders`.
- Chọn một nhóm nhắc việc.
- Copy tin nhắn và mở Zalo.
- Kết quả mong đợi:
  - Tin nhắn phù hợp loại nhắc việc.
  - Số điện thoại/Zalo đúng với hội viên.

### Kịch bản 5: PT xem lịch và học viên PT

- Vào `/pt-schedule`.
- Kiểm tra lịch được phân công.
- Kiểm tra trạng thái lịch như `SCHEDULED`, `COMPLETED`, `CANCELLED`.
- Kết quả mong đợi:
  - PT xem được lịch tập.
  - Không thấy dữ liệu quản trị ngoài quyền.

### Kịch bản 6: PT cập nhật log/chỉ số nếu UI cho phép

- Chọn học viên PT.
- Ghi nhận buổi tập hoặc chỉ số cơ thể nếu form đang có trên UI.
- Kết quả mong đợi:
  - Log/chỉ số được lưu đúng.
  - Portal hội viên cập nhật biểu đồ/chỉ số mới.
  - Số buổi PT còn lại không bị trừ sai.

## 3. Hội viên MEMBER

### Tài khoản

```text
Email: duy.member@gymduongdouble.local
Password: Member@2026
Role: MEMBER
Hội viên liên kết: Phạm Minh Duy
Số điện thoại: 0901000004
```

### Mục tiêu test

MEMBER chỉ xem tiến trình cá nhân. Hội viên không tự thao tác quản trị, không tự kích hoạt gói và không tự xác nhận thanh toán.

### Kịch bản 1: Đăng nhập và menu hội viên

- Vào `/login`.
- Đăng nhập bằng tài khoản MEMBER.
- Kết quả mong đợi:
  - Điều hướng về `/my-progress`.
  - Sidebar chỉ có `Tiến trình của tôi`, xem web giới thiệu, thông tin tài khoản và đăng xuất.
  - Topbar đúng ngữ cảnh hội viên.

### Kịch bản 2: Xem hồ sơ hội viên

- Vào `/my-progress`.
- Kiểm tra họ tên, số điện thoại, ngày sinh, trạng thái, nút nhắn Zalo phòng gym.
- Kết quả mong đợi:
  - Thông tin đúng với hội viên liên kết.
  - Các dòng thông tin không bị dính chữ hoặc vỡ layout.

### Kịch bản 3: Xem gói tập, hạn gói và công nợ

- Kiểm tra gói hiện tại, thời hạn còn lại, công nợ, buổi PT còn lại.
- Kết quả mong đợi:
  - Gói hiện tại khớp lịch sử gói.
  - Công nợ khớp dữ liệu thanh toán.
  - Buổi PT còn lại đúng với gói PT.

### Kịch bản 4: Xem biểu đồ chỉ số cơ thể

- Kiểm tra biểu đồ cân nặng, vòng eo, vòng ngực, vòng mông.
- Kết quả mong đợi:
  - Biểu đồ đường hiển thị khi có dữ liệu đo.
  - Chỉ số mới nhất rõ ràng.
  - So sánh với lần trước hiển thị số tăng/giảm.

### Kịch bản 5: Xem tiến độ mục tiêu

- Kiểm tra khối `Mục tiêu hiện tại`.
- Kiểm tra phần `Tiến độ so với mục tiêu`.
- Kết quả mong đợi:
  - Có thanh tiến độ cân nặng nếu có cân nặng mục tiêu.
  - Có thanh tiến độ vòng eo nếu có eo mục tiêu.
  - Hiển thị bắt đầu, hiện tại, mục tiêu, phần trăm và số còn lại.

### Kịch bản 6: Xem lịch PT

- Kiểm tra khối lịch PT.
- Kết quả mong đợi:
  - Hiển thị ngày, giờ, tên PT, ghi chú và trạng thái.
  - Không cho hội viên tự sửa/xoá lịch.

### Kịch bản 7: Xem lịch sử gói và thanh toán

- Kiểm tra lịch sử gói tập, thanh toán và công nợ.
- Kết quả mong đợi:
  - Chỉ xem, không có thao tác quản trị.
  - Nếu còn nợ, có cảnh báo rõ.

### Kịch bản 8: Kiểm tra chặn quyền quản trị

- Khi đang đăng nhập MEMBER, thử truy cập trực tiếp:
  - `/members`
  - `/payments`
  - `/reports`
  - `/settings`
  - `/dashboard`
- Kết quả mong đợi:
  - Không xem được trang quản trị.
  - Bị chuyển hướng về trang hợp lệ hoặc bị chặn quyền.
  - Không lộ dữ liệu hội viên khác.

## 4. Khách vãng lai

### Tài khoản

```text
Không cần đăng nhập.
```

### Mục tiêu test

Khách vãng lai chỉ xem nội dung giới thiệu, bảng giá, thư viện video TikTok và thông tin liên hệ. Không được truy cập vùng quản trị hoặc portal hội viên.

### Kịch bản 1: Xem trang chủ giới thiệu

- Mở `/` ở trình duyệt ẩn danh hoặc sau khi đăng xuất.
- Kiểm tra logo, hero, thông tin phòng gym, bảng giá public, nút liên hệ Zalo, nút đăng nhập.
- Kết quả mong đợi:
  - Trang tải nhanh.
  - Giao diện không vỡ ở desktop và mobile.
  - Nội dung phù hợp phòng gym Dương Double.

### Kịch bản 2: Xem bảng giá public

- Ở trang chủ, kéo tới phần bảng giá.
- Kiểm tra đủ 5 nhóm chương trình.
- Kết quả mong đợi:
  - Giá và mô tả rõ ràng.
  - Không cần đăng nhập vẫn xem được.
  - Nút liên hệ hoặc đăng ký tư vấn mở đúng kênh liên hệ.

### Kịch bản 3: Xem thư viện video public

- Vào `/exercises`.
- Tìm kiếm/lọc video nếu có.
- Mở một video chi tiết `/exercises/:slug`.
- Kết quả mong đợi:
  - Danh sách video tải được.
  - Video/link TikTok hiển thị đúng.
  - Khách có thể xem/chia sẻ mà không cần đăng nhập.
  - Không có thao tác thêm/sửa/xoá video ở public.

### Kịch bản 4: Kiểm tra route cần đăng nhập

- Khi chưa đăng nhập, thử truy cập:
  - `/dashboard`
  - `/members`
  - `/payments`
  - `/reports`
  - `/my-progress`
- Kết quả mong đợi:
  - Hệ thống chuyển về `/login`.
  - Không lộ dữ liệu quản trị hoặc dữ liệu hội viên.

### Kịch bản 5: Đăng nhập từ public

- Từ trang chủ bấm nút đăng nhập/quản trị.
- Đăng nhập bằng OWNER, PT hoặc MEMBER.
- Kết quả mong đợi:
  - OWNER vào vùng quản trị tổng quan.
  - PT vào vùng lịch/vận hành PT.
  - MEMBER vào `/my-progress`.
  - Nếu đã đăng nhập, vào `/login` sẽ tự chuyển về trang phù hợp với role.

## Checklist kết thúc vòng test

- Không còn lỗi trắng màn hình.
- Không còn lỗi font hoặc chữ dính nhau ở các màn chính.
- Không còn route sai quyền.
- Các thao tác tạo/sửa/thu tiền/gia hạn có thông báo rõ.
- Dữ liệu sau thao tác phản ánh đúng ở danh sách, chi tiết, báo cáo và portal hội viên.
- Giao diện desktop ổn; mobile ít nhất không vỡ layout ở trang public, login và các màn chính.
- Không mở thêm scope mới trong vòng polish này, chỉ sửa lỗi phát hiện trong test.
