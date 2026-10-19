# Nhắc việc, trang công khai và thao tác thủ công

## 1. Trang Nhắc việc không chỉ là API notifications

Trong [`RemindersPage.tsx`](../../../frontend/src/features/reminders/pages/RemindersPage.tsx), frontend gọi API danh sách member, chi tiết member và debt thông qua client tương ứng, rồi dựng các `ReminderItem` cho các nhóm như hết hạn, sắp hết hạn, sinh nhật và công nợ. Nội dung tin nhắn được tạo từ dữ liệu hiển thị trong frontend. Khi phân tích một con số ở trang này, phải đọc `build...`/filter của trang cùng các API mà nó gọi, thay vì mặc định nó tương đương `DashboardService.notifications()`.

Luồng liên hệ: trang dùng helper [`zalo.ts`](../../../frontend/src/shared/lib/zalo.ts) để tạo URL và sao chép nội dung. Việc mở trang Zalo hoặc copy tin không chứng minh tin nhắn đã được gửi hoặc khách đã phản hồi. Đây là thao tác thủ công, không phải tích hợp gửi tin tự động từ server.

## 2. Ví dụ lần theo một lời nhắc

Hãy chọn member test có ngày hết hạn, mở `RemindersPage` và tìm đoạn dựng reminder dựa vào `member.endDate`. Quan sát các điều kiện status/date, cách lấy `profile.zaloPhone`/phone làm liên hệ, và cách tạo message. Sau đó vào `memberApi` để tìm endpoint của danh sách/chi tiết, rồi xuống `MemberService.list` và policy chọn membership. Như vậy cùng một reminder liên quan nhiều lớp: nguồn dữ liệu, lọc quyền, chọn gói và xây message.

Nếu là công nợ, theo dõi `listDebts` và `remainingAmount` của debt thay vì coi `actualPrice` là số còn phải thu. Khi muốn kiểm tra việc nhắc của PT, cần đọc cả permission backend cho member/debt; role được phép xem trang không tự mở tất cả bản ghi.

## 3. Trang công khai

[`HomePage.tsx`](../../../frontend/src/features/public-home/pages/HomePage.tsx) là trang giới thiệu public. [`App.tsx`](../../../frontend/src/app/App.tsx) định tuyến `/`, `/exercises`, `/exercises/:slug` ngoài protected route. Một số thông tin và liên kết của trang giới thiệu nằm trực tiếp trong frontend; hãy đọc file để biết nguồn cụ thể thay vì khẳng định toàn bộ thông tin trên trang đều do backend quản lý.

Phần bảng giá gọi `GET /api/v1/public/membership-plans`; endpoint chỉ đưa các plan active qua DTO công khai, nên trang chủ không giữ bảng giá tĩnh trùng với danh mục OWNER. Phần danh sách bài tập public gọi backend public và áp dụng quy tắc active của bài/danh mục như stage 6. Nhấn liên hệ Zalo là mở đường dẫn ngoài, không tự tạo hồ sơ member hay tự kích hoạt gói. Đừng đưa thông tin của khách thật vào ví dụ.

## 4. Bài tập

1. So sánh API `notifications` và danh sách UI Nhắc việc: nguồn dữ liệu, filter và cách tạo câu chữ ở hai nơi là gì?
2. Lần một nút Zalo tới `buildZaloUrl`, xác định thao tác nào tự động và thao tác nào do người dùng thực hiện.
3. Vào route public bằng trình duyệt không đăng nhập; đối chiếu React route và `/v1/public/**` trong backend security.
4. Tắt một plan demo trong khu vực OWNER rồi tải lại trang công khai; đối chiếu gói biến mất theo response public, không phải theo một mảng giá tĩnh.

## 5. Cách tính sinh nhật sắp tới trong frontend

Trích `RemindersPage.tsx`, lược phần return:

```ts
const today = new Date()
const birthday = new Date(`${dateOfBirth}T00:00:00`)
let next = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

if (next < todayStart) {
  next = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate())
}
```

Nó dựng sinh nhật trong năm hiện tại; nếu trước đầu ngày hôm nay thì chuyển sang năm sau. Sau đó code khác tính khoảng ngày và chỉ đưa vào nhóm phù hợp. Đây là tính ở frontend theo đồng hồ/múi giờ trình duyệt; không phải một job gửi tin nhắn tự động. Nên thử sinh nhật hôm nay, qua ngày rồi, cuối năm và ngày 29/02; trường hợp năm không nhuận phải quan sát JavaScript thực tế, không tự nói có chính sách nghiệp vụ riêng nếu code không định nghĩa.

Nhắc hạn và công nợ cần đối chiếu tập dữ liệu frontend, bộ lọc trạng thái, ngày và API nguồn. Một thông báo xuất hiện trong danh sách không chứng minh đã gửi Zalo. Zalo là kênh liên hệ thủ công theo đường dẫn/luồng UI đang triển khai.

## 6. Public page khác dashboard OWNER

Public route và endpoint public có thể xem khi không đăng nhập; dashboard nội bộ cần xác thực/phân quyền. Giá niêm yết hiện lấy từ API danh mục public; video lấy từ API public; còn một số nội dung giới thiệu/liên hệ có thể nằm ở frontend. Khối QR chỉ hiện khi cấu hình public đầy đủ và đang bật, không có tài khoản dự phòng. Khi thuyết trình hãy mở route, component, service và API tương ứng để ghi rõ nguồn, không nói toàn bộ nội dung được quản trị từ database chỉ vì một phần là dữ liệu động.
