# CHáº¶NG 09: QUáº¢N LÃ PHIÃŠN ÄÄ‚NG NHáº¬P & AUTH CONTEXT

TÃ i liá»‡u nÃ y ghi chÃº cÃ¡ch frontend quáº£n lÃ½ phiÃªn Ä‘Äƒng nháº­p sau khi Ä‘Ã£ cÃ³ táº§ng API client báº±ng axios interceptor.

---

## 1. Má»¥c tiÃªu

1. LÆ°u thÃ´ng tin user hiá»‡n táº¡i á»Ÿ cáº¥p toÃ n cá»¥c.
2. Cho component báº¥t ká»³ láº¥y Ä‘Æ°á»£c `user`, `token`, `login()`, `logout()`.
3. Khi refresh trang, tá»± kiá»ƒm tra token cÃ²n há»£p lá»‡ báº±ng `/v1/auth/me`.
4. TrÃ¡nh nhÃ¡y mÃ n hÃ¬nh login trong lÃºc Ä‘ang kiá»ƒm tra phiÃªn.
5. KhÃ´ng truyá»n token thá»§ cÃ´ng vÃ o tá»«ng API ná»¯a, vÃ¬ request interceptor Ä‘Ã£ tá»± gáº¯n token.

---

## 2. AuthContext

File chÃ­nh: [authContext.ts](file:///d:/gym-management-system/frontend/src/features/auth/context/authContext.ts)

```ts
export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  bootstrapping: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}
```

Ã nghÄ©a:

| Field | Vai trÃ² |
| :--- | :--- |
| `user` | ThÃ´ng tin ngÆ°á»i dÃ¹ng hiá»‡n táº¡i. |
| `token` | JWT token hiá»‡n Ä‘ang lÆ°u trong frontend state. |
| `bootstrapping` | Cá» cho biáº¿t app Ä‘ang kiá»ƒm tra phiÃªn Ä‘Äƒng nháº­p. |
| `login()` | Gá»i API login, lÆ°u token vÃ  user. |
| `logout()` | XÃ³a token, xÃ³a user, Ä‘Æ°a app vá» tráº¡ng thÃ¡i chÆ°a Ä‘Äƒng nháº­p. |

Custom hook:

```ts
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
```

Nhá» `useAuth()`, component khÃ´ng cáº§n truyá»n props nhiá»u táº§ng.

---

## 3. AuthProvider

File chÃ­nh: [AuthProvider.tsx](file:///d:/gym-management-system/frontend/src/features/auth/context/AuthProvider.tsx)

State chÃ­nh:

```ts
const [token, setToken] = useState<string | null>(() => readAccessToken())
const [user, setUser] = useState<AuthUser | null>(null)
const [bootstrapping, setBootstrapping] = useState(true)
```

Äiá»ƒm Ä‘Ã¡ng chÃº Ã½:

```ts
useState<string | null>(() => readAccessToken())
```

ÄÃ¢y lÃ  lazy initializer. HÃ m `readAccessToken()` chá»‰ cháº¡y má»™t láº§n khi component Ä‘Æ°á»£c táº¡o, khÃ´ng cháº¡y láº¡i má»—i láº§n render.

---

## 4. Bootstrap phiÃªn Ä‘Äƒng nháº­p

Khi app má»Ÿ láº§n Ä‘áº§u hoáº·c refresh:

```ts
useEffect(() => {
  let cancelled = false

  async function bootstrap() {
    if (!token) {
      setBootstrapping(false)
      return
    }

    try {
      const currentUser = await getCurrentUser()
      if (!cancelled) {
        setUser(currentUser)
      }
    } catch {
      clearAccessToken()
      if (!cancelled) {
        setToken(null)
        setUser(null)
      }
    } finally {
      if (!cancelled) {
        setBootstrapping(false)
      }
    }
  }

  bootstrap()

  return () => {
    cancelled = true
  }
}, [token])
```

Äiá»ƒm má»›i sau khi dÃ¹ng axios:

```ts
const currentUser = await getCurrentUser()
```

KhÃ´ng cÃ²n:

```ts
getCurrentUser(token)
```

LÃ½ do: request interceptor trong `apiClient.ts` Ä‘Ã£ tá»± Ä‘á»c token tá»« `authStorage` vÃ  gáº¯n header `Authorization`.

---

## 5. Luá»“ng login

```ts
login: async (username, password) => {
  const response = await loginRequest(email, password)
  saveAccessToken(response.accessToken)
  setToken(response.accessToken)
  setUser(response.user)
}
```

Luá»“ng xá»­ lÃ½:

1. Gá»i `POST /v1/auth/login`.
2. Response interceptor unbox `ApiResponse<LoginResponse>`.
3. `loginRequest()` tráº£ vá» trá»±c tiáº¿p `LoginResponse`.
4. LÆ°u `accessToken` vÃ o `localStorage`.
5. Cáº­p nháº­t `token` vÃ  `user` trong React state.

---

## 6. Luá»“ng logout

```ts
logout: () => {
  clearAccessToken()
  setToken(null)
  setUser(null)
}
```

Sau khi logout:

1. Token bá»‹ xÃ³a khá»i `localStorage`.
2. User trong context bá»‹ xÃ³a.
3. `ProtectedRoute` tháº¥y khÃ´ng cÃ³ user nÃªn redirect vá» `/login`.

---

## 7. Vai trÃ² cá»§a lá»—i 401

Náº¿u má»™t request tráº£ vá» `401 Unauthorized`, response interceptor trong `apiClient.ts` sáº½ gá»i:

```ts
clearAccessToken()
```

Äiá»u nÃ y giÃºp trÃ¡nh giá»¯ token háº¿t háº¡n trong trÃ¬nh duyá»‡t. Vá»›i cÃ¡c luá»“ng quan trá»ng, `AuthProvider` hoáº·c component gá»i API sáº½ báº¯t lá»—i vÃ  cáº­p nháº­t UI tÆ°Æ¡ng á»©ng.

---

## 8. Ghi nhá»› nhanh

| KhÃ¡i niá»‡m | Ã nghÄ©a |
| :--- | :--- |
| `AuthProvider` | NÆ¡i giá»¯ tráº¡ng thÃ¡i Ä‘Äƒng nháº­p toÃ n cá»¥c. |
| `useAuth()` | Hook Ä‘á»ƒ component láº¥y user hoáº·c gá»i login/logout. |
| `bootstrapping` | Chá»‘ng nhÃ¡y mÃ n hÃ¬nh khi app Ä‘ang kiá»ƒm tra token. |
| `getCurrentUser()` | KhÃ´ng cáº§n truyá»n token vÃ¬ axios interceptor Ä‘Ã£ tá»± gáº¯n. |
| `cancelled = true` | TrÃ¡nh setState sau khi component Ä‘Ã£ unmount. |
| `useMemo` | Giá»¯ object context á»•n Ä‘á»‹nh hÆ¡n, giáº£m render khÃ´ng cáº§n thiáº¿t. |

