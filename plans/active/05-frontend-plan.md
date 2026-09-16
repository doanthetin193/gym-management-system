# 05 - KẾ HOẠCH FRONTEND

## 1. Mục tiêu frontend

Frontend cần phục vụ thao tác thực tế hằng ngày của chủ phòng và PT, không mô phỏng Excel một cách máy móc.

Ưu tiên:

- OWNER xem nhanh tình trạng phòng.
- PT cập nhật nhanh buổi tập/chỉ số trên điện thoại.
- MEMBER xem thông tin gói và nội dung được phép.
- Form ngắn, ít bước.
- Bảng dữ liệu có lọc/tìm kiếm/pagination.

## 2. Stack frontend

- React.
- TypeScript.
- Tailwind CSS.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod.
- Recharts.

## 3. Cấu trúc route

```text
/login

/owner/dashboard
/owner/members
/owner/members/:id
/owner/membership-plans
/owner/finance
/owner/pt
/owner/pt/schedules
/owner/training-programs
/owner/exercises
/owner/business-goals
/owner/notifications
/owner/settings

/pt/dashboard
/pt/my-members
/pt/members/:id
/pt/schedule
/pt/session-logs/new
/pt/body-measurements/new

/member/dashboard
/member/profile
/member/membership
/member/exercises
/member/training-content
```

## 4. Layout theo role

### OWNER layout

- Sidebar trái.
- Topbar có thông tin user.
- Nội dung chính dạng dashboard/table/detail.
- Ưu tiên desktop/laptop.

Menu:

- Dashboard.
- Khách hàng.
- Gói tập.
- Tài chính.
- PT.
- Lịch PT.
- Chương trình tập.
- Bài tập.
- Mục tiêu.
- Nhắc việc.
- Cài đặt.

### PT layout

- Mobile-first.
- Bottom nav hoặc sidebar gọn.
- Tập trung vào lịch hôm nay và khách được phân công.

Menu:

- Dashboard.
- Khách của tôi.
- Lịch dạy.
- Cập nhật buổi tập.

### MEMBER layout

- Gọn.
- Dễ dùng trên điện thoại.
- Ít chức năng.

Menu:

- Trang chủ.
- Gói tập.
- Bài tập.
- Hồ sơ.

## 5. OWNER pages

### Dashboard

Hiển thị:

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

Quick actions:

- Tạo member.
- Gia hạn gói.
- Thêm payment.
- Thêm expense.

### Members list

Chức năng:

- Search tên/số điện thoại.
- Filter trạng thái gói.
- Filter sắp hết hạn/hết hạn.
- Pagination.
- Action: xem chi tiết, gia hạn.

### Member detail

Tabs:

- Tổng quan.
- Gói tập.
- Thanh toán/công nợ.
- PT/session.
- Chỉ số cơ thể.
- Ghi chú.

### Membership plans

Form gói tập cần hỗ trợ:

- Loại gói: Tự tập, PT, Giáo án/Hướng Dẫn, Khác.
- Cấp PT nếu là gói PT: PT chính hoặc PT mới.
- Số buổi PT và số buổi Ôn tập cho gói PT.
- Số buổi check-in giáo án cho gói Giáo án/Hướng Dẫn: 30, 60, 90 hoặc nhập tùy chỉnh nếu chủ phòng cần.
- Quyền xem nội dung: không có, cơ bản, premium.
- Tỷ lệ giá PT mới, mặc định có thể là 65% so với gói PT chính tương ứng.

Form bán/gia hạn gói cần có:

- Người sale/phụ trách bán gói, có thể để trống.
- Giá thực tế, giảm giá, đã trả, còn nợ.

### Finance

Tabs:

- Tổng quan.
- Thu.
- Chi.
- Công nợ.
- Báo cáo tháng/năm.

Form expense cần hỗ trợ category linh hoạt để map các khoản từ Excel như nhà, quảng cáo, điện, nước, rác, wifi, nước lọc, tiền PT, tiền MKT, thưởng lễ.

### PT management

- Danh sách PT.
- Khách được gán.
- Lịch dạy.
- Khách còn ít buổi.

### Exercise library

