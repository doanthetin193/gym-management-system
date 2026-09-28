# 🚀 GIAI ĐOẠN 2 (SPRINT 2) - CHUYÊN ĐỀ ĐẶC BIỆT: DÒNG CHẢY DỮ LIỆU ĐẦU-CUỐI (END-TO-END DATA FLOW)
## PHÂN TÍCH MẪU MỰC: LUỒNG CẬP NHẬT HỘI VIÊN (`PUT /v1/members/{id}`)

Tài liệu này ghi lại toàn bộ lộ trình dòng chảy dữ liệu (Data Flow) từ cú click chuột của người dùng trên giao diện React 19, đi qua tầng mạng HTTP, xuyên qua các lớp bảo mật và nghiệp vụ của Spring Boot 4, ghi xuống cơ sở dữ liệu PostgreSQL, rồi quay ngược trở lại cập nhật giao diện người dùng.

---

## 🗺️ BẢN ĐỒ TỔNG THỂ DÒNG CHẢY 6 GIAI ĐOẠN

```
[1. React UI: Click nút Sửa trên Bảng]
              │
              ▼
[2. Form Modal: Nạp State cũ & Gõ sửa SĐT/Địa chỉ]
              │
              ▼
[3. Form Submit: Chặn reload, dọn sạch dữ liệu MemberPayload]
              │
              ▼
[4. API Client: apiPut & Request Interceptor tự động gắn JWT Bearer]
              │
══════════════╪═══════════════════════════════════════════════ (ĐƯỜNG TRUYỀN MẠNG HTTP)
              ▼
[5. Spring Security: JwtAuthenticationFilter giải mã Token & xác nhận ROLE_OWNER]
              │
              ▼
[6. MemberController: @PreAuthorize, @PathVariable & @Valid MemberUpdateRequest]
              │
              ▼
[7. MemberService: Kiểm tra chống trùng SĐT existsByPhoneAndIdNot & Hibernate SQL UPDATE]
              │
              ▼
[8. PostgreSQL: Ghi dữ liệu mới xuống đĩa cứng & Commit Transaction]
              │
══════════════╪═══════════════════════════════════════════════ (HTTP 200 OK + JSON DATA)
              ▼
[9. Axios Response Interceptor: unboxApiResponse bóc phong bì, lấy ruột payload.data]
              │
              ▼
[10. MembersPage: Đóng Modal Form & Gọi loadMembers() tải lại Bảng tức thì!]
```

---

## 🔍 CHI TIẾT TỪNG GIAI ĐOẠN

---

