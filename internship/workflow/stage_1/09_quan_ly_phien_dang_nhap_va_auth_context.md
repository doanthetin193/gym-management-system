# CHẶNG 09: QUẢN LÝ PHIÊN ĐĂNG NHẬP & AUTH CONTEXT

Tài liệu này ghi chú cách frontend quản lý phiên đăng nhập sau khi đã có tầng API client bằng axios interceptor.

---

## 1. Mục tiêu

1. Lưu thông tin user hiện tại ở cấp toàn cục.
2. Cho component bất kỳ lấy được `user`, `token`, `login()`, `logout()`.
3. Khi refresh trang, tự kiểm tra token còn hợp lệ bằng `/v1/auth/me`.
4. Tránh nháy màn hình login trong lúc đang kiểm tra phiên.
5. Không truyền token thủ công vào từng API nữa, vì request interceptor đã tự gắn token.

---

## 2. AuthContext

File chính: [authContext.ts](file:///d:/gym-management-system/frontend/src/features/auth/context/authContext.ts)

```ts
export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  bootstrapping: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}
```

Ý nghĩa:

| Field | Vai trò |
| :--- | :--- |
| `user` | Thông tin người dùng hiện tại. |
| `token` | JWT token hiện đang lưu trong frontend state. |
| `bootstrapping` | Cờ cho biết app đang kiểm tra phiên đăng nhập. |
| `login()` | Gọi API login, lưu token và user. |
| `logout()` | Xóa token, xóa user, đưa app về trạng thái chưa đăng nhập. |

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

Nhờ `useAuth()`, component không cần truyền props nhiều tầng.

---

## 3. AuthProvider

File chính: [AuthProvider.tsx](file:///d:/gym-management-system/frontend/src/features/auth/context/AuthProvider.tsx)

State chính:

```ts
const [token, setToken] = useState<string | null>(() => readAccessToken())
const [user, setUser] = useState<AuthUser | null>(null)
const [bootstrapping, setBootstrapping] = useState(true)
```

Điểm đáng chú ý:

```ts
useState<string | null>(() => readAccessToken())
```

Đây là lazy initializer. Hàm `readAccessToken()` chỉ chạy một lần khi component được tạo, không chạy lại mỗi lần render.

---

## 4. Bootstrap phiên đăng nhập

Khi app mở lần đầu hoặc refresh:

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

Điểm mới sau khi dùng axios:

```ts
const currentUser = await getCurrentUser()
```

Không còn:

```ts
getCurrentUser(token)
```

Lý do: request interceptor trong `apiClient.ts` đã tự đọc token từ `authStorage` và gắn header `Authorization`.

---

## 5. Luồng login

```ts
login: async (username, password) => {
  const response = await loginRequest(username, password)
  saveAccessToken(response.accessToken)
  setToken(response.accessToken)
  setUser(response.user)
}
```

Luồng xử lý:

1. Gọi `POST /v1/auth/login`.
2. Response interceptor unbox `ApiResponse<LoginResponse>`.
3. `loginRequest()` trả về trực tiếp `LoginResponse`.
4. Lưu `accessToken` vào `localStorage`.
5. Cập nhật `token` và `user` trong React state.

---

## 6. Luồng logout

```ts
logout: () => {
  clearAccessToken()
  setToken(null)
  setUser(null)
}
```

Sau khi logout:

1. Token bị xóa khỏi `localStorage`.
2. User trong context bị xóa.
3. `ProtectedRoute` thấy không có user nên redirect về `/login`.

---

## 7. Vai trò của lỗi 401

Nếu một request trả về `401 Unauthorized`, response interceptor trong `apiClient.ts` sẽ gọi:

```ts
clearAccessToken()
```

Điều này giúp tránh giữ token hết hạn trong trình duyệt. Với các luồng quan trọng, `AuthProvider` hoặc component gọi API sẽ bắt lỗi và cập nhật UI tương ứng.

---

## 8. Ghi nhớ nhanh

| Khái niệm | Ý nghĩa |
| :--- | :--- |
| `AuthProvider` | Nơi giữ trạng thái đăng nhập toàn cục. |
| `useAuth()` | Hook để component lấy user hoặc gọi login/logout. |
| `bootstrapping` | Chống nháy màn hình khi app đang kiểm tra token. |
| `getCurrentUser()` | Không cần truyền token vì axios interceptor đã tự gắn. |
| `cancelled = true` | Tránh setState sau khi component đã unmount. |
| `useMemo` | Giữ object context ổn định hơn, giảm render không cần thiết. |
