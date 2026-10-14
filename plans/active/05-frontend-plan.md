# 05 - KẾ HOẠCH FRONTEND

## 1. Mục tiêu frontend

Frontend cần phục vụ thao tác thực tế hằng ngày của chủ phòng và PT, không mô phỏng Excel một cách máy móc.

Ưu tiên:

- OWNER xem nhanh tình trạng phòng.
- PT cập nhật nhanh buổi tập/chỉ số trên điện thoại.
- MEMBER xem thông tin gói và truy cập thư viện bài tập/video public.
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

/dashboard
/members
/members/:memberId
/membership-plans
/payments
/reports
/pt-schedule
/owner/exercises
/goals
/settings
/profile

/my-progress

/reminders
/reminders/:type

/exercises
/exercises/:slug
/login
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

- Thư viện bài tập/video TikTok public.
- Nhóm bài tập/chủ đề.
- Danh sách bài tập dạng card.
- Form thêm/sửa bài tập cho OWNER.
- TikTok URL preview/fallback mở TikTok.
- Copy link/chia sẻ cho học viên.

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
- Goals/progress.
- Ghi chú/đánh giá kết thúc gói nếu cần.
- Notes.

Actions:

- Thêm buổi tập.
- Thêm chỉ số.
- Cập nhật mục tiêu tập luyện.

## 7. MEMBER pages

### Member dashboard

Hiển thị:

- Gói hiện tại.
- Ngày hết hạn.
- Lịch sử thanh toán cơ bản.
- Link vào thư viện bài tập/video public.

### Public exercise/video content

- Danh sách bài tập.
- Filter nhóm cơ.
- Xem video TikTok public.
- Copy link/chia sẻ.
- Không yêu cầu đăng nhập.

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
- TikTok URL hợp lệ.

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
8. Public TikTok exercise library.
9. Business goals.
10. Production UI polish: loading, empty, error, responsive.

## 14. Cập nhật route và màn hình theo implementation hiện tại

Tài liệu chốt hiện trạng sau nâng cấp UI nằm tại `plans/active/10-current-implementation-alignment.md`.

Route thực tế hiện tại:

```text
/
/exercises
/exercises/:slug
/login

/my-progress
/dashboard
/members
/members/:memberId
/membership-plans
/payments
/reminders
/reminders/:type
/reports
/pt-schedule
/owner/exercises
/goals
/settings
/profile
```

Quy tắc layout/role hiện tại:

- Public không đăng nhập: `/`, `/exercises`, `/exercises/:slug`.
- MEMBER: `/my-progress`, `/profile`.
- PT: `/members`, `/members/:memberId`, `/membership-plans`, `/payments`, `/reminders`, `/pt-schedule`, `/profile`.
- OWNER: toàn bộ vùng quản trị gồm dashboard, members, plans, payments, reminders, reports, PT schedule, owner exercises, goals, settings, profile.

Các màn hình bổ sung so với kế hoạch sơ khai:

- Public home đầy đủ: giới thiệu, bảng giá, cơ sở vật chất, triết lý, thư viện TikTok, liên hệ.
- Member portal `/my-progress`: gói hiện tại, công nợ, buổi PT, biểu đồ chỉ số cơ thể, mục tiêu, lịch PT, lịch sử thanh toán.
- Member detail: gán/gia hạn gói, thu nợ, VietQR, tạo/reset/khoá tài khoản portal.
- Settings: cấu hình VietQR và quản lý tài khoản PT.
- Reports: biểu đồ vận hành, xuất `.xlsx`, full backup nhiều sheet, đồng bộ Google Sheet qua Apps Script/token.
- Reminders: copy tin nhắn và mở Zalo cho hết hạn, công nợ, sinh nhật.
- PT schedule: gán khách PT bằng dropdown/tìm kiếm, chỉ hiển thị khách gói PT phù hợp, khách đã có PT active bị disable.
