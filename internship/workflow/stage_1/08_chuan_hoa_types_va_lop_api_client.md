# ðŸ”Œ CHáº¶NG 08: CHUáº¨N HÃ“A KIá»‚U Dá»® LIá»†U TYPE-SAFE & Lá»šP AXIOS CLIENT (INTERCEPTORS)

TÃ i liá»‡u nÃ y ghi chÃº chi tiáº¿t vá» cÆ¡ cháº¿ **Äá»“ng bá»™ Kiá»ƒu dá»¯ liá»‡u Type-Safe (TypeScript â†” Spring Boot DTOs)**, **Lá»›p Axios Client Tá»± Ä‘á»™ng Gáº¯n Token (Request/Response Interceptors)**, vÃ  **Ká»¹ thuáº­t Má»Ÿ há»™p Kiá»ƒu Dá»¯ Liá»‡u (`UnboxedAxiosInstance`)**.

---

## ðŸŽ¯ 1. Má»¥c tiÃªu & Táº¡i sao Chuyá»ƒn sang Axios?

1. **Tá»± Ä‘á»™ng gáº¯n Bearer Token:** Nhá» `Request Interceptor`, má»i request gá»­i Ä‘i Ä‘á»u tá»± Ä‘á»™ng Ä‘á»c token tá»« `authStorage` vÃ  Ä‘Ã­nh kÃ¨m vÃ o Header `Authorization`, cÃ¡c hÃ m gá»i API khÃ´ng cÃ²n pháº£i nháº­n tham sá»‘ `token` thá»§ cÃ´ng.
2. **Tá»± Ä‘á»™ng Unboxing dá»¯ liá»‡u & Báº¯t lá»—i 401:** Nhá» `Response Interceptor`, táº§ng UI nháº­n tháº³ng dá»¯ liá»‡u thá»±c `data` sáº¡ch sáº½, Ä‘á»“ng thá»i náº¿u gáº·p lá»—i 401 (token háº¿t háº¡n) thÃ¬ tá»± Ä‘á»™ng dá»n sáº¡ch `localStorage`.
3. **Type-Safe Tuyá»‡t Ä‘á»‘i (`UnboxedAxiosInstance`):** Dáº¡y cho TypeScript hiá»ƒu ráº±ng Axios sau khi qua Interceptor sáº½ tráº£ vá» `Promise<T>` thay vÃ¬ `Promise<AxiosResponse<T>>`.

---

## ðŸ—ºï¸ 2. SÆ¡ Ä‘á»“ Luá»“ng Hoáº¡t Ä‘á»™ng cá»§a Axios Interceptors

```mermaid
sequenceDiagram
    autonumber
    actor UI as React Component / Hook (authApi.ts)
    participant ReqInt as Request Interceptor
    participant Storage as authStorage.ts (localStorage)
    participant Axios as Axios Core
    participant BE as Spring Boot Controller
    participant ResInt as Response Interceptor

    UI->>Axios: Gá»i apiGet<AuthUser>('/v1/auth/me') (KhÃ´ng cáº§n truyá»n token)
    Axios->>ReqInt: Cháº·n trÆ°á»›c khi gá»­i request
    ReqInt->>Storage: readAccessToken()
    Storage-->>ReqInt: Tráº£ vá» token JWT
    ReqInt->>Axios: Tá»± gáº¯n Header: Authorization: Bearer <token>
    Axios->>BE: Gá»­i HTTP Request tá»›i Backend
    BE-->>Axios: Pháº£n há»“i JSON ApiResponse { success, data, error }

    alt ThÃ nh cÃ´ng (HTTP 200 OK)
        Axios->>ResInt: Äi qua unboxApiResponse
        ResInt->>ResInt: TrÃ­ch xuáº¥t láº¥y payload.data
        ResInt-->>UI: Tráº£ vá» dá»¯ liá»‡u sáº¡ch kiá»ƒu AuthUser
    else Tháº¥t báº¡i (HTTP 401 Háº¿t háº¡n hoáº·c Lá»—i 400/409)
        Axios->>ResInt: Äi qua normalizeApiError
        opt Náº¿u mÃ£ lá»—i lÃ  401
            ResInt->>Storage: clearAccessToken() (Tá»± dá»n dáº¹p)
        end
        ResInt-->>UI: NÃ©m ngoáº¡i lá»‡ ApiClientError(message, status, code, fields)
    end
```

---

## ðŸ” 3. Chi tiáº¿t CÃ¡c ThÃ nh pháº§n Ká»¹ thuáº­t

### 3.1. Äá»“ng bá»™ Kiá»ƒu Dá»¯ liá»‡u Type-Safe ([shared/types/api.ts](file:///d:/gym-management-system/frontend/src/shared/types/api.ts))

```typescript
// Khá»›p vá»›i ApiError.java cá»§a Spring Boot
export type ApiError = {
  code: string
  message: string
  fields: Record<string, string> // VÃ­ dá»¥: { phone: "Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ tá»“n táº¡i" }
}

// Khá»›p vá»›i ApiResponse.java cá»§a Spring Boot
export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T | null
  error: ApiError | null
  timestamp: string
}
```

---

### 3.2. Cáº¥u hÃ¬nh Axios Instance & Interceptors ([shared/api/apiClient.ts](file:///d:/gym-management-system/frontend/src/shared/api/apiClient.ts))

