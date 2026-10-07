# CHáº¶NG 10: ROUTER, ROUTE GUARDS & APP SHELL

TÃ i liá»‡u nÃ y ghi chÃº cÃ¡ch tá»• chá»©c routing vÃ  layout chÃ­nh cá»§a frontend sau khi Ä‘Ã£ cÃ³ `AuthProvider` vÃ  axios API client.

---

## 1. Má»¥c tiÃªu

1. DÃ¹ng `react-router-dom` Ä‘á»ƒ quáº£n lÃ½ URL.
2. TÃ¡ch route cÃ´ng khai vÃ  route cáº§n Ä‘Äƒng nháº­p.
3. DÃ¹ng `ProtectedRoute` Ä‘á»ƒ báº£o vá»‡ dashboard vÃ  cÃ¡c mÃ n hÃ¬nh nghiá»‡p vá»¥.
4. DÃ¹ng `PublicOnlyRoute` Ä‘á»ƒ cháº·n ngÆ°á»i Ä‘Ã£ Ä‘Äƒng nháº­p quay láº¡i `/login`.
5. DÃ¹ng `AppShell` lÃ m layout chung sau khi Ä‘Äƒng nháº­p.
6. Dá»±ng sáºµn cÃ¡c route nghiá»‡p vá»¥ Ä‘á»ƒ Sprint sau chá»‰ cáº§n thay placeholder báº±ng mÃ n hÃ¬nh tháº­t.

---

## 2. CÃ¢y route hiá»‡n táº¡i

