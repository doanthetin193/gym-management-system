# DATA BONUS - GHI CHÚ NHÁP TỪ FILE EXCEL THỦ CÔNG

Tài liệu này dùng để ghi nhận tạm các bảng Excel/thao tác thủ công mà chủ phòng gym đang dùng.  
Mục tiêu hiện tại là đọc trường dữ liệu, hiểu nghiệp vụ và note lại ý tưởng tối ưu.  
Đã đủ 10 ảnh, nhưng chưa cập nhật vào các file kế hoạch chính cho đến khi tổng hợp/thiết kế chính thức.

Lưu ý đọc tài liệu:

- Phần `Thông tin nghiệp vụ đã được chủ phòng giải đáp` bên dưới là thông tin đã chốt mới nhất.
- Các mục `Câu hỏi cần hỏi thêm` ở từng ảnh là ghi chú tại thời điểm phân tích ban đầu, có thể đã được giải đáp ở phần trên.
- Khi có mâu thuẫn, ưu tiên `plans/active/` và phần thông tin đã giải đáp trong file này.

## Trạng thái thu thập

- Tổng số ảnh dự kiến: 10.
- Đã nhận hiện tại: 10 ảnh.
- Còn thiếu: 0 ảnh.
- Đã đủ ảnh để tổng hợp nháp toàn bộ field Excel.
- Bước tiếp theo mới cập nhật vào các file kế hoạch chính nếu cần.

## Thông tin nghiệp vụ đã được chủ phòng giải đáp

- `Khách Hướng Dẫn` còn gọi là `Khách Tập Giáo Án`: khách đã từng tập PT, sau đó muốn duy trì việc tập. Chủ phòng/PT viết giáo án cho khách tự tập và hỗ trợ khi khách gặp vấn đề.
- `Giáo án` trong bảng thu chính là nhóm `Khách Hướng Dẫn/Tập Giáo Án`.
- Khách Giáo Án vẫn check-in theo gói 30, 60 hoặc 90 buổi.
- Khách tự tập không cần check-in.
- `PT chính`: PT đạt tiêu chuẩn của phòng, tập cho khách theo bảng giá chính. Hiện PT chính là chủ phòng.
- `PT mới`: PT mới học việc xong, kinh nghiệm ít hơn, tập cho khách với chi phí khoảng 65% gói PT chính. Hiện PT mới là Kiệt.
- Cột `Sinh viên` trong bảng thu Excel thực chất là khoản thu từ gói `PT mới`, không phải gói sinh viên/discount riêng.
- Phiếu `CHECK IN` 24 dòng chỉ là mẫu in sẵn, không cố định số buổi của mọi gói.
- Gói PT hiện tại gồm: `20 PT + 20 Ôn tập`, `40 PT + 40 Ôn tập`, `60 PT + 60 Ôn tập`.
- `Ôn tập` là buổi đi kèm buổi PT để khách tự ôn lại bài, không có PT trực tiếp.
- Lương dạy PT chỉ tính theo số buổi PT đã dạy, lấy từ check-in; không tính buổi Ôn tập.
- Công thức lương dạy PT: `số buổi PT đã dạy * 30% * (giá gói / tổng số buổi PT của gói)`.
- Hoa hồng sale PT: `10% * số tiền khách đã thanh toán`.
- MVP không cần nhập dữ liệu cũ từ Excel; chủ phòng muốn bắt đầu bằng dữ liệu mới.

## 1. Quản lý lịch dạy PT

Tên bảng trong ảnh:

```text
LỊCH DẠY TUẦN ........
```

### Cấu trúc hiện tại trên Excel

Cột:

- Giờ.
- T2.
- T3.
- T4.
- T5.
- T6.
- T7.
- CN.

Khung giờ đang có:

- 5h.
- 5h30.
- 6h.
- 6h30.
- 7h.
- 7h30.
- 8h.
- 8h30.
- 9h.
- 9h30.
- 14h.
- 14h30.
- 15h.
- 15h30.
- 16h.
- 16h30.
- 17h.
- 17h30.
- 18h.
- 18h30.
- 19h.

### Ý nghĩa nghiệp vụ

Đây là bảng lịch dạy tuần của PT, theo dạng ma trận:

