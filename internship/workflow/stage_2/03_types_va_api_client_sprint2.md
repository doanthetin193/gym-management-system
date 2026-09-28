# 🎯 GIAI ĐOẠN 2 (SPRINT 2) - CHẶNG 03: TẦNG DỮ LIỆU & API CLIENT FRONTEND (TYPESCRIPT / REACT 19)

Tài liệu này phân tích chi tiết lát cắt nghiệp vụ thứ ba của **Sprint 2: Quản lý Hội viên & Gói tập**. Trọng tâm là việc mở rộng API Client (`apiPut`), hệ thống Type DTOs chuẩn TypeScript và tầng API Service cho cả 2 module: **Hội viên (`members`)** và **Gói tập (`membership-plans`)**.

---

## 🧭 1. Mục tiêu Kỹ thuật của Chặng 03

Trong Giai đoạn 2, Frontend cần tương tác với các API Backend mới:
1. **Cập nhật dữ liệu qua phương thức HTTP `PUT`:** Bổ sung `apiPut` vào [apiClient.ts](file:///d:/gym-management-system/frontend/src/shared/api/apiClient.ts).
2. **Hệ thống TypeScript Types chặt chẽ:** Đồng bộ 100% với DTO của Backend (`MemberSummary`, `MemberDetail`, `MemberProfile`, `MemberMembership`, `PtSessionPackage`, `MembershipPlan`).
3. **Tầng API Service tách biệt:** 
   - [memberApi.ts](file:///d:/gym-management-system/frontend/src/features/members/api/memberApi.ts): `listMembers`, `getMemberDetail`, `createMember`, `updateMember`.
   - [planApi.ts](file:///d:/gym-management-system/frontend/src/features/membership-plans/api/planApi.ts): `listMembershipPlans`, `createMembershipPlan`.

---

## 🏗️ 2. Phân tích Chi tiết Từng File Mã Nguồn

---

### 📌 2.1. Mở rộng Tầng HTTP: [apiClient.ts](file:///d:/gym-management-system/frontend/src/shared/api/apiClient.ts)

```typescript
// Mở rộng UnboxedAxiosInstance hỗ trợ PUT
type UnboxedAxiosInstance = Omit<AxiosInstance, 'get' | 'post' | 'put'> & {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T, TBody = unknown>(url: string, data?: TBody, config?: AxiosRequestConfig<TBody>): Promise<T>
  put<T, TBody = unknown>(url: string, data?: TBody, config?: AxiosRequestConfig<TBody>): Promise<T>
}

// Hàm tiện ích apiPut
export function apiPut<T, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: AxiosRequestConfig<TBody>,
): Promise<T> {
  return apiClient.put<T, TBody>(url, data, config)
}
```

- **Cơ chế Unboxing tự động:** Khi gọi `apiPut(...)`, response trả về từ Axios (`AxiosResponse<ApiResponse<T>>`) đã được Interceptor bóc tách sẵn phần vỏ envelope và trả thẳng về kiểu `T` (dữ liệu sạch trong `data`).

---

### 📌 2.2. Khai báo Types Module Hội viên: [member.ts](file:///d:/gym-management-system/frontend/src/features/members/types/member.ts)

```typescript
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type MemberSource = 'WALK_IN' | 'FACEBOOK' | 'ZALO' | 'REFERRAL' | 'OTHER'
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT'
export type SessionPackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type MemberListFilter = 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'

// Dữ liệu hiển thị trên bảng danh sách
export type MemberSummary = {
  id: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  status: MemberStatus
  currentMembershipId: number | null
  currentPlanName: string | null
  currentMembershipStatus: MembershipStatus | null
  endDate: string | null
  daysUntilExpiration: number | null
}

// Dữ liệu chi tiết 360 độ của 1 hội viên
export type MemberDetail = {
  profile: MemberProfile
  activeMemberships: MemberMembership[]
  membershipHistory: MemberMembership[]
  ptSessionPackages: PtSessionPackage[]
  totalDebt: number
}
```

- Sử dụng Union Type (`'ALL' | 'ACTIVE' | ...`) giúp IDE gợi ý code (IntelliSense) và chống sai chính tả.
- Các trường có thể `null` đều được định nghĩa rõ ràng `string | null` để tránh lỗi `undefined` ở React UI.

---

### 📌 2.3. Tầng Gọi API Hội viên: [memberApi.ts](file:///d:/gym-management-system/frontend/src/features/members/api/memberApi.ts)

```typescript
import { apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type { MemberDetail, MemberListFilter, MemberPayload, MemberSummary } from '../types/member'

type ListMembersParams = {
  keyword?: string
  filter?: MemberListFilter
}

export function listMembers({ keyword, filter = 'ALL' }: ListMembersParams = {}) {
  return apiGet<MemberSummary[]>('/v1/members', {
    params: {
      keyword: keyword || undefined,
      filter,
    },
  })
}

export function getMemberDetail(id: number) {
  return apiGet<MemberDetail>(`/v1/members/${id}`)
}

export function createMember(payload: MemberPayload) {
  return apiPost<MemberDetail['profile'], MemberPayload>('/v1/members', payload)
}

export function updateMember(id: number, payload: MemberPayload) {
  return apiPut<MemberDetail['profile'], MemberPayload>(`/v1/members/${id}`, payload)
}
```

- `keyword || undefined`: Nếu `keyword` là chuỗi rỗng `""`, chuyển thành `undefined` để Axios không tự động gửi `?keyword=` rác lên URL.
- `updateMember`: Nhận `id` và `payload`, gọi HTTP `PUT /v1/members/{id}` qua `apiPut`.

---

### 📌 2.4. Khai báo Types & API Gói tập: [membershipPlan.ts](file:///d:/gym-management-system/frontend/src/features/membership-plans/types/membershipPlan.ts) & [planApi.ts](file:///d:/gym-management-system/frontend/src/features/membership-plans/api/planApi.ts)

```typescript
export type PlanType = 'SELF_TRAINING' | 'PT' | 'GUIDANCE' | 'OTHER'
export type PtLevel = 'MAIN' | 'NEW'
export type ContentAccessLevel = 'NONE' | 'BASIC' | 'PREMIUM'

export type MembershipPlan = {
  id: number
  name: string
  planType: PlanType
  ptLevel: PtLevel | null
  durationDays: number | null
  defaultPrice: number | null
  ptSessionCount: number | null
  practiceSessionCount: number | null
  guidanceSessionCount: number | null
  contentAccessLevel: ContentAccessLevel
  priceRatio: number | null
  description: string | null
  active: boolean
}
```

```typescript
export function listMembershipPlans() {
  return apiGet<MembershipPlan[]>('/v1/membership-plans')
}

export function createMembershipPlan(payload: MembershipPlanPayload) {
  return apiPost<MembershipPlan, MembershipPlanPayload>('/v1/membership-plans', payload)
}
```