### 📍 Giai đoạn 1: Bắt đầu tại Giao diện React (Bấm Sửa & Mở Modal)
- **Tập tin:** [MembersPage.tsx](file:///d:/gym-management-system/frontend/src/features/members/pages/MembersPage.tsx)
- Người dùng bấm vào nút cây bút chì `<Pencil size={17} />` ở dòng của một hội viên.
- Hàm `openEditModal(member)` kích hoạt:
  - Kiểm tra Cache trong RAM: Nếu `detail?.profile.id === member.id` thì lấy luôn `detail`, nếu chưa có thì gọi `await getMemberDetail(member.id)`.
  - Gán `editingMember = loadedDetail.profile`.
  - Đặt `formMode = 'edit'` $\rightarrow$ Render `<MemberFormModal mode="edit" member={editingMember} onSubmit={handleSubmit} />`.
- Trong [MemberFormModal.tsx](file:///d:/gym-management-system/frontend/src/features/members/components/MemberFormModal.tsx):
  - Hàm `initialState(member)` chạy đúng 1 lần (Lazy Initialization) để đổ dữ liệu cũ vào State `form`.
  - Người dùng gõ sửa SĐT hoặc Địa chỉ $\rightarrow$ Sự kiện `onChange` cập nhật từng ký tự vào `form` state.

---

### 📍 Giai đoạn 2: Bấm nút "Lưu hội viên" & Cầu nối Cha - Con
- **Tập tin:** [MemberFormModal.tsx](file:///d:/gym-management-system/frontend/src/features/members/components/MemberFormModal.tsx)
- Người dùng bấm nút submit $\rightarrow$ Thẻ `<form onSubmit={handleSubmit}>` bắt sự kiện và kích hoạt `handleSubmit(event)` của Con:
  1. `event.preventDefault()`: Chặn trình duyệt reload toàn bộ trang web.
  2. Làm sạch dữ liệu: `.trim()` cắt khoảng trắng, đổi chuỗi rỗng `""` thành `null`.
  3. Kích hoạt chiếc cầu nối: `await onSubmit(cleanPayload)` $\rightarrow$ Chuyển quyền thực thi sang hàm `handleSubmit(payload)` của Cha ([MembersPage.tsx](file:///d:/gym-management-system/frontend/src/features/members/pages/MembersPage.tsx)).
- Cha đặt `setSubmitting(true)` để vô hiệu hóa (`disabled`) nút bấm, chống người dùng bấm spam nhiều lần.

---

### 📍 Giai đoạn 3: Đóng gói Giao thức HTTP & Bọc Token Bảo mật
- **Tập tin:** [memberApi.ts](file:///d:/gym-management-system/frontend/src/features/members/api/memberApi.ts) & [apiClient.ts](file:///d:/gym-management-system/frontend/src/shared/api/apiClient.ts)
- `updateMember(5, payload)` gọi `apiPut<MemberProfile>('/v1/members/5', payload)`.
- **Request Interceptor tự động can thiệp:**
  - Móc Token JWT từ `localStorage.getItem('gym_access_token')`.
  - Gắn vào Header: `Authorization: Bearer eyJhbGciOi...`
- Gói tin HTTP chuẩn mực được gửi đi:
  ```http
  PUT /api/v1/members/5 HTTP/1.1
  Host: localhost:8080
  Accept: application/json
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOi...

  {
    "fullName": "Nguyễn Văn A",
    "phone": "0912345678",
    "address": "123 Lê Duẩn, Quy Nhơn",
    "status": "ACTIVE"
  }
  ```

---

### 📍 Giai đoạn 4: Cửa khẩu Bảo mật & Tầng Web Controller
- **Tập tin:** [MemberController.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/web/MemberController.java)
1. **Spring Security Filter:** `JwtAuthenticationFilter` giải mã Token, xác thực chữ ký và kiểm tra quyền `ROLE_OWNER`.
2. **Controller `@PreAuthorize("hasRole('OWNER')")`:** Nếu không phải Chủ phòng $\rightarrow$ Trả về `403 Forbidden`.
3. **`@PathVariable Long id`:** Trích xuất số `5` từ URL.
4. **`@Valid @RequestBody MemberUpdateRequest request`:** Hibernate Validator kiểm tra `@NotBlank` của `fullName` và `phone`. Nếu để trống $\rightarrow$ Trả về `400 Bad Request`.
5. Dữ liệu hợp lệ $\rightarrow$ Chuyển giao cho `memberService.update(5L, request)`.

---

### 📍 Giai đoạn 5: Tầng Service & Câu lệnh SQL PostgreSQL
- **Tập tin:** [MemberService.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/service/MemberService.java) & [MemberRepository.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/repository/MemberRepository.java)
1. Mở giao dịch `@Transactional`.
2. `Member member = findEntity(5L)`: Tìm khách trong DB (`SELECT * FROM members WHERE id = 5`).
3. **Phép thử chống trùng SĐT:**
   ```sql
   SELECT count(*) > 0 FROM members WHERE phone = '0912345678' AND id <> 5;
   ```
   - Nếu có người khác dùng số này $\rightarrow$ Ném `ConflictException` $\rightarrow$ Trả về HTTP `409 Conflict`.
   - Nếu không trùng (hoặc khách giữ nguyên số cũ của chính họ) $\rightarrow$ Cho phép đi tiếp.
4. Gán các trường mới vào Entity `member`.
5. **Ghi xuống đĩa cứng:**
   ```sql
   UPDATE members 
   SET full_name = 'Nguyễn Văn A', phone = '0912345678', address = '123 Lê Duẩn, Quy Nhơn', status = 'ACTIVE', updated_at = NOW() 
   WHERE id = 5;
   ```
6. Commit Transaction và chuyển đổi Entity sang DTO `MemberResponse`.

---

### 📍 Giai đoạn 6: Đón nhận Phản hồi & Tự động Cập nhật UI
- **Tập tin:** [apiClient.ts](file:///d:/gym-management-system/frontend/src/shared/api/apiClient.ts) & [MembersPage.tsx](file:///d:/gym-management-system/frontend/src/features/members/pages/MembersPage.tsx)
1. Server trả về JSON mã `200 OK` bọc trong `ApiResponse<MemberResponse>`.
2. **Axios Response Interceptor (`unboxApiResponse`):**
   - Bóc bỏ lớp vỏ `"success": true`, chỉ trả về phần ruột `payload.data`.
3. **Component Cha `MembersPage.tsx` tiếp nhận:**
   - Gọi `loadDetail(updated.id)` nếu đang mở xem đúng khách này ở khung chi tiết.
   - Gọi `setFormMode(null)` $\rightarrow$ **Modal Form tự động biến mất!**
   - Gọi `await loadMembers()` $\rightarrow$ Bảng danh sách tự động tải lại dòng của anh A với SĐT và địa chỉ mới nhất.
   - Toàn bộ quá trình diễn ra tức thì, không cần tải lại trang web!

---

### 🚨 Nhánh Bắt Lỗi (Ví dụ Sửa Trùng SĐT Người Khác):
- Backend phát hiện trùng $\rightarrow$ Trả về HTTP `409 Conflict`.
- `normalizeApiError` ném `ApiClientError` $\rightarrow$ Khối `catch` trong `handleSubmit` gán `setFormError("Số điện thoại đã tồn tại...")`.
- **UI phản ứng:** Modal VẪN MỞ NGUYÊN, dữ liệu người dùng vừa gõ KHÔNG BỊ MẤT, một khung màu đỏ rực hiện lên báo lỗi rõ ràng để người dùng chỉnh sửa lại!