```text
time_slot x weekday
```

Mỗi ô nhiều khả năng sẽ ghi:

- Tên khách.
- Tên PT.
- Nội dung/buổi tập.
- Trạng thái buổi: đã dạy, hủy, vắng, đổi lịch.

### Hướng tối ưu thành hệ thống

Nên chuyển thành module `PT Schedule`.

Entity gợi ý:

```text
pt_schedules
  id
  pt_user_id
  member_id
  schedule_date
  start_time
  end_time
  status
  note
  created_at
  updated_at
```

Status gợi ý:

- SCHEDULED.
- COMPLETED.
- CANCELLED.
- MISSED.
- RESCHEDULED.

### Câu hỏi cần hỏi thêm

- Một ô lịch có thể có nhiều khách không?
- Có nhiều PT cùng dạy một khung giờ không?
- Lịch này là lịch cố định tuần hay tạo mới từng tuần?
- Nếu khách nghỉ/đổi lịch thì hiện tại ghi như thế nào?
- Có cần tính lương PT dựa trên lịch đã hoàn thành không?

## 2. Quản lý khách hàng hằng tháng

Tên bảng trong ảnh:

```text
QUẢN LÝ KHÁCH HÀNG THÁNG 9
```

### Cấu trúc hiện tại trên Excel

Cột:

- Ngày.
- Thời hạn.
- Khách hàng.
- Số điện thoại.
- Sinh nhật.
- Gói tập.
- Chi phí.
- Ghi chú.

Các dòng ngày:

- 1.
- 2.
- 3.
- ...
- Theo từng ngày trong tháng.

### Ý nghĩa nghiệp vụ

Bảng này có vẻ đang dùng để quản lý khách theo tháng, có thể gồm:

- Khách đăng ký mới trong ngày.
- Khách gia hạn trong ngày.
- Khách hết hạn theo ngày.
- Thông tin gói và chi phí.
- Ghi chú chăm sóc khách.

### Hướng tối ưu thành hệ thống

Không nên lưu theo kiểu "mỗi tháng một sheet" trong database.  
Nên tách dữ liệu thành các bảng chuẩn:

```text
members
membership_plans
member_memberships
payments
member_notes
```

Từ đó hệ thống có thể sinh lại màn hình tương tự Excel bằng filter:

```text
Tháng 9
  -> khách đăng ký mới
  -> khách gia hạn
  -> khách hết hạn
  -> doanh thu theo ngày
```

### Mapping trường

| Excel | Hệ thống đề xuất |
| --- | --- |
| Ngày | transaction_date hoặc membership_start_date |
| Thời hạn | start_date/end_date hoặc duration |
| Khách hàng | members.full_name |
| Số điện thoại | members.phone |
| Sinh nhật | members.date_of_birth |
| Gói tập | membership_plans.name |
| Chi phí | payments.amount hoặc member_memberships.actual_price |
| Ghi chú | member_notes.note hoặc member_memberships.note |

### Câu hỏi cần hỏi thêm

- Cột `Ngày` là ngày đăng ký, ngày hết hạn hay ngày ghi nhận?
- Cột `Thời hạn` đang ghi dạng gì: 1 tháng, 3 tháng, hay ngày hết hạn?
- Một khách gia hạn nhiều lần trong tháng thì ghi nhiều dòng hay ghi đè?
- Cột `Chi phí` là giá gói, số tiền đã trả hay còn nợ?
- Có phân biệt khách mới và khách gia hạn trong sheet không?

## 3. Tính lương PT

Tên bảng trong ảnh:

```text
LƯƠNG PT KIỆT THÁNG ...
```

### Cấu trúc hiện tại trên Excel

Các phần:

1. Lương cố định.
2. Lương dạy khách.
3. Lương sale.
4. Thưởng.
5. Phạt.

Phần `Lương dạy khách` có cột:

- Khách.
- Số buổi.
- Phần trăm.
- Tổng.

Phần `Lương sale` có cột:

- Khách.
- Chi phí.
- Hoa hồng.
- Tổng.

Phần `Thưởng` có cột:

- Hạng mục.
- Thưởng.
- Tổng.

Phần `Phạt` có cột:

