# Frontend: route, API client và kết nối backend

## 1. Vai trò frontend trong bài toán backend

Bạn là intern backend nên không cần bắt đầu bằng CSS. Hãy đọc frontend để biết UI gửi gì, gọi endpoint nào, xử lý response/lỗi thế nào và bảo vệ trải nghiệm ở đâu. Backend vẫn là nơi kiểm tra quyền và nghiệp vụ khi client gọi API trực tiếp.

[`frontend/package.json`](../../../frontend/package.json) cho biết stack hiện tại: React, React Router, Axios, Vite, TypeScript và Tailwind. Entry và route đọc ở [`App.tsx`](../../../frontend/src/app/App.tsx); giao diện chung ở [`AppShell.tsx`](../../../frontend/src/layouts/AppShell.tsx). Guard gồm [`ProtectedRoute`](../../../frontend/src/app/router/ProtectedRoute.tsx), [`RoleGuard`](../../../frontend/src/app/router/RoleGuard.tsx), [`PublicOnlyRoute`](../../../frontend/src/app/router/PublicOnlyRoute.tsx). Tự đối chiếu route trong `App.tsx` để biết component và role nào được dùng, không suy từ tên file.

## 2. Từ click đến HTTP

Ví dụ ở trang chi tiết member, tìm `onSubmit` của modal đăng ký → handler `handleCreateMembership` → `createMemberMembership` trong API client tính năng → `apiPost` ở shared client. Ghi tên payload do modal tạo và tên payload backend nhận; kiểm tra chỗ đổi tên như `paidAmount` thành `initialPaidAmount`. Khi response thành công, handler đóng modal và nạp lại dữ liệu; khi lỗi, state lỗi được hiển thị.

[`apiClient.ts`](../../../frontend/src/shared/api/apiClient.ts) tạo Axios instance, lấy token từ [`authStorage.ts`](../../../frontend/src/shared/lib/authStorage.ts), gắn Bearer, bóc `data` khỏi `ApiResponse`, chuyển lỗi thành `ApiClientError`. Khi 401, client xóa token và phát `auth:unauthorized`. Với request rate limited, client đọc `Retry-After` thành `retryAfterSeconds` nếu hợp lệ.

## 3. Route guard không phải bảo mật API

Guard có thể chặn điều hướng ở UI dựa trên auth context, nhưng người dùng vẫn có thể gửi request bằng công cụ khác. Đối chiếu route guard với `SecurityConfig`, annotation controller và kiểm tra bản ghi ở service. Nếu khác nhau, mô tả đúng nơi đang thực thi thay vì coi giao diện là nguồn chân lý.

## 4. Bài tập

1. Chọn form thu nợ: tìm component, payload gửi, endpoint và method backend; so tên các trường.
2. Quan sát Network với dữ liệu test: status 400/401/403/429 được client hiển thị/điều hướng thế nào? Che Authorization.
3. Dùng tài khoản test khác role; so guard frontend với điều kiện role ở controller.
4. Tìm `DatePartsSelect` và kiểm tra `maxIso`; sau đó tìm cùng điều kiện ngày tại backend.

## 5. Interceptor gắn token: đọc từng bước

Trích nguyên phần request interceptor từ `apiClient.ts`:

```ts
axiosInstance.interceptors.request.use((config) => {
  const token = readAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
```

Mọi request đi qua instance này đều có thể được gắn token nếu storage có giá trị. Đường gọi `fetch` trực tiếp không mặc nhiên đi qua interceptor. `Bearer` phải đúng định dạng filter backend đọc; không ghi token vào console/log. Backend vẫn phải kiểm tra chữ ký, thời hạn, tài khoản và quyền, vì browser hoàn toàn có thể bị sửa request.

## 6. Bóc response và xử lý lỗi

`unboxApiResponse` kiểm tra có boolean `success`, lỗi nếu body không đúng cấu trúc hoặc `success=false`, rồi trả `payload.data`. Vì vậy hàm gọi frontend thường nhận dữ liệu đã bóc, không phải lúc nào cũng truy cập `.data.data`. Với HTTP error, `normalizeApiError` lấy status, error code/fields và `retry-after`; status 401 xóa token, phát event và có thể chuyển về login. Lỗi không có response mạng cho status 0: khác 401 và không đủ dữ liệu để kết luận mật khẩu sai.

Kịch bản debug: form thu tiền tạo payload → `apiPost` → request interceptor → controller → service → response → response interceptor → UI cập nhật. So ngày và số tiền ở mỗi bước; tránh ghi PII hay token vào tài liệu. UI chặn ngày tương lai giúp trải nghiệm, backend vẫn phải tự xác nhận vì client có thể bỏ qua UI.

## 7. Đọc luồng AI Advisor và kịch bản trên trang Báo cáo

Mở [`ReportsPage.tsx`](../../../frontend/src/features/reports/pages/ReportsPage.tsx), rồi lần theo `handleAnalyzeAiAdvisor` đến [`aiAdvisorApi.ts`](../../../frontend/src/features/reports/api/aiAdvisorApi.ts). Nút phân tích tổng quan gọi cùng endpoint với `year`, `month` và không gửi `scenario`. Sau khi có kết quả, `AiScenarioPlanner` giữ ba state cục bộ: tỷ lệ thu công nợ, khôi phục nhóm PT rủi ro và gia hạn/quay lại. Nút `Phân tích kịch bản` gửi lại đúng kỳ đang xem cùng object:

```ts
{
  year,
  month,
  scenario: {
    debtCollectionPercent,
    ptRecoveryPercent,
    renewalConversionPercent,
  },
}
```

Frontend ép giá trị người dùng nhập vào miền `0..100` để trải nghiệm dễ hiểu, nhưng validator backend mới là lớp quyết định. Response `scenario` có thể là `null` sau phân tích tổng quan; UI chỉ hiện phần giá trị mô phỏng khi response có object này. Phần hiển thị luôn nêu đây là mô phỏng và không tạo phiếu thu, đổi gói hay liên hệ tự động. Không lưu các tỷ lệ vào localStorage, database hoặc state dùng chung: tải lại trang sẽ trở về các giá trị mặc định của form.

Khi debug, kiểm tra Network body trước tiên; sau đó kiểm tra `scenario.estimatedTotalImpact` có đúng bằng ba giá trị thành phần hay không. Đừng lấy chữ do Groq sinh làm nguồn số tiền, vì các giá trị hiển thị phải dùng response numeric từ backend. Nếu `aiGenerated=false`, giao diện vẫn có thể hiển thị `insight.scenario` do fallback rule-based tạo.
