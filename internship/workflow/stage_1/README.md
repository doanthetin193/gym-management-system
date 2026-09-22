# 📚 TỔNG QUAN GIAI ĐOẠN 1: NỀN TẢNG KIẾN TRÚC & BẢO MẬT BACKEND

Thư mục này chứa toàn bộ ghi chú học tập, phân tích kiến trúc chuyên sâu và sơ đồ luồng dữ liệu (workflow) của **Giai đoạn 1** thuộc dự án **Gym Dương Double**.

---

## 📑 Danh mục Tài liệu Học tập & Review

| Thứ tự | Chủ đề / Chặng | File tài liệu | Trạng thái | Nội dung chính |
| :---: | :--- | :--- | :---: | :--- |
| **01** | **Chuẩn hóa Response & Xử lý Ngoại lệ** | [01_chuan_hoa_response_va_xu_ly_ngoai_le.md](./01_chuan_hoa_response_va_xu_ly_ngoai_le.md) | ✅ Hoàn thành | Cấu trúc `ApiResponse<T>`, `ApiError`, `PageResponse<T>`, `@RestControllerAdvice` và cơ chế gom lỗi tự động |
| **02** | **Bảo mật, Stateless JWT & Phân quyền** | [02_kien_truc_bao_mat_jwt_va_xac_thuc.md](./02_kien_truc_bao_mat_jwt_va_xac_thuc.md) | ✅ Hoàn thành | Thuật toán HMAC-SHA256, Constant-Time compare, `AuthenticatedUser`, `JwtAuthenticationFilter`, `SecurityContextHolder` |
| **03** | **Quản lý Gói tập (Membership Plans)** | [03_quan_ly_goi_tap_membership_plans.md](./03_quan_ly_goi_tap_membership_plans.md) | ✅ Hoàn thành | Nghiệp vụ `MembershipPlan`, Shape validation, `@Transactional(readOnly = true)`, `BigDecimal.ZERO`, `@PreAuthorize` |
| **04** | **Quản lý Hội viên (Member Management)** | [04_quan_ly_hoi_vien_member_management.md](./04_quan_ly_hoi_vien_member_management.md) | ✅ Hoàn thành | Nghiệp vụ `Member`, Unique Phone (`ConflictException`), `ChronoUnit.DAYS.between`, Data Composition, `hasRole` convention |
| **05** | **Đăng ký Gói & Tài chính Thanh toán** | [05_dang_ky_goi_va_dong_bo_tai_chinh.md](./05_dang_ky_goi_va_dong_bo_tai_chinh.md) | ✅ Hoàn thành | Nghiệp vụ `MemberMembership`, tự sinh `DebtRecord`, tự sinh `PtSessionPackage`, gạch nợ `syncMembershipDebt`, sổ cái `FinancialTransaction(INCOME)` |
| **06** | **Khởi tạo Dữ liệu & Kiểm thử 36/36 API** | [06_kiem_thu_api_va_seed_du_lieu.md](./06_kiem_thu_api_va_seed_du_lieu.md) | ✅ Hoàn thành | Seeding tự động (`DataInitializer`), mã hóa mật khẩu `owner/change_me`, chống lộ username, kiểm thử hồi quy 36/36 kịch bản (`sprint1.http`) |

---

## 🌟 Nguyên tắc Ghi chép Tài liệu
1. **Chỉ ghi nhận kiến thức đã hiểu sâu:** Chỉ khi phân tích và thông suốt toàn bộ nghiệp vụ của một chặng thì mới đưa vào tài liệu này.
2. **Mô hình hóa trực quan:** Mọi chặng đều có sơ đồ luồng (Mermaid Flowchart / Sequence Diagram) và bảng tổng kết câu hỏi cốt lõi để dễ ôn tập và chuẩn bị báo cáo thực tập.
3. **Liên kết mã nguồn thực tế:** Mọi thành phần đều trỏ trực tiếp đến class và dòng code tương ứng trong project.