- Hạng mục.
- Phạt.
- Tổng.

Bên phải có một vùng tổng tiền lớn, đang hiển thị `0 đ`.

### Ý nghĩa nghiệp vụ

Lương PT hiện tại được tính từ nhiều thành phần:

```text
Tổng lương =
  lương cố định
  + lương dạy khách
  + hoa hồng sale
  + thưởng
  - phạt
```

Đây là module payroll/commission, không nên đưa vào MVP nhưng công thức cốt lõi đã được chủ phòng chốt.

### Hướng tối ưu thành hệ thống

Nên để phase sau, sau khi đã có:

- PT session log.
- Payment.
- Gói PT.
- Doanh thu theo PT.
- Quy tắc hoa hồng rõ ràng.

Entity gợi ý:

```text
pt_salary_periods
  id
  pt_user_id
  month
  year
  base_salary
  teaching_commission_total
  sales_commission_total
  bonus_total
  penalty_total
  final_salary
  status

pt_salary_items
  id
  salary_period_id
  type
  description
  member_id
  amount
  rate
  quantity
  total
```

Type gợi ý:

- BASE_SALARY.
- TEACHING_COMMISSION.
- SALES_COMMISSION.
- BONUS.
- PENALTY.

### Câu hỏi cần hỏi thêm

- Lương dạy khách tính theo phần trăm doanh thu hay theo số tiền/buổi?
- Cột `Phần trăm` trong lương dạy khách áp dụng trên giá trị nào?
- Lương sale tính theo phần trăm chi phí gói hay số tiền cố định?
- Nếu khách còn nợ thì PT có được tính hoa hồng ngay không?
- Thưởng/phạt có danh mục cố định không?
- Ai duyệt bảng lương cuối tháng?

## 4. Mục tiêu hằng tháng

Tên bảng trong ảnh:

```text
MỤC TIÊU THÁNG 9
```

### Cấu trúc hiện tại trên Excel

Cột chính:

- Hạng mục.
- Chi tiết.
- Con số.
- Ngày 1 - 10.
- %.
- Ngày 11 - 20.
- %.
- Ngày 21 - hết.
- %.

Hạng mục nhìn thấy:

- Tài chính.
- Số khách Member.
- Khách Hướng Dẫn.
- Khách PT Mới.
- Khách PT Chính.

Chi tiết nhìn thấy:

- Doanh thu.
- Lợi nhuận.
- Khách tự tập, ví dụ 45 khách.
- Khách Hướng Dẫn.
- 4 Khách cho khách PT mới.

### Ý nghĩa nghiệp vụ

Bảng này dùng để đặt mục tiêu tháng và theo dõi tiến độ theo 3 chặng:

- Ngày 1-10.
- Ngày 11-20.
- Ngày 21-hết tháng.

Đây là một dạng target tracking/dashboard.

### Hướng tối ưu thành hệ thống

Nên chuyển thành module `Business Goals`.

Entity gợi ý:

```text
business_goals
  id
  year
  month
  category
  metric_name
  target_value
  unit
  note

business_goal_progress
  id
  goal_id
  period_start
  period_end
  actual_value
  progress_percent
  calculated_at
```

Category gợi ý:

- FINANCE.
- SELF_TRAINING_MEMBER.
- GUIDED_CUSTOMER.
- NEW_PT_CUSTOMER.
- MAIN_PT_CUSTOMER.

Metric gợi ý:

- REVENUE.
- PROFIT.
- CUSTOMER_COUNT.
- NEW_CUSTOMER_COUNT.
- PT_CUSTOMER_COUNT.

### Câu hỏi cần hỏi thêm

- `Khách Hướng Dẫn` nghĩa là gì? Khách được hướng dẫn ban đầu, khách trial, hay gói riêng?
- `Khách PT Mới` và `Khách PT Chính` khác nhau thế nào?
- Cột `Con số` là mục tiêu cả tháng hay số hiện tại?
- Các cột `Ngày 1-10`, `Ngày 11-20`, `Ngày 21-hết` là actual hay target từng giai đoạn?
- % tính theo target tháng hay target từng giai đoạn?

## 5. Tài chính năm

Tên bảng trong ảnh:

