# Xuất XLSX và gửi dữ liệu Google Sheets

## 1. Xuất dữ liệu diễn ra ở đâu?

[`ReportsPage.tsx`](../../../frontend/src/features/reports/pages/ReportsPage.tsx) tải dữ liệu cần hiển thị từ các API, dùng `reportRows` chuẩn bị dữ liệu từng danh mục và gọi [`downloadXlsx`](../../../frontend/src/features/reports/lib/xlsxExport.ts) tại frontend. Người dùng có thể xuất từng danh mục hoặc file có năm sheet: hội viên, thanh toán, công nợ, gói tập, doanh thu.

Tên nút “Full Backup” trên UI không nên hiểu là bản sao PostgreSQL đầy đủ hay có thể khôi phục tự động mọi bảng và quan hệ. File chỉ chứa các sheet/field được hàm export chuẩn bị từ dữ liệu đang được nạp ở frontend. Muốn sao lưu database đầy đủ cần quy trình riêng; tài liệu này mô tả đúng code, không khẳng định có chức năng restore.

Trong `xlsxExport.ts`, code dựng XML sheet/workbook và ZIP, tạo Blob rồi tải file. Khi học, tìm `escapeXml`, `worksheetXml`, `createZip` và `downloadXlsx`; đừng nhầm đó là thao tác Hibernate hay một endpoint backend xuất database.

## 2. Đồng bộ Apps Script

`ReportsPage` lưu cấu hình URL và token trong `localStorage` qua `readSheetConfig`/`saveSheetConfig`. `syncGoogleSheet` kiểm tra có URL/token, chuẩn bị dữ liệu và dùng `fetch` tới URL được cấu hình. Vì luồng này chạy từ trình duyệt tới Apps Script, cần đọc code để biết body thực tế, chế độ request và thông báo lỗi; đừng mô tả thành backend tự động chạy định kỳ hoặc tự có rate limit.

Token nằm trong browser storage là dữ liệu nhạy cảm và có thể bị JavaScript trên trang đọc. Chỉ dùng endpoint do người vận hành tin cậy; trước khi đồng bộ phải kiểm tra những dữ liệu cá nhân nào có trong body và ai được xem Google Sheet. Cài đặt này khác với key Groq: chúng phục vụ hai tích hợp khác nhau.

## 3. Tự thực hành

1. Dùng dữ liệu test, xuất từng sheet và đối chiếu `reportRows` với cột trong file.
2. Xuất file năm sheet, mở bằng phần mềm bảng tính và kiểm tra tên sheet, số dòng, ký tự tiếng Việt.
3. Đối chiếu code và giải thích vì sao file xuất không phải bản sao toàn bộ database.
4. Khi thử Apps Script riêng, kiểm tra status/body và quyền truy cập sheet; không gửi thông tin khách thật hoặc token vào ảnh/log chia sẻ.

## 4. Cách lần code hàm xuất

Trong `ReportsPage`, bắt đầu từ `exportFullBackup()`: nó tạo mảng định nghĩa sheet, mỗi phần tử có `name` và `rows`. Bốn danh mục gọi `reportRows` để chuyển object frontend thành các dòng được chọn; sheet doanh thu dùng `financeReport.rows`. Tiếp theo tìm `downloadXlsx`: hàm làm sạch tên sheet theo giới hạn của XLSX, tạo danh sách file XML nội bộ và đóng gói ZIP. Bước cuối tạo Blob với MIME XLSX và kích hoạt tải xuống.

Điều quan trọng cho review backend: dữ liệu xuất phụ thuộc dữ liệu frontend đã tải thành công và các field được map trong `reportRows`. Muốn biết một field có mặt hay không, đọc object row chứ không suy từ tên nút. Muốn đánh giá khả năng khôi phục, cần tìm quy trình import/restore tương ứng, constraint, tất cả bảng và liên kết; riêng đoạn export này không chứng minh có quy trình đó.

## 5. Lỗi và bảo mật khi đồng bộ

Một URL Apps Script hoạt động và một thông báo frontend không tự chứng minh mọi dòng đã được ghi đúng. Khi test, đối chiếu response mà `fetch` xử lý với nội dung thực tế trên sheet và xác định lỗi mạng/quyền/định dạng. Vì form lưu URL và token trong localStorage, việc sử dụng máy dùng chung hoặc script độc hại có thể làm tăng rủi ro lộ token. Không suy ra token đã được server quản lý hoặc tự động mã hóa chỉ vì ô nhập có kiểu mật khẩu.

## 6. Đọc đúng ranh giới browser và backend

Trích từ `ReportsPage.tsx`:

```ts
function saveSheetConfig(config: SheetConfig) {
  localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config))
}
```

Đây là storage của trình duyệt, không phải bảng PostgreSQL hay vault server. Sau đó frontend thu thập dữ liệu và gọi `fetch` đến URL cấu hình: mở DevTools Network để phân biệt request tới API backend với request tới Apps Script. Token nằm ở localStorage có thể bị đọc bởi script chạy trong cùng origin nếu xảy ra XSS; dùng tài khoản và dữ liệu test, không ghi URL/token thật vào báo cáo.

Xuất XLSX cũng cần đọc các hàm trong frontend: file là tập sheet được chọn và ánh xạ, không thể kết luận là bản sao toàn bộ database có thể khôi phục. Một database backup thực sự còn cần schema, quan hệ, ID, dữ liệu đầy đủ, quy trình restore và kiểm tra riêng.

## 7. Test đối soát dữ liệu thay vì chỉ bấm tải

Trước khi xuất, ghi số record test của hội viên, payment, debt, plan và các chỉ tiêu doanh thu trong phạm vi export. Mở từng sheet để kiểm tra header, định dạng ngày/số tiền và một số dòng đối chiếu nguồn. Khi đồng bộ, kiểm tra response của script **và** nội dung sheet đích, kể cả khi có dữ liệu cũ. Kiểm thử lặp lại có tạo dòng trùng hay ghi đè tùy script; không tự khẳng định idempotency nếu chưa xem mã Apps Script thực tế.

## 8. Body đồng bộ không giống payload AI ẩn danh

Trong `syncGoogleSheet`, frontend tải chi tiết từng member bằng `getMemberDetail`, sau đó POST JSON chứa `token`, `source` và `payload`. Payload gồm `generatedAt`, `period`, `dashboard`, `financeReport`, `memberReport`, `members`, `memberDetails`, `membershipPlans`, `debts`, `payments`. Như vậy request đồng bộ có thể chứa thông tin hội viên và giao dịch, khác với payload tổng hợp gửi Groq trong chức năng AI. Cần xem kỹ người nhận, quyền truy cập sheet và nội dung thực tế trước khi dùng dữ liệu thật.

Frontend kiểm tra HTTP `response.ok`; nếu body bắt đầu bằng `{`, code parse JSON và từ chối khi `success === false`. Kết quả thành công trên UI chỉ cho biết request đã được xử lý theo những kiểm tra đó, không tự chứng minh script đã ghi đầy đủ hoặc có thể khôi phục dữ liệu. Không dùng token thật khi minh họa.