```typescript
import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { clearAccessToken, readAccessToken } from '../lib/authStorage'
import type { ApiResponse } from '../types/api'

// 1. Táº¡o instance vá»›i URL gá»‘c tá»« .env
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// 2. REQUEST INTERCEPTOR: Tá»± Ä‘á»™ng gáº¯n Token vÃ o má»i Request
axiosInstance.interceptors.request.use((config) => {
  const token = readAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 3. RESPONSE INTERCEPTOR: Má»Ÿ há»™p (Unbox) vÃ  Báº¯t lá»—i táº­p trung
function unboxApiResponse(response: AxiosResponse<ApiResponse<unknown>>) {
  const payload = response.data
  if (!payload || typeof payload.success !== 'boolean') {
    throw new ApiClientError('Pháº£n há»“i tá»« mÃ¡y chá»§ khÃ´ng há»£p lá»‡.', response.status)
  }
  if (!payload.success) {
    throw new ApiClientError(payload.error?.message ?? 'YÃªu cáº§u khÃ´ng thÃ nh cÃ´ng.', response.status, payload.error?.code, payload.error?.fields)
  }
  return payload.data // ðŸ‘‰ Tráº£ vá» tháº³ng data bÃªn trong
}

function normalizeApiError(error: AxiosError<ApiResponse<unknown>>) {
  const status = error.response?.status ?? 0
  const payload = error.response?.data
  if (status === 401) {
    clearAccessToken() // ðŸ‘‰ Tá»± xÃ³a token khi háº¿t háº¡n
  }
  throw new ApiClientError(payload?.error?.message ?? 'KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§.', status, payload?.error?.code, payload?.error?.fields)
}

axiosInstance.interceptors.response.use(
  unboxApiResponse as unknown as (response: AxiosResponse) => AxiosResponse,
  normalizeApiError,
)
```

---

### 3.3. BÃ­ quyáº¿t TypeScript: `UnboxedAxiosInstance`
Trong Axios máº·c Ä‘á»‹nh, hÃ m `get<T>()` tráº£ vá» `Promise<AxiosResponse<T>>`. NhÆ°ng vÃ¬ Response Interceptor Ä‘Ã£ bÃ³c vá» Ä‘á»ƒ tráº£ vá» tháº³ng `T`, Codex Ä‘Ã£ Ä‘á»‹nh nghÄ©a kiá»ƒu `UnboxedAxiosInstance` Ä‘á»ƒ trÃ¬nh biÃªn dá»‹ch TypeScript khÃ´ng báº¯t ta pháº£i gÃµ `res.data` thÃªm má»™t láº§n ná»¯a:

```typescript
type UnboxedAxiosInstance = Omit<AxiosInstance, 'get' | 'post'> & {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T, TBody = unknown>(url: string, data?: TBody, config?: AxiosRequestConfig<TBody>): Promise<T>
}

export const apiClient = axiosInstance as UnboxedAxiosInstance

export function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.get<T>(url, config)
}

export function apiPost<T, TBody = unknown>(url: string, data?: TBody, config?: AxiosRequestConfig<TBody>): Promise<T> {
  return apiClient.post<T, TBody>(url, data, config)
}
```

---

### 3.4. Gá»i API SiÃªu Tinh Gá»n ([features/auth/api/authApi.ts](file:///d:/gym-management-system/frontend/src/features/auth/api/authApi.ts))
NhÃ¬n sá»± khÃ¡c biá»‡t khi dÃ¹ng Axios Interceptors:

```typescript
// TrÆ°á»›c Ä‘Ã¢y (fetch): Pháº£i truyá»n token thá»§ cÃ´ng
// export function getCurrentUser(token: string) { ... }

// Hiá»‡n táº¡i (Axios Interceptor): HoÃ n toÃ n khÃ´ng cáº§n truyá»n token!
export function login(email: string, password: string) {
  return apiPost<LoginResponse>('/v1/auth/login', { email, password })
}

export function getCurrentUser() {
  return apiGet<AuthUser>('/v1/auth/me') // ðŸ‘‰ Interceptor tá»± Ä‘á»™ng gáº¯n token ngáº§m
}
```

---

## ðŸ§  4. Báº£ng Ghi nhá»› Kiáº¿n thá»©c Cá»‘t lÃµi (Key Takeaways)

| KhÃ¡i niá»‡m / Ká»¹ thuáº­t | Báº£n cháº¥t & Ã nghÄ©a |
| :--- | :--- |
| **Request Interceptor** | "Tráº¡m gÃ¡c" trÆ°á»›c khi request bay Ä‘i: Tá»± Ä‘á»™ng láº¥y token trong `localStorage` gáº¯n vÃ o Header `Authorization`. |
| **Response Interceptor** | "Tráº¡m kiá»ƒm soÃ¡t" khi server pháº£n há»“i: Tá»± Ä‘á»™ng unbox láº¥y `payload.data`, náº¿u gáº·p mÃ£ 401 thÃ¬ tá»± Ä‘á»™ng xÃ³a token cÅ©. |
| **`UnboxedAxiosInstance`** | Ã‰p kiá»ƒu TypeScript Ä‘á»ƒ hÃ m `apiGet<T>()` tráº£ vá» Ä‘Ãºng kiá»ƒu dá»¯ liá»‡u `Promise<T>` sáº¡ch sáº½, chuáº©n Type-safe. |
| **Zero Parameter API Call** | CÃ¡c hÃ m gá»i dá»¯ liá»‡u cÃ¡ nhÃ¢n nhÆ° `getCurrentUser()` khÃ´ng cáº§n tham sá»‘ `token`, giÃºp code UI cá»±c ká»³ gá»n gÃ ng. |