```text
TỔNG 2026
```

### Cấu trúc hiện tại trên Excel

Cột:

- Tháng.
- Tổng thu.
- Tổng chi.
- Lợi nhuận.

Dòng:

- Tháng 1 đến tháng 12.

Ô tiêu đề lợi nhuận có ghi:

```text
350,000,000đ
```

Có thể là mục tiêu lợi nhuận năm hoặc lợi nhuận kỳ vọng.

### Ý nghĩa nghiệp vụ

Bảng này dùng để tổng hợp tài chính theo năm:

```text
Lợi nhuận = Tổng thu - Tổng chi
```

Đây là phần dashboard/report tài chính năm.

### Hướng tối ưu thành hệ thống

Không nên nhập tay bảng tổng nếu đã có dữ liệu thu/chi chi tiết.  
Nên để hệ thống tự tính từ bảng `financial_transactions`.

Entity liên quan:

```text
financial_transactions
  id
  type
  category
  amount
  transaction_date
  description
  member_id
  membership_id
  created_by
  created_at
```

Report sinh ra:

```text
monthly_finance_report
  month
  total_income
  total_expense
  profit
  target_profit
  progress_percent
```

### Câu hỏi cần hỏi thêm

- `350,000,000đ` là mục tiêu lợi nhuận năm hay số khác?
- Tổng thu/chi hiện được nhập từ đâu?
- Có phân loại khoản thu/chi không?
- Có cần xem drill-down từ tháng -> ngày -> giao dịch chi tiết không?
- Có cần export báo cáo năm ra Excel/PDF không?

## 6. Thu hằng ngày

Tên bảng trong ảnh:

```text
TỔNG THU
```

### Cấu trúc hiện tại trên Excel

Cột:

- Ngày.
- Khách hàng.
- Gói tập.
- Tự tập.
- Giáo án.
- Sinh viên.
- PT.
- Tổng.

Trên đầu các cột tiền có dòng tổng theo từng nhóm, hiện đều đang là `0 đ`.

### Ý nghĩa nghiệp vụ

Bảng này dùng để ghi nhận doanh thu hằng ngày theo từng khách và từng loại nguồn thu.

Các nhóm doanh thu nhìn thấy:

- Tự tập.
- Giáo án.
- Sinh viên. Ghi chú đã chốt: cột này thực chất là doanh thu gói PT mới.
- PT.

Đây là dữ liệu nguồn quan trọng cho:

- Tổng thu ngày.
- Tổng thu tháng.
- Doanh thu theo loại gói/dịch vụ.
- Tính hoa hồng sale nếu có.
- Báo cáo tài chính năm.

### Hướng tối ưu thành hệ thống

Nên chuyển thành `payments` hoặc `financial_transactions` loại `INCOME`.

Entity gợi ý:

```text
payments
  id
  member_id
  membership_id
  payment_date
  amount
  payment_method
  revenue_category
  note
  created_by
  created_at
```

Hoặc dùng chung:

```text
financial_transactions
  id
  type: INCOME
  category
  amount
  transaction_date
  member_id
  membership_id
  description
```

Category gợi ý:

- SELF_TRAINING.
- GUIDANCE.
- PT_MAIN.
- PT_NEW.
- OTHER_INCOME.

### Thông tin đã chốt thêm

- `Giáo án` là nhóm Khách Hướng Dẫn/Tập Giáo Án.
- `Sinh viên` trong Excel cũ là khoản thu gói PT mới, không phải nhóm sinh viên/discount riêng.
- Một khách trong một ngày có thể trả nhiều khoản không?
- Cột `Tổng` là tổng theo từng dòng hay tổng theo nhóm/ngày?
- Có cần lưu phương thức thanh toán: tiền mặt, chuyển khoản không?

## 7. Tổng chi

Tên bảng trong ảnh:

```text
TỔNG CHI
```

### Cấu trúc hiện tại trên Excel

Cột:

- Ngày.
- Khoản chi.
- Chi phí.
- Tổng.
- Ghi chú.

Khoản chi mẫu:

- Nhà.
- Quảng cáo.
- Điện.
- Nước.
- Rác.
- Wifi.
- Nước lọc.
- Kiệt.
- Tiền PT.
- Tiền MKT.
- Thưởng lễ.

