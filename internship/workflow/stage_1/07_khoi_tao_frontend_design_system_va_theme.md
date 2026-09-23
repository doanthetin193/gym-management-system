# CHẶNG 07: KHỞI TẠO FRONTEND, DESIGN SYSTEM & THEME

Tài liệu này ghi chú phần khởi tạo frontend của hệ thống Gym Dương Double. Mục tiêu của chặng này là dựng nền tảng giao diện đủ chuẩn để các chặng sau chỉ cần bổ sung nghiệp vụ, không phải sửa lại cấu trúc từ đầu.

---

## 1. Mục tiêu

1. Dựng frontend bằng **React + TypeScript + Vite**.
2. Dùng **Tailwind CSS v4** để xây giao diện nhanh, thống nhất và dễ bảo trì.
3. Dùng **lucide-react** cho icon trong sidebar, button và dashboard.
4. Dùng **axios** cho tầng HTTP client ở chặng 08.
5. Tạo design tokens theo nhận diện của phòng gym: vàng, đỏ, xanh, đen/trắng.
6. Hỗ trợ **light theme** và **dark theme**.

---

## 2. Công nghệ đã dùng

| Công nghệ | Vai trò |
| :--- | :--- |
| `React` | Xây dựng giao diện dạng component. |
| `TypeScript` | Bắt lỗi kiểu dữ liệu sớm, dễ đọc DTO từ backend. |
| `Vite` | Dev server và build frontend nhanh. |
| `Tailwind CSS v4` | Utility CSS, tích hợp trực tiếp bằng `@tailwindcss/vite`. |
| `lucide-react` | Icon đồng bộ, nhẹ và dễ dùng. |
| `axios` | Gọi API qua một instance tập trung, có interceptor. |
| `oxlint` | Kiểm tra chất lượng code frontend. |

---

## 3. Cấu trúc frontend hiện tại

```txt
frontend/src/
  app/
    App.tsx
    AppProviders.tsx
    navigation.ts
    router/
      ProtectedRoute.tsx
      PublicOnlyRoute.tsx

  layouts/
    AppShell.tsx

  features/
    auth/
    dashboard/
    members/
    membership-plans/
    payments/
    pt-schedule/
    goals/

  shared/
    api/
    components/
    lib/
    types/
```

Ý nghĩa:

| Thư mục | Vai trò |
| :--- | :--- |
| `app/` | Điểm cấu hình cấp ứng dụng: router, providers, navigation. |
| `layouts/` | Khung giao diện dùng chung sau khi đăng nhập. |
| `features/` | Mỗi nghiệp vụ nằm trong một module riêng. |
| `shared/` | Code dùng chung: API client, component nhỏ, helper, type chung. |

Cách chia này khác với kiểu gom tất cả vào `components/`, `pages/`, `services/`. Với dự án nghiệp vụ, chia theo `features` giúp mỗi module tự quản lý page, API, type và logic riêng, dễ mở rộng hơn.

---

## 4. Design tokens và theme

File chính: [index.css](file:///d:/gym-management-system/frontend/src/index.css)

Các màu nhận diện được đưa vào CSS variables:

```css
:root {
  --brand-yellow: #ffcc08;
  --brand-red: #df271b;
  --brand-blue: #087ec1;

  --app-bg: #f6f7fb;
  --surface: #ffffff;
  --text: #273142;
  --text-strong: #0d1117;
  --text-muted: #647084;
}

.dark {
  --app-bg: #050505;
  --surface: #101216;
  --text: #d6d9df;
  --text-strong: #ffffff;
  --text-muted: #939bad;
}
```

Khi component dùng class như:

```tsx
className="bg-[var(--surface)] text-[var(--text)]"
```

màu sẽ tự đổi theo theme mà không cần lặp nhiều class `dark:*`.

---

## 5. ThemeToggle

File chính: [ThemeToggle.tsx](file:///d:/gym-management-system/frontend/src/shared/components/ThemeToggle.tsx)

Luồng xử lý:

1. Đọc theme đã lưu trong `localStorage`.
2. Nếu chưa có, dùng `window.matchMedia('(prefers-color-scheme: dark)')`.
3. Gắn hoặc bỏ class `.dark` trên thẻ `<html>`.
4. Lưu lựa chọn mới sau khi người dùng bấm nút.

Điểm cần nhớ:

```tsx
document.documentElement.classList.toggle('dark', theme === 'dark')
```

`document.documentElement` chính là thẻ `<html>`. Khi thẻ này có class `dark`, toàn bộ biến màu trong `.dark` sẽ có hiệu lực.

---

## 6. BrandMark

File chính: [BrandMark.tsx](file:///d:/gym-management-system/frontend/src/shared/components/BrandMark.tsx)

Logo thật của phòng gym được đặt tại:

```txt
frontend/public/logo.jpg
```

Trong React, file trong `public/` được dùng trực tiếp bằng path:

```tsx
<img src="/logo.jpg" alt="Duong Double" />
```

`BrandMark` có prop `compact` để dùng cùng một component cho sidebar desktop và topbar mobile.

---

## 7. Ghi nhớ nhanh

| Khái niệm | Ý nghĩa |
| :--- | :--- |
| `CSS Custom Properties` | Biến CSS giúp đổi theme toàn hệ thống. |
| `@custom-variant dark` | Cấu hình dark mode theo class `.dark` trong Tailwind v4. |
| `public/logo.jpg` | Asset public được truy cập từ root path `/logo.jpg`. |
| `features/` | Tổ chức code theo nghiệp vụ, hợp với dự án dài hơi. |
| `shared/` | Chứa phần dùng chung, không phụ thuộc module nghiệp vụ cụ thể. |