File chÃ­nh: [App.tsx](file:///d:/gym-management-system/frontend/src/app/App.tsx)

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

CÃ¡c route:

| URL | Vai trÃ² |
| :--- | :--- |
| `/login` | MÃ n hÃ¬nh Ä‘Äƒng nháº­p. |
| `/` | Dashboard sau khi Ä‘Äƒng nháº­p. |
| `/members` | Module khÃ¡ch hÃ ng. |
| `/membership-plans` | Module gÃ³i táº­p. |
| `/payments` | Module thanh toÃ¡n/cÃ´ng ná»£. |
| `/pt-schedule` | Module lá»‹ch PT/check-in sau nÃ y. |
| `/goals` | Module má»¥c tiÃªu thÃ¡ng/nÄƒm. |

---

## 3. ProtectedRoute

File chÃ­nh: [ProtectedRoute.tsx](file:///d:/gym-management-system/frontend/src/app/router/ProtectedRoute.tsx)

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

Ã nghÄ©a:

1. Náº¿u app Ä‘ang kiá»ƒm tra phiÃªn, hiá»ƒn thá»‹ tráº¡ng thÃ¡i loading.
2. Náº¿u kiá»ƒm tra xong mÃ  chÆ°a cÃ³ user, chuyá»ƒn vá» `/login`.
3. Náº¿u cÃ³ user, render `AppShell`.

`ProtectedRoute` khÃ´ng tá»± gá»i API. NÃ³ chá»‰ Ä‘á»c tráº¡ng thÃ¡i tá»« `AuthProvider`. Viá»‡c xÃ¡c minh token Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ trÆ°á»›c Ä‘Ã³ báº±ng `/v1/auth/me`.

---

## 4. PublicOnlyRoute

File chÃ­nh: [PublicOnlyRoute.tsx](file:///d:/gym-management-system/frontend/src/app/router/PublicOnlyRoute.tsx)

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

Ã nghÄ©a:

1. Khi Ä‘ang bootstrap, chÆ°a render gÃ¬ Ä‘á»ƒ trÃ¡nh nhÃ¡y mÃ n hÃ¬nh.
2. Náº¿u Ä‘Ã£ Ä‘Äƒng nháº­p, khÃ´ng cho vÃ o `/login`.
3. Náº¿u chÆ°a Ä‘Äƒng nháº­p, render `LoginPage` qua `<Outlet />`.

---

## 5. AppShell

File chÃ­nh: [AppShell.tsx](file:///d:/gym-management-system/frontend/src/layouts/AppShell.tsx)

`AppShell` lÃ  khung giao diá»‡n sau Ä‘Äƒng nháº­p, gá»“m:

1. Sidebar desktop.
2. Topbar.
3. Mobile drawer.
4. NÃºt Ä‘á»•i theme.
5. NÃºt Ä‘Äƒng xuáº¥t.
6. Khu vá»±c `<Outlet />` Ä‘á»ƒ render page con.

Äiá»ƒm quan trá»ng:

```tsx
<main className="px-4 py-6 md:px-6">
  <Outlet />
</main>
```

`Outlet` lÃ  vá»‹ trÃ­ mÃ  React Router nhÃºng `DashboardPage`, `MembersPage`, `PaymentsPage`,... tÃ¹y theo URL hiá»‡n táº¡i.

---

## 6. Navigation config

File chÃ­nh: [navigation.ts](file:///d:/gym-management-system/frontend/src/app/navigation.ts)

```ts
export type AppNavItem = {
  label: string
  path: string
  icon: LucideIcon
  status?: 'ready' | 'soon'
}
```

Sidebar khÃ´ng hard-code tá»«ng item trá»±c tiáº¿p trong JSX. Thay vÃ o Ä‘Ã³, menu Ä‘Æ°á»£c sinh tá»« `appNavItems`. CÃ¡ch nÃ y giÃºp:

1. Dá»… thÃªm route má»›i.
2. Dá»… Ä‘á»•i label/icon.
3. Dá»… Ä‘Ã¡nh dáº¥u module nÃ o Ä‘Ã£ sáºµn sÃ ng, module nÃ o lÃ  Sprint sau.

---

## 7. LoginPage vÃ  lá»—i API

File chÃ­nh: [LoginPage.tsx](file:///d:/gym-management-system/frontend/src/features/auth/pages/LoginPage.tsx)

Login page gá»i:

```ts
await login(email, password)
```

Náº¿u backend tráº£ lá»—i, táº§ng axios interceptor sáº½ nÃ©m `ApiClientError`. UI chá»‰ cáº§n báº¯t lá»—i vÃ  hiá»ƒn thá»‹:

```ts
if (caughtError instanceof ApiClientError) {
  setError(caughtError.message)
}
```

Nhá» váº­y `LoginPage` khÃ´ng cáº§n biáº¿t backend tráº£ envelope `{ success, data, error }` nhÆ° tháº¿ nÃ o.

---

## 8. CÃ¡c route nghiá»‡p vá»¥ hiá»‡n táº¡i

CÃ¡c page nhÆ° `MembersPage`, `MembershipPlansPage`, `PaymentsPage`, `PtSchedulePage`, `GoalsPage` hiá»‡n Ä‘ang dÃ¹ng `ComingSoonPage`.

ÄÃ¢y khÃ´ng pháº£i code thá»«a. Má»¥c Ä‘Ã­ch lÃ :

1. Chá»‘t sáºµn route vÃ  layout.
2. Cho sidebar Ä‘iá»u hÆ°á»›ng Ä‘Æ°á»£c tháº­t.
3. GiÃºp Sprint sau thay dáº§n placeholder báº±ng mÃ n hÃ¬nh nghiá»‡p vá»¥.
4. TrÃ¡nh phÃ¡t triá»ƒn frontend thiáº¿u Ä‘á»‹nh hÆ°á»›ng.

---

## 9. Ghi nhá»› nhanh

| KhÃ¡i niá»‡m | Ã nghÄ©a |
| :--- | :--- |
| `BrowserRouter` | Báº­t routing phÃ­a frontend. |
| `Routes` / `Route` | Khai bÃ¡o cÃ¢y URL. |
| `ProtectedRoute` | Cháº·n route cáº§n Ä‘Äƒng nháº­p. |
| `PublicOnlyRoute` | Cháº·n user Ä‘Ã£ Ä‘Äƒng nháº­p vÃ o láº¡i trang login. |
| `Navigate replace` | Redirect mÃ  khÃ´ng táº¡o lá»‹ch sá»­ dÆ° trong browser. |
| `Outlet` | Vá»‹ trÃ­ render route con trong layout cha. |
| `AppShell` | Layout chung cho toÃ n bá»™ mÃ n hÃ¬nh sau Ä‘Äƒng nháº­p. |