### Ý nghĩa nghiệp vụ

Bảng này dùng để ghi nhận chi phí vận hành phòng gym.

Các nhóm chi có thể chia thành:

- Chi phí cố định: nhà, wifi.
- Chi phí tiện ích: điện, nước, rác, nước lọc.
- Chi phí marketing: quảng cáo, tiền MKT.
- Chi phí nhân sự: tiền PT, thưởng lễ, khoản liên quan đến cá nhân.
- Chi phí khác.

### Hướng tối ưu thành hệ thống

Nên dùng `financial_transactions` loại `EXPENSE`.

Entity:

```text
financial_transactions
  id
  type: EXPENSE
  category
  amount
  transaction_date
  description
  created_by
  created_at
```

Category gợi ý:

- RENT.
- MARKETING.
- ELECTRICITY.
- WATER.
- WASTE.
- INTERNET.
- DRINKING_WATER.
- PT.
- PT_SALARY.
- BONUS.
- OTHER_EXPENSE.

### Câu hỏi cần hỏi thêm

- `Tiền PT` là lương PT hay chi phí thuê PT ngoài?
- Có cần duyệt khoản chi không?
- Có cần upload ảnh hóa đơn không?

Thông tin đã làm rõ:

- `Kiệt` là tên nhân sự/PT.
- Chị Tiên có thể xuất hiện theo 2 vai trò: `Tiên PT` và `Tiên MKT`.
- Các khoản chi kiểu tên người/vai trò có thể phát sinh linh hoạt, nên hệ thống không hard-code.
- MVP nên cho OWNER tự tạo danh mục chi và nhập ghi chú khi ghi expense.
- Phase sau nếu làm payroll/nhân sự chuẩn hơn thì các khoản này có thể liên kết trực tiếp đến PT/nhân sự.

## 8. Theo dõi khách hàng theo tuần

Tên bảng trong ảnh:

```text
THÔNG TIN KHÁCH HÀNG
THEO DÕI KHÁCH HÀNG
```

### Cấu trúc hiện tại trên phiếu

Thông tin đầu vào:

- Họ và tên.
- Ngày/tháng/năm sinh.
- Số Zalo.
- Mục tiêu.
- Gói tập.
- Thời hạn.

Bảng theo dõi:

- Ngày.
- Cao.
- Nặng.
- V1.
- Eo.
- Bụng.
- V3.
- Đùi.
- Tay.

Phần cuối:

- Các ghi chú khác.
- Số điện thoại phòng gym.
- Địa chỉ phòng gym.

### Ý nghĩa nghiệp vụ

Đây là phiếu theo dõi chỉ số cơ thể của khách, nhiều khả năng dùng cho khách PT hoặc khách theo chương trình có mục tiêu.

Các chỉ số:

- Cao: chiều cao.
- Nặng: cân nặng.
- V1: vòng 1/ngực.
- Eo.
- Bụng.
- V3: vòng 3/mông.
- Đùi.
- Tay.

### Hướng tối ưu thành hệ thống

Nên đưa vào bảng `body_measurements`.

Entity:

```text
body_measurements
  id
  member_id
  recorded_by
  recorded_at
  height
  weight
  chest
  waist
  abdomen
  hip
  thigh
  arm
  note
```

Thông tin mục tiêu/gói/thời hạn nên tách:

```text
pt_goals
member_memberships
membership_plans
```

### Giá trị cho AI sau này

Đây là dữ liệu rất tốt cho:

- PT Customer Progress Analysis.
- Progress Score.
- Báo cáo cuối gói.
- Phân tích tiến độ theo mục tiêu.

### Câu hỏi cần hỏi thêm

- Phiếu này dùng cho mọi khách hay chỉ khách PT?
- Bao lâu đo một lần: hằng tuần, hằng tháng hay tùy khách?
- `V1` và `V3` cần đặt tên chuẩn trong hệ thống là gì?
- Có cần lưu ảnh before/after không?
- Có cần in/export phiếu này thành PDF không?

## 9. Theo dõi khách hàng hằng ngày

Tên bảng trong ảnh:

```text
CHECK IN
```

