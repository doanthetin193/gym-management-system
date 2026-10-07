# 📚 TỔNG QUAN GIAI ĐOẠN 3 (SPRINT 3): QUẢN LÝ THANH TOÁN & CÔNG NỢ (PAYMENT & DEBT MANAGEMENT)

Thư mục này chứa toàn bộ ghi chú học tập, phân tích kiến trúc chuyên sâu và sơ đồ luồng dữ liệu (workflow) của **Giai đoạn 3 (Sprint 3)** thuộc dự án **Gym Dương Double**.

---

## 🎯 Mục tiêu Sprint 3 (Vertical Slice: Payment & Debt Management)

Chuyển đổi phân hệ tài chính từ ghi sổ tay sang hệ thống thu tiền và quản lý công nợ tự động:
1. **Quản lý Công nợ Toàn diện (`GET /v1/debts`):** Tra cứu danh sách công nợ khách hàng, lọc theo trạng thái Đang nợ (`OPEN`), Đã trả một phần (`PARTIALLY_PAID`), Đã tất toán (`PAID`), hoặc theo từng Hội viên.
2. **Thu tiền & Lập Phiếu thu (`POST /v1/payments`):** Tiếp nhận thanh toán theo `debtRecordId` hoặc `membershipId`, hỗ trợ thanh toán từng phần (trả góp) hoặc tất toán 100%.
3. **Đồng bộ Dữ liệu Tài chính Đa Phân hệ:** Tự động trừ nợ trong `DebtRecord`, cập nhật `paidAmount` và `debtAmount` trong `MemberMembership`, và lưu lịch sử vào `payment_transactions`.
4. **Lịch sử Giao dịch & Dòng tiền (`GET /v1/payments`):** Tra cứu dòng tiền theo phương thức thanh toán (Tiền mặt, Chuyển khoản, POS, Khác), theo ngày thu và nhân viên thu ngân.
5. **Giao diện Người dùng Chuyên nghiệp (`/payments`):** Xây dựng hoàn chỉnh màn hình Quản lý công nợ & Lịch sử thanh toán kèm Modal Form thu tiền nhanh.

---

## 📑 Danh mục 4 Chặng Độc lập của Stage 3

| Thứ tự | Chủ đề / Chặng | File tài liệu | Trạng thái | Nội dung chính |
| :---: | :--- | :--- | :---: | :--- |
| **01** | **Nghiệp vụ Quản lý Công nợ & Lập Phiếu thu** | [`01_nghiep_vu_cong_no_va_lap_phieu_thu.md`](./01_nghiep_vu_cong_no_va_lap_phieu_thu.md) | 🟢 Hoàn thành tài liệu | `PaymentController`, `DebtController`, `PaymentService`, `CreatePaymentRequest`, `DebtRecordResponse`, `PaymentResponse` |
| **02** | **Đồng bộ Tài chính & Kịch bản Kiểm thử Runtime** | `02_dong_bo_tai_chinh_va_kiem_thu_sprint3.md` | ⏳ Đang mở | Transactional sync giữa `DebtRecord` và `MemberMembership`, 15 ca test runtime trong [sprint3.http](../../backend/http/sprint3.http) |
| **03** | **Tầng Dữ liệu & API Client Frontend Sprint 3** | `03_types_va_api_client_sprint3.md` | ⏳ Đang mở | TypeScript Types `payment.ts`, API Service `paymentApi.ts` (`listDebts`, `listPayments`, `createPayment`) |
| **04** | **Giao diện Quản lý Thanh toán & Thu tiền** | `04_giao_dien_thanh_toan_va_cong_no.md` | ⏳ Đang mở | Màn hình `/payments` (Tabs Công nợ / Lịch sử), Modal Form thu tiền `PaymentFormModal.tsx`, kích hoạt `navigation.ts` |

---

## 🌟 Nguyên tắc Review Sprint 3
- Tiếp tục phương pháp mổ xẻ từng file từ nhỏ đến lớn (Bottom-Up) và phân tích dòng chảy dữ liệu đầu-cuối (End-to-End) để làm chủ 100% nghiệp vụ tài chính.