- Nhóm bài tập.
- Danh sách bài tập.
- Form bài tập.
- Media YouTube/image.

### Business goals

- Tạo mục tiêu tháng.
- Xem doanh thu/lợi nhuận mục tiêu và thực tế.
- Xem số khách tự tập, khách Giáo án/Hướng Dẫn, khách PT mới, khách PT chính.
- Xem tiến độ theo giai đoạn 1-10, 11-20, 21-hết tháng.

### Notifications/nhắc việc cơ bản

Hiển thị trong topbar hoặc một trang đơn giản:

- Khách sắp hết hạn.
- Sinh nhật hôm nay/tháng này.
- Công nợ cần nhắc.
- Khách PT còn ít buổi.
- Khách lâu chưa có buổi PT.

Không làm trong MVP:

- Push notification.
- Email automation.
- Auto Zalo.

### Import dữ liệu

Không làm trong MVP vì chủ phòng muốn bắt đầu bằng dữ liệu mới. Nếu phase sau cần nhập lịch sử Excel thì mới bổ sung:

- Upload file CSV/Excel.
- Preview dữ liệu.
- Hiển thị lỗi theo dòng.
- Xác nhận import.
- Xem lịch sử import.

## 6. PT pages

### PT dashboard

Hiển thị:

- Lịch hôm nay.
- Số khách được phân công.
- Khách còn ít buổi.
- Khách lâu chưa có session.

### My members

- Danh sách khách.
- Số buổi còn lại.
- Mục tiêu.
- Trạng thái gần đây.

### PT member detail

Tabs:

- Tổng quan.
- Session logs.
- Body measurements.
- Training program.
- Đánh giá kết thúc gói/chương trình.
- Notes.

Actions:

- Thêm buổi tập.
- Thêm chỉ số.
- Cập nhật mục tiêu tuần.

## 7. MEMBER pages

### Member dashboard

Hiển thị:

- Gói hiện tại.
- Ngày hết hạn.
- Lịch sử thanh toán cơ bản.
- Bài tập/chương trình được phép.

### Exercise/training content

- Danh sách bài tập.
- Filter nhóm cơ.
- Xem video YouTube embed theo quyền nội dung của gói hiện tại.

## 8. Component chính

```text
DataTable
Pagination
SearchInput
DateRangeFilter
StatusBadge
MoneyDisplay
ConfirmDialog
Toast

MemberForm
MembershipRenewForm
PaymentForm
ExpenseForm
PtSessionForm
ActivityLogForm
BodyMeasurementForm
TrainingWeekForm
ExerciseForm

DashboardMetricCard
RevenueChart
BodyMeasurementChart
GoalProgressChart
```

## 9. Data fetching

TanStack Query dùng cho:

- List/query cache.
- Refetch dashboard.
- Mutation create/update.
- Loading/error state.

Quy ước:

- Query key theo module: `['members', filters]`.
- Mutation success thì invalidate list/detail liên quan.
- Không lưu server state thủ công bằng global store nếu không cần.

## 10. Form validation

Dùng React Hook Form + Zod.

Validation quan trọng:

- Phone bắt buộc khi tạo member.
- Amount > 0.
- Start date <= end date.
- Payment không vượt quá số tiền còn nợ nếu áp dụng.
- Session date không được rỗng.
- YouTube URL hợp lệ.

## 11. UI states cần có

- Loading skeleton.
- Empty state.
- Error state.
- Form validation errors.
- Confirm trước khi hủy/xóa/inactive.
- Toast success/error.

## 12. Thiết kế responsive

OWNER:

- Ưu tiên desktop.
- Mobile vẫn dùng được cho thao tác cơ bản.

PT:

- Ưu tiên mobile.
- Form session/body measurement cần nhanh.

MEMBER:

- Mobile-first.

## 13. Thứ tự làm frontend MVP

1. Login/layout theo role.
2. OWNER dashboard.
3. Member list/detail.
4. Membership plan + renew flow.
5. Payment/expense.
6. PT my members.
7. PT session/body measurement.
8. Exercise library.
9. Training program cơ bản.
10. Business goals.
11. Production UI polish: loading, empty, error, responsive.