### Cấu trúc hiện tại trên phiếu

Cột:

- STT.
- Tập PT: ngày.
- Tập PT: cân nặng.
- Ôn tập: ngày.
- Ôn tập: cân nặng.

Dòng:

- STT từ 1 đến 24.

### Ý nghĩa nghiệp vụ

Phiếu này có vẻ dùng để theo dõi số buổi trong một chương trình/gói, gồm:

- Buổi tập PT.
- Buổi ôn tập/tự tập theo giáo án.
- Cân nặng tại từng buổi hoặc từng lần check-in.

Điểm này bổ sung thông tin quan trọng: tuy khách tự tập đại trà không điểm danh, khách trong chương trình PT/giáo án vẫn có thể được theo dõi theo buổi.

### Hướng tối ưu thành hệ thống

Nên tách thành session/check-in theo chương trình:

```text
pt_session_logs
  id
  member_id
  pt_user_id
  session_date
  session_number
  weight
  note

program_practice_logs
  id
  member_id
  program_id
  practice_date
  session_number
  weight
  note
```

Nếu muốn đơn giản hơn ở MVP, có thể dùng chung một bảng:

```text
member_activity_logs
  id
  member_id
  activity_type: PT_SESSION, PRACTICE
  activity_date
  session_number
  weight
  note
  created_by
```

### Câu hỏi cần hỏi thêm

- `Ôn tập` nghĩa là khách tự tập lại theo bài PT đã giao hay một dạng buổi riêng?
- 24 dòng có phải tương ứng gói 24 buổi không?
- Cân nặng trong phiếu này có thay thế body measurement không, hay chỉ ghi nhanh theo buổi?
- Có cần tính số buổi còn lại từ phiếu này không?
- Ai cập nhật phiếu này: PT hay khách?

## 10. Tổng kết mục tiêu và thực tế của khách hàng

Tên bảng trong ảnh:

```text
CHƯƠNG TRÌNH TẬP LUYỆN THEO MỤC TIÊU
```

### Cấu trúc hiện tại trên phiếu

Thông tin đầu vào:

- Mục tiêu.
- Thời hạn theo tuần.

Bảng theo dõi:

- STT.
- Tuần.
- Mục tiêu: số buổi.
- Mục tiêu: mục tiêu.
- Thực tế: số buổi.
- Thực tế: kết quả.
- Ghi chú.

Dòng:

- STT từ 1 đến 24.

### Ý nghĩa nghiệp vụ

Đây là bảng theo dõi kế hoạch tập luyện theo tuần, so sánh mục tiêu với thực tế.

Nó trả lời các câu hỏi:

- Tuần này khách cần tập bao nhiêu buổi?
- Mục tiêu tuần này là gì?
- Thực tế khách tập được bao nhiêu buổi?
- Kết quả đạt được như thế nào?
- Có ghi chú gì từ PT?

### Hướng tối ưu thành hệ thống

Nên chuyển thành module `Training Program / PT Progress`.

Entity gợi ý:

```text
training_programs
  id
  member_id
  pt_user_id
  goal
  duration_weeks
  start_date
  end_date
  status

training_program_weeks
  id
  program_id
  week_number
  target_sessions
  target_description
  actual_sessions
  actual_result
  note
```

Hoặc nếu muốn gọn hơn:

```text
pt_weekly_progress
  id
  member_id
  pt_user_id
  week_number
  week_start_date
  week_end_date
  target_sessions
  target_goal
  actual_sessions
  actual_result
  note
```

### Giá trị cho AI sau này

Đây là dữ liệu rất phù hợp cho:

- PT Customer Progress Analysis.
- PT Drop-off Risk.
- Báo cáo cuối gói.
- Progress Score theo tuần.

### Câu hỏi cần hỏi thêm

- Mục tiêu tuần được PT nhập tự do hay chọn từ danh mục?
- Kết quả thực tế được đánh giá bằng số liệu hay nhận xét chữ?
- Có cần tự động tính `actual_sessions` từ session log không?
- 24 tuần là mẫu cố định hay có chương trình dài/ngắn khác?
- Khi kết thúc chương trình có cần xuất report cho khách không?

## Tổng hợp nháp sau đủ 10 ảnh

