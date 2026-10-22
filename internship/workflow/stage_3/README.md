# Stage 3: Quản lý Hội viên, Danh mục gói tập và Vòng đời đăng ký

Stage này theo dõi toàn bộ hành trình của một khách hàng trong phòng gym Dương Double: từ lúc tiếp nhận thông tin tạo hồ sơ tại quầy lễ tân, phân quyền truy cập, lựa chọn gói tập trong danh mục, cho đến khi hoàn tất giao dịch đăng ký gói, phát sinh công nợ, phiếu thu và gói tập PT.

---

## 📚 Danh Mục Tài Liệu Học Tập

1. [**Hồ sơ, số điện thoại và quyền truy cập hội viên**](01_ho_so_va_quyen_hoi_vien.md)
   * Phân biệt thực thể `Member` (hồ sơ khách) và `User` (tài khoản đăng nhập).
   * Quy trình cấp Portal: OWNER chỉ cấp mới cho hội viên `ACTIVE` có gói hiệu lực; không chặn theo loại gói nên khách tự tập còn gói cũng có thể được cấp.
   * Chuẩn hóa số điện thoại Việt Nam 10 chữ số (`VietnamPhoneNormalizer`).
   * Phân quyền đa tầng chống IDOR tại `MemberAccessService` (OWNER toàn quyền; PT chỉ tiếp cận khách `ACTIVE` có gói PT hiệu lực và phân công hiệu lực của mình. Nhánh ngoại lệ chỉ áp dụng khi khách chưa từng có bản ghi phân công nào và gói chưa gắn PT khác).

2. [**Danh mục gói tập và điều kiện từng loại gói**](02_danh_muc_goi_tap.md)
   * Phân biệt `MembershipPlan` (bảng giá danh mục) và `MemberMembership` (hợp đồng bán thực tế).
   * 4 loại gói tập trong enum `PlanType`: `SELF_TRAINING`, `PT`, `GUIDANCE`, `OTHER`.
   * Kiểm tra hình dạng dữ liệu chặt chẽ (`validatePlanShape`) và quy tắc ẩn gói khi ngừng kinh doanh (`active = false`).
   * Phân biệt giá niêm yết (`defaultPrice`) và giá bán thực tế (`actualPrice`).

3. [**Đăng ký, gia hạn và vòng đời gói tập**](03_dang_ky_va_vong_doi_goi.md)
   * Điều phối giao dịch `@Transactional` trong `MemberMembershipService.create()`: khởi tạo 4 thực thể (`MemberMembership`, `DebtRecord`, `Payment`, `PtSessionPackage`).
   * Thuật toán tự động gia hạn nối tiếp (`resolveStartDate`, `resolveEndDate`) và cơ chế chống trùng thời hạn gói lịch sử.
   * Tính toán tài chính, chiết khấu, tiền thu ban đầu và đồng bộ công nợ.
   * Tính toán trạng thái hiệu lực động theo thời gian thực (`MembershipLifecyclePolicy`: `effectiveStatus`, `isEffective`, `preferredMembership`).
   * Thống kê hội viên mới vs gia hạn (`MembershipPeriodStatistics`).

---

👉 **Đọc tiếp:** [Stage 4: Công nợ, phiếu thu và quản lý tài chính](../stage_4/README.md) để tìm hiểu sâu về dòng tiền, phiếu thu, đối soát công nợ và báo cáo doanh thu phòng gym.
