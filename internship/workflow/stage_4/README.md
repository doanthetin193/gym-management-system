# Stage 4: Quản lý Tài chính, Công nợ và Phiếu thu

Stage này tập trung vào bài toán cốt lõi của dòng tiền phòng gym Dương Double: phân định rõ ràng giữa **Nghĩa vụ phải thu (Công nợ)** và **Dòng tiền thực thu (Phiếu thu)**, đảm bảo dữ liệu kế toán chuẩn xác, không ghi nhận doanh thu ảo, và kiểm soát chặt chẽ các rủi ro đồng thời khi thu nợ.

---

## 📚 Danh Mục Tài Liệu Học Tập

1. [**Mô hình công nợ, phiếu thu và điều phối dòng tiền**](01_cong_no_va_phieu_thu.md)
   * Bản chất nghiệp vụ: Tách biệt thực thể `DebtRecord` (Công nợ phải thu) và `Payment` (Phiếu thu dòng tiền thực tế).
   * Bảng biến thiên số dư: Gói tập 11.200.000 VNĐ qua các đợt thanh toán (chuyển khoản VietQR $\rightarrow$ tiền mặt).
   * Điều phối `@Transactional` trong `PaymentService.create()`: 6 chốt chặn nghiệp vụ, tự động phân loại doanh thu (`inferRevenueCategory`), đồng bộ trạng thái nợ (`resolveDebtStatus`).
   * Cơ chế Khóa Lạc Quan (`@Version` Optimistic Locking) trên `DebtRecord`: Chống lỗi Lost Update khi nhiều người cùng thu tiền đồng thời và xử lý lỗi `409 Conflict`.
   * Bộ câu hỏi phản biện & phỏng vấn Backend về thiết kế dữ liệu tài chính.

2. [**Trục thời gian tài chính, đối soát doanh thu và ma trận kiểm thử**](02_ngay_thu_va_kiem_thu.md)
   * 3 Trục thời gian độc lập: Thời hạn tập (`startDate`/`endDate`), Ngày thu tiền thực tế (`paymentDate`), và Dấu vết hệ thống (`createdAt`).
   * Cơ chế VietQR động trên frontend: Bản chất là tiện ích hỗ trợ chuyển khoản với mô hình **Xác nhận thủ công (Manual Confirmation)**, không phải cổng thanh toán tự động qua Webhook/IPN.
   * Tính toán doanh thu trên Dashboard: Hàm JPQL `coalesce(sum(amount), 0)` theo `paymentDate`, chỉ phản ánh **doanh thu thực thu**. Hệ thống không quản lý chi phí nên không tính và không gọi đây là lợi nhuận. Dashboard tạo thông báo `OPEN_DEBT` cho mọi khoản nợ còn số dư, sau đó sắp xếp theo `dueDate` nếu có.
   * Ma trận kiểm thử tài chính toàn diện (Test Matrix 9 ca kiểm thử từ hợp lệ đến các biên lỗi nghiệp vụ).
   * Bộ câu hỏi phản biện & phỏng vấn Backend về trục thời gian và đối soát kế toán.

---

👉 **Đọc tiếp:** [Stage 5: Quản lý Huấn luyện viên, Giáo án và Lịch tập PT](../stage_5/README.md) để tìm hiểu sâu về phân công huấn luyện, gói buổi tập PT 1-1, điểm danh buổi tập và quản lý chỉ số thể hình.