Các ảnh Excel/phiếu giấy hiện tại có thể gom thành các module sau:

1. `Member Management`: quản lý khách, thông tin cá nhân, sinh nhật, gói tập, thời hạn.
2. `Membership & Renewal`: đăng ký/gia hạn gói, lịch sử gói, sắp hết hạn, đã hết hạn.
3. `Payment / Daily Income`: thu hằng ngày theo khách và loại dịch vụ.
4. `Expense Management`: tổng chi theo danh mục.
5. `Finance Reporting`: tổng thu, tổng chi, lợi nhuận theo tháng/năm.
6. `PT Schedule`: lịch dạy PT theo tuần.
7. `PT Session Tracking`: số buổi PT, buổi ôn tập, cân nặng từng buổi.
8. `Body Measurement`: chiều cao, cân nặng, vòng đo, ghi chú.
9. `Training Program`: mục tiêu theo tuần, thực tế theo tuần, kết quả.
10. `Business Goals`: mục tiêu tháng, tiến độ 10 ngày/lần.
11. `Payroll / PT Commission`: lương cố định, lương dạy khách, hoa hồng sale, thưởng, phạt.

## Phân loại sheet: dữ liệu nguồn hay báo cáo

### Dữ liệu nguồn nên nhập/lưu thật

- Khách hàng.
- Gói tập.
- Lịch sử đăng ký/gia hạn.
- Thanh toán/thu hằng ngày.
- Khoản chi.
- Lịch dạy PT.
- Buổi tập PT.
- Buổi ôn tập/thực hành.
- Chỉ số cơ thể.
- Mục tiêu/chương trình tập.
- Thưởng/phạt/lương PT nếu làm payroll.

### Báo cáo nên để hệ thống tự sinh

- Tổng thu theo ngày/tháng/năm.
- Tổng chi theo ngày/tháng/năm.
- Lợi nhuận.
- Tài chính năm.
- Mục tiêu tháng và phần trăm hoàn thành.
- Bảng lương PT cuối tháng.
- Báo cáo tiến độ khách PT.

## Điều chỉnh nhận định trước đó

Trước đó đã chốt khách tự tập đại trà không check-in, điều này vẫn đúng.  
Tuy nhiên ảnh số 9 cho thấy có một loại `CHECK IN` dành cho khách theo chương trình/PT, gồm `Tập PT` và `Ôn tập`.

Vì vậy cần phân biệt:

- Khách tự tập thường: không điểm danh, không dùng để dự đoán hành vi tập luyện.
- Khách PT/chương trình: có thể có session/check-in theo buổi, rất phù hợp để theo dõi tiến độ và làm AI sau này.

## Ưu tiên đưa vào hệ thống

### MVP nên có

- Member Management.
- Membership & Renewal.
- Payment / Daily Income.
- Expense basic.
- Finance basic dashboard.
- PT session log.
- Body measurement.
- Training goal cơ bản.

### Phase 2 nên có

- PT Schedule.
- Training Program theo tuần.
- Business Goals theo tháng.
- Import dữ liệu Excel/CSV.
- Báo cáo tiến độ khách PT.
- Báo cáo tài chính nâng cao.

### Phase 3 nên có

- Payroll / PT Commission.
- Hoa hồng sale.
- Thưởng/phạt.
- Export Excel/PDF.

### AI phase sau

- PT Customer Progress Analysis.
- PT Drop-off Risk.
- Progress Score theo tuần.
- Customer Segmentation.
- Renewal Analytics cho khách tự tập.

## Việc cần làm tiếp theo

Khi chuyển từ nháp sang kế hoạch chính:

- Cập nhật `APP GYM DUONG DOUBLE.md` theo 10 ảnh.
- Cập nhật `GYM_DUONG_DOUBLE_OFFICIAL_PLAN.md` với module mới: daily income, expense, PT schedule, training program, business goals.
- Cập nhật `GYM_DUONG_DOUBLE_AI_ROADMAP.md` để bổ sung dữ liệu `CHECK IN`, weekly progress và training program.
- Thiết kế database chính thức.
- Xác định API MVP/Phase 2.
- Quyết định module nào làm trước để không bị phình scope.
