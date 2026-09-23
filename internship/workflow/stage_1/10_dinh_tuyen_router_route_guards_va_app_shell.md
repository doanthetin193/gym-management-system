# CHẶNG 10: ROUTER, ROUTE GUARDS & APP SHELL

Tài liệu này ghi chú cách tổ chức routing và layout chính của frontend sau khi đã có `AuthProvider` và axios API client.

---

## 1. Mục tiêu

1. Dùng `react-router-dom` để quản lý URL.
2. Tách route công khai và route cần đăng nhập.
3. Dùng `ProtectedRoute` để bảo vệ dashboard và các màn hình nghiệp vụ.
4. Dùng `PublicOnlyRoute` để chặn người đã đăng nhập quay lại `/login`.
5. Dùng `AppShell` làm layout chung sau khi đăng nhập.
6. Dựng sẵn các route nghiệp vụ để Sprint sau chỉ cần thay placeholder bằng màn hình thật.

---

## 2. Cây route hiện tại

File chính: [App.tsx](file:///d:/gym-management-system/frontend/src/app/App.tsx)

```tsx
<Routes>
  <Route path="/login" element={<PublicOnlyRoute />}>
    <Route index element={<LoginPage />} />
  </Route>

  <Route element={<ProtectedRoute />}>
    <Route index element={<DashboardPage />} />
    <Route path="/members" element={<MembersPage />} />
    <Route path="/membership-plans" element={<MembershipPlansPage />} />
    <Route path="/payments" element={<PaymentsPage />} />
    <Route path="/pt-schedule" element={<PtSchedulePage />} />
    <Route path="/goals" element={<GoalsPage />} />
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Các route:

| URL | Vai trò |
| :--- | :--- |
| `/login` | Màn hình đăng nhập. |
| `/` | Dashboard sau khi đăng nhập. |
| `/members` | Module khách hàng. |
| `/membership-plans` | Module gói tập. |
| `/payments` | Module thanh toán/công nợ. |
| `/pt-schedule` | Module lịch PT/check-in sau này. |
| `/goals` | Module mục tiêu tháng/năm. |

---

## 3. ProtectedRoute

File chính: [ProtectedRoute.tsx](file:///d:/gym-management-system/frontend/src/app/router/ProtectedRoute.tsx)

```tsx
export function ProtectedRoute() {
  const { bootstrapping, user } = useAuth()

  if (bootstrapping) {
    return <LoadingSession />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <AppShell />
}
```

Ý nghĩa:

1. Nếu app đang kiểm tra phiên, hiển thị trạng thái loading.
2. Nếu kiểm tra xong mà chưa có user, chuyển về `/login`.
3. Nếu có user, render `AppShell`.

`ProtectedRoute` không tự gọi API. Nó chỉ đọc trạng thái từ `AuthProvider`. Việc xác minh token đã được xử lý trước đó bằng `/v1/auth/me`.

---

## 4. PublicOnlyRoute

File chính: [PublicOnlyRoute.tsx](file:///d:/gym-management-system/frontend/src/app/router/PublicOnlyRoute.tsx)

```tsx
export function PublicOnlyRoute() {
  const { bootstrapping, user } = useAuth()

  if (bootstrapping) {
    return null
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

Ý nghĩa:

1. Khi đang bootstrap, chưa render gì để tránh nháy màn hình.
2. Nếu đã đăng nhập, không cho vào `/login`.
3. Nếu chưa đăng nhập, render `LoginPage` qua `<Outlet />`.

---

## 5. AppShell

File chính: [AppShell.tsx](file:///d:/gym-management-system/frontend/src/layouts/AppShell.tsx)

`AppShell` là khung giao diện sau đăng nhập, gồm:

1. Sidebar desktop.
2. Topbar.
3. Mobile drawer.
4. Nút đổi theme.
5. Nút đăng xuất.
6. Khu vực `<Outlet />` để render page con.

Điểm quan trọng:

```tsx
<main className="px-4 py-6 md:px-6">
  <Outlet />
</main>
```

`Outlet` là vị trí mà React Router nhúng `DashboardPage`, `MembersPage`, `PaymentsPage`,... tùy theo URL hiện tại.

---

## 6. Navigation config

File chính: [navigation.ts](file:///d:/gym-management-system/frontend/src/app/navigation.ts)

```ts
export type AppNavItem = {
  label: string
  path: string
  icon: LucideIcon
  status?: 'ready' | 'soon'
}
```

Sidebar không hard-code từng item trực tiếp trong JSX. Thay vào đó, menu được sinh từ `appNavItems`. Cách này giúp:

1. Dễ thêm route mới.
2. Dễ đổi label/icon.
3. Dễ đánh dấu module nào đã sẵn sàng, module nào là Sprint sau.

---

## 7. LoginPage và lỗi API

File chính: [LoginPage.tsx](file:///d:/gym-management-system/frontend/src/features/auth/pages/LoginPage.tsx)

Login page gọi:

```ts
await login(username, password)
```

Nếu backend trả lỗi, tầng axios interceptor sẽ ném `ApiClientError`. UI chỉ cần bắt lỗi và hiển thị:

```ts
if (caughtError instanceof ApiClientError) {
  setError(caughtError.message)
}
```

Nhờ vậy `LoginPage` không cần biết backend trả envelope `{ success, data, error }` như thế nào.

---

## 8. Các route nghiệp vụ hiện tại

Các page như `MembersPage`, `MembershipPlansPage`, `PaymentsPage`, `PtSchedulePage`, `GoalsPage` hiện đang dùng `ComingSoonPage`.

Đây không phải code thừa. Mục đích là:

1. Chốt sẵn route và layout.
2. Cho sidebar điều hướng được thật.
3. Giúp Sprint sau thay dần placeholder bằng màn hình nghiệp vụ.
4. Tránh phát triển frontend thiếu định hướng.

---

## 9. Ghi nhớ nhanh

| Khái niệm | Ý nghĩa |
| :--- | :--- |
| `BrowserRouter` | Bật routing phía frontend. |
| `Routes` / `Route` | Khai báo cây URL. |
| `ProtectedRoute` | Chặn route cần đăng nhập. |
| `PublicOnlyRoute` | Chặn user đã đăng nhập vào lại trang login. |
| `Navigate replace` | Redirect mà không tạo lịch sử dư trong browser. |
| `Outlet` | Vị trí render route con trong layout cha. |
| `AppShell` | Layout chung cho toàn bộ màn hình sau đăng nhập. |
