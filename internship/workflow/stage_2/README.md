# 📚 TỔNG QUAN GIAI ĐOẠN 2 (SPRINT 2): QUẢN LÝ HỘI VIÊN & GÓI TẬP (MEMBER & MEMBERSHIP)

Thư mục này chứa toàn bộ ghi chú học tập, phân tích kiến trúc chuyên sâu và sơ đồ luồng dữ liệu (workflow) của **Giai đoạn 2 (Sprint 2)** thuộc dự án **Gym Dương Double**.

---

## 🎯 Mục tiêu Sprint 2 (Vertical Slice: Member & Membership)

Chuyển đổi hoàn toàn từ "bảng Excel quản lý khách hàng" sang hệ thống quản lý hội viên và bảng giá gói tập tự động:
1. **Quản lý Hồ sơ Hội viên Nâng cao:** Cập nhật thông tin khách, chống trùng lặp SĐT thông minh, tra cứu chi tiết trọn bộ hồ sơ (gói tập đang active, lịch sử gói, gói buổi PT, tổng nợ).
2. **Bộ lọc Chăm sóc Khách hàng:** Lọc hội viên theo trạng thái: Đang tập (`ACTIVE`), Sắp hết hạn trong vòng 7 ngày (`EXPIRING_SOON`), Đã hết hạn (`EXPIRED`).
3. **Nghiệp vụ Gia hạn Gói tập (Renewal Continuity):** Tự động kế thừa ngày hết hạn nếu gói cũ còn hiệu lực, hoặc tính từ ngày đăng ký nếu gói cũ đã hết hạn.
4. **Giao diện Người dùng Chuyên nghiệp:** Xây dựng hoàn chỉnh 2 màn hình tương tác thực tế `/members` và `/membership-plans`.

---

## 📑 Danh mục Tài liệu Học tập & Review Sprint 2

| Thứ tự | Chủ đề / Chặng | File tài liệu | Trạng thái | Nội dung chính |
| :---: | :--- | :--- | :---: | :--- |
| **01** | **Hồ sơ Hội viên Nâng cao & Bộ lọc Chăm sóc** | [01_ho_so_hoi_vien_va_bo_loc_trang_thai.md](./01_ho_so_hoi_vien_va_bo_loc_trang_thai.md) | ✅ **100% Hoàn thành** | `MemberUpdateRequest`, `MemberDetailResponse`, `MemberFilter`, check trùng SĐT ngoại trừ chính mình, gom DTO đa nguồn |
| **02** | **Nghiệp vụ Gia hạn Gói tập (Renewal Continuity)** | [02_nghiep_vu_gia_han_va_ke_thua_thoi_han.md](./02_nghiep_vu_gia_han_va_ke_thua_thoi_han.md) | ✅ **100% Hoàn thành** | Chuẩn hóa ngày bắt đầu gia hạn, tự động kích hoạt `PtSessionPackage`, kịch bản test [sprint2.http](../../backend/http/sprint2.http) |
| **03** | **Tầng Dữ liệu & API Client Frontend Sprint 2** | [03_types_va_api_client_sprint2.md](./03_types_va_api_client_sprint2.md) | ✅ **100% Hoàn thành** | `apiPut`, Type DTOs cho Member & Plan, các hàm API `memberApi.ts` & `planApi.ts` |
| **04** | **Giao diện Quản lý Khách hàng & Gói tập** | [04_giao_dien_members_va_membership_plans.md](./04_giao_dien_members_va_membership_plans.md) | ✅ **100% Hoàn thành** | Màn hình `/members`, Modal Tạo/Sửa, Drawer Chi tiết hội viên, Màn hình `/membership-plans`, thẻ bảng giá phân nhóm |
| **05** | **Chuyên đề Dòng chảy Dữ liệu Đầu-Cuối (End-to-End)** | [05_luong_du_lieu_dau_cuoi_end_to_end.md](./05_luong_du_lieu_dau_cuoi_end_to_end.md) | ✅ **100% Hoàn thành** | Mổ xẻ 6 giai đoạn chi tiết từ React UI $\rightarrow$ API Client $\rightarrow$ Spring Security $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ PostgreSQL $\rightarrow$ React Re-render |

---

## 🌟 Nguyên tắc Review Sprint 2
- **Đi sâu từng lát cắt:** Tiếp tục phân tích kỹ từng file mã nguồn cả Backend (Java 21) lẫn Frontend (React 19 / TypeScript) để bạn làm chủ 100% nghiệp vụ và tự tin bảo vệ đồ án thực tập.
