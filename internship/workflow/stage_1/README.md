# ðŸ“š Tá»”NG QUAN GIAI ÄOáº N 1: Ná»€N Táº¢NG KIáº¾N TRÃšC & Báº¢O Máº¬T BACKEND

ThÆ° má»¥c nÃ y chá»©a toÃ n bá»™ ghi chÃº há»c táº­p, phÃ¢n tÃ­ch kiáº¿n trÃºc chuyÃªn sÃ¢u vÃ  sÆ¡ Ä‘á»“ luá»“ng dá»¯ liá»‡u (workflow) cá»§a **Giai Ä‘oáº¡n 1** thuá»™c dá»± Ã¡n **Gym DÆ°Æ¡ng Double**.

---

## ðŸ“‘ Danh má»¥c TÃ i liá»‡u Há»c táº­p & Review

| Thá»© tá»± | Chá»§ Ä‘á» / Cháº·ng | File tÃ i liá»‡u | Tráº¡ng thÃ¡i | Ná»™i dung chÃ­nh |
| :---: | :--- | :--- | :---: | :--- |
| **01** | **Chuáº©n hÃ³a Response & Xá»­ lÃ½ Ngoáº¡i lá»‡** | [01_chuan_hoa_response_va_xu_ly_ngoai_le.md](./01_chuan_hoa_response_va_xu_ly_ngoai_le.md) | âœ… HoÃ n thÃ nh | Cáº¥u trÃºc `ApiResponse<T>`, `ApiError`, `PageResponse<T>`, `@RestControllerAdvice` vÃ  cÆ¡ cháº¿ gom lá»—i tá»± Ä‘á»™ng |
| **02** | **Báº£o máº­t, Stateless JWT & PhÃ¢n quyá»n** | [02_kien_truc_bao_mat_jwt_va_xac_thuc.md](./02_kien_truc_bao_mat_jwt_va_xac_thuc.md) | âœ… HoÃ n thÃ nh | Thuáº­t toÃ¡n HMAC-SHA256, Constant-Time compare, `AuthenticatedUser`, `JwtAuthenticationFilter`, `SecurityContextHolder` |
| **03** | **Quáº£n lÃ½ GÃ³i táº­p (Membership Plans)** | [03_quan_ly_goi_tap_membership_plans.md](./03_quan_ly_goi_tap_membership_plans.md) | âœ… HoÃ n thÃ nh | Nghiá»‡p vá»¥ `MembershipPlan`, Shape validation, `@Transactional(readOnly = true)`, `BigDecimal.ZERO`, `@PreAuthorize` |
| **04** | **Quáº£n lÃ½ Há»™i viÃªn (Member Management)** | [04_quan_ly_hoi_vien_member_management.md](./04_quan_ly_hoi_vien_member_management.md) | âœ… HoÃ n thÃ nh | Nghiá»‡p vá»¥ `Member`, Unique Phone (`ConflictException`), `ChronoUnit.DAYS.between`, Data Composition, `hasRole` convention |
| **05** | **ÄÄƒng kÃ½ GÃ³i & TÃ i chÃ­nh Thanh toÃ¡n** | [05_dang_ky_goi_va_dong_bo_tai_chinh.md](./05_dang_ky_goi_va_dong_bo_tai_chinh.md) | âœ… HoÃ n thÃ nh | Nghiá»‡p vá»¥ `MemberMembership`, tá»± sinh `DebtRecord`, tá»± sinh `PtSessionPackage`, gáº¡ch ná»£ `syncMembershipDebt`, sá»• cÃ¡i `FinancialTransaction(INCOME)` |
| **06** | **Khá»Ÿi táº¡o Dá»¯ liá»‡u & Kiá»ƒm thá»­ 36/36 API** | [06_kiem_thu_api_va_seed_du_lieu.md](./06_kiem_thu_api_va_seed_du_lieu.md) | âœ… HoÃ n thÃ nh | Seeding tá»± Ä‘á»™ng (`DataInitializer`), mÃ£ hÃ³a máº­t kháº©u `owner@gymduongdouble.local/change_me`, chá»‘ng lá»™ username, kiá»ƒm thá»­ há»“i quy 36/36 ká»‹ch báº£n (`sprint1.http`) |
| **07** | **Khá»Ÿi táº¡o Frontend, Design System & Theme** | [07_khoi_tao_frontend_design_system_va_theme.md](./07_khoi_tao_frontend_design_system_va_theme.md) | âœ… HoÃ n thÃ nh | Vite + React 19, Tailwind CSS v4, CSS Custom Properties báº£ng mÃ u thÆ°Æ¡ng hiá»‡u DÆ°Æ¡ng Double, Theme Dark/Light tá»± Ä‘á»™ng |
| **08** | **Chuáº©n hÃ³a Types & API Client Axios** | [08_chuan_hoa_types_va_lop_api_client.md](./08_chuan_hoa_types_va_lop_api_client.md) | âœ… HoÃ n thÃ nh | Type-safe DTOs, `axios instance`, request interceptor gáº¯n Bearer token, response interceptor unbox `payload.data`, gom lá»—i `ApiClientError` |
| **09** | **Quáº£n lÃ½ PhiÃªn ÄÄƒng nháº­p & Auth Context** | [09_quan_ly_phien_dang_nhap_va_auth_context.md](./09_quan_ly_phien_dang_nhap_va_auth_context.md) | âœ… HoÃ n thÃ nh | React Context API, Custom Hook `useAuth`, `bootstrapping` state chá»‘ng nháº¥p nhÃ¡y mÃ n hÃ¬nh, chá»‘ng Race Condition `cancelled = true` |
| **10** | **Äá»‹nh tuyáº¿n Router, Route Guards & AppShell** | [10_dinh_tuyen_router_route_guards_va_app_shell.md](./10_dinh_tuyen_router_route_guards_va_app_shell.md) | âœ… HoÃ n thÃ nh | React Router v7 lá»“ng nhau (`<Outlet />`), `ProtectedRoute`, `PublicOnlyRoute`, Navigation config, Responsive Sidebar & Mobile Drawer |

---

## ðŸŒŸ NguyÃªn táº¯c Ghi chÃ©p TÃ i liá»‡u
1. **Chá»‰ ghi nháº­n kiáº¿n thá»©c Ä‘Ã£ hiá»ƒu sÃ¢u:** Chá»‰ khi phÃ¢n tÃ­ch vÃ  thÃ´ng suá»‘t toÃ n bá»™ nghiá»‡p vá»¥ cá»§a má»™t cháº·ng thÃ¬ má»›i Ä‘Æ°a vÃ o tÃ i liá»‡u nÃ y.
2. **MÃ´ hÃ¬nh hÃ³a trá»±c quan:** Má»i cháº·ng Ä‘á»u cÃ³ sÆ¡ Ä‘á»“ luá»“ng (Mermaid Flowchart / Sequence Diagram) vÃ  báº£ng tá»•ng káº¿t cÃ¢u há»i cá»‘t lÃµi Ä‘á»ƒ dá»… Ã´n táº­p vÃ  chuáº©n bá»‹ bÃ¡o cÃ¡o thá»±c táº­p.
3. **LiÃªn káº¿t mÃ£ nguá»“n thá»±c táº¿:** Má»i thÃ nh pháº§n Ä‘á»u trá» trá»±c tiáº¿p Ä‘áº¿n class vÃ  dÃ²ng code tÆ°Æ¡ng á»©ng trong project.

