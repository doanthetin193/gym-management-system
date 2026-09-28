# 🎯 GIAI ĐOẠN 2 (SPRINT 2) - CHẶNG 04: GIAO DIỆN QUẢN LÝ KHÁCH HÀNG & GÓI TẬP (REACT 19 / UI FEATURES)

Tài liệu này phân tích chi tiết lát cắt nghiệp vụ cuối cùng của **Sprint 2: Quản lý Hội viên & Gói tập**. Trọng tâm là 2 màn hình tương tác thực tế: **Quản lý Hội viên (`/members`)** và **Bảng giá Gói tập (`/membership-plans`)** cùng các Modal Form và Drawer chi tiết 360 độ.

---

## 🧭 1. Mục tiêu Giao diện & Trải nghiệm Người dùng (UX)

Trong Giai đoạn 2, chúng ta xây dựng 2 phân hệ UI hoàn chỉnh:
1. **Trang Quản lý Hội viên ([MembersPage.tsx](file:///d:/gym-management-system/frontend/src/features/members/pages/MembersPage.tsx)):**
   - Ô tìm kiếm thời gian thực với cơ chế **Debounce 250ms**.
   - Bộ 4 Tab lọc trạng thái CSKH: *Tất cả*, *Đang tập*, *Sắp hết hạn (7 ngày)*, *Đã hết hạn*.
   - Bảng danh sách hội viên hiển thị trực quan số ngày còn lại (Badge màu sắc tương ứng: Xanh lá cho còn hạn, Vàng cam cho sắp hết hạn, Xám đỏ cho hết hạn).
   - Drawer bên phải màn hình hiển thị hồ sơ 360 độ (Profile, Gói đang tập, Lịch sử gói, Gói PT, Tổng nợ).
   - Modal Form Tạo mới & Chỉnh sửa thông tin hội viên ([MemberFormModal.tsx](file:///d:/gym-management-system/frontend/src/features/members/components/MemberFormModal.tsx)).
2. **Trang Bảng giá Gói tập ([MembershipPlansPage.tsx](file:///d:/gym-management-system/frontend/src/features/membership-plans/pages/MembershipPlansPage.tsx)):**
   - Lưới thẻ bảng giá phân nhóm theo loại gói (`SELF_TRAINING`, `PT`, `GUIDANCE`, `OTHER`) sử dụng `useMemo` và `reduce`.
   - Modal Form Tạo gói tập mới ([MembershipPlanFormModal.tsx](file:///d:/gym-management-system/frontend/src/features/membership-plans/components/MembershipPlanFormModal.tsx)) với các trường động thay đổi linh hoạt theo loại gói.
3. **Kích hoạt Điều hướng ([navigation.ts](file:///d:/gym-management-system/frontend/src/app/navigation.ts)):**
   - Chuyển 2 mục `Khách hàng` và `Gói tập` sang `status: 'ready'` để người dùng có thể truy cập trực tiếp từ thanh Sidebar.

---

## 🏗️ 2. Phân tích Chi tiết Từng File Mã Nguồn

---

### 📌 2.1. [MemberFormModal.tsx](file:///d:/gym-management-system/frontend/src/features/members/components/MemberFormModal.tsx) - Modal Form Tái Sử Dụng

```typescript
type MemberFormModalProps = {
  mode: 'create' | 'edit'
  member?: MemberProfile | null
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: MemberPayload) => Promise<void>
}
```

#### 🔍 Các điểm kỹ thuật nổi bật:
1. **Kiến trúc Presentational Component:**
   - Component này là "cái khuôn" giao diện thuần túy, không trực tiếp gọi API Backend.
   - Khi người dùng bấm lưu, nó gom dữ liệu, làm sạch `.trim()`, đổi chuỗi rỗng `""` thành `null` rồi kích hoạt prop callback `await onSubmit(cleanPayload)` để bắn dữ liệu về cho Component Cha xử lý.
2. **Lazy Initialization:**
   - Sử dụng `useState<MemberFormState>(() => initialState(member))` để chỉ nạp dữ liệu cũ đúng 1 lần duy nhất khi Modal vừa mở lên, tránh re-calculate khi gõ phím.
3. **Controlled Inputs & Type Safety:**
   - Phân biệt rõ giữa `MemberFormState` (dành cho input HTML, chuỗi rỗng `""`) và `MemberPayload` (dữ liệu gửi mạng, giá trị `null`).

---

### 📌 2.2. [MembersPage.tsx](file:///d:/gym-management-system/frontend/src/features/members/pages/MembersPage.tsx) - Bộ Não Trung Tâm Quản Lý Hội Viên

```typescript
export function MembersPage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<MemberListFilter>('ALL')
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null)
```

#### 🔍 Các điểm kỹ thuật nổi bật:
1. **Search Debounce 250ms:**
   ```typescript
   useEffect(() => {
     const timer = window.setTimeout(() => {
       void loadMembers()
     }, 250)
     return () => window.clearTimeout(timer)
   }, [loadMembers])
   ```
   - Chống spam request khi người dùng gõ phím liên tục vào ô tìm kiếm.
2. **In-Memory Cache:**
   - Khi bấm sửa một khách hàng, kiểm tra `detail?.profile.id === member.id`. Nếu đã xem chi tiết trước đó thì lấy luôn dữ liệu trong RAM state `detail`, không gọi lại mạng.
3. **Phân nhánh Tạo mới / Chỉnh sửa trong `handleSubmit`:**
   - `mode === 'edit'`: Gọi `updateMember(editingMember.id, payload)` (PUT).
   - `mode === 'create'`: Gọi `createMember(payload)` (POST).
   - Tự động đóng modal `setFormMode(null)` và gọi `await loadMembers()` để cập nhật bảng tức thì.

---

### 📌 2.3. [MembershipPlanFormModal.tsx](file:///d:/gym-management-system/frontend/src/features/membership-plans/components/MembershipPlanFormModal.tsx) - Form Động Thông Minh

- **Conditional Form Fields (Ẩn hiện trường theo loại gói):**
  - Khi chọn `planType === 'PT'`: Mở thêm ô Cấp PT (`ptLevel`), Số buổi PT (`ptSessionCount`), Số buổi ôn tập (`practiceSessionCount`).
  - Khi chọn `planType === 'GUIDANCE'`: Mở thêm ô Số buổi giáo án (`guidanceSessionCount`).
  - Khi chọn `planType === 'SELF_TRAINING'`: Ẩn toàn bộ các ô liên quan đến PT/HLV.
- **Hàm chuyển đổi an toàn `toNumber`:**
  - `toNumber(value)` chuyển chuỗi nhập liệu thành kiểu số nguyên/thực hoặc `null` nếu để trống.

---

### 📌 2.4. [MembershipPlansPage.tsx](file:///d:/gym-management-system/frontend/src/features/membership-plans/pages/MembershipPlansPage.tsx) - Bảng Giá Phân Nhóm Thẻ Grid

- **Thuật toán gom nhóm với `useMemo` & `reduce`:**
  ```typescript
  const groupedPlans = useMemo(() => {
    return plans.reduce<Record<PlanType, MembershipPlan[]>>(
      (groups, plan) => {
        groups[plan.planType].push(plan)
        return groups
      },
      { SELF_TRAINING: [], PT: [], GUIDANCE: [], OTHER: [] }
    )
  }, [plans])
  ```
  - Tự động chia các gói tập thành 4 nhóm hiển thị rõ ràng.
- **Thẻ bảng giá (Pricing Cards):**
  - Hiển thị badge màu sắc theo loại gói (`planAccent`), giá tiền VND chuẩn hóa (`formatMoney`), và các thông số buổi tập/thời hạn.

---

### 📌 2.5. [navigation.ts](file:///d:/gym-management-system/frontend/src/app/navigation.ts) - Kích Hoạt Menu Sidebar

```typescript
export const appNavItems: AppNavItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/', status: 'ready' },
  { icon: Users, label: 'Khách hàng', path: '/members', status: 'ready' },
  { icon: Dumbbell, label: 'Gói tập', path: '/membership-plans', status: 'ready' },
  { icon: CreditCard, label: 'Thanh toán', path: '/payments', status: 'soon' },
  { icon: CalendarClock, label: 'Lịch PT', path: '/pt-schedule', status: 'soon' },
  { icon: Target, label: 'Mục tiêu', path: '/goals', status: 'soon' },
]
```
- Mở khóa chính thức 2 phân hệ `Khách hàng` và `Gói tập` sang `status: 'ready'`.
