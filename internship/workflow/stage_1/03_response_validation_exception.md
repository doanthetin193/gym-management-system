# Response, validation và xử lý ngoại lệ

## 1. Hợp đồng response

[`ApiResponse<T>`](../../../backend/src/main/java/com/gymduongdouble/backend/common/web/dto/ApiResponse.java) có `success`, `message`, `data`, `error`, `timestamp`. `ok(data)` tạo kết quả thành công, `created(data)` đặt message `CREATED`, còn `fail(...)` đặt `success=false`. Message `CREATED` **không tự quyết định HTTP 201**: HTTP status còn phụ thuộc controller và cách trả response.

[`ApiError`](../../../backend/src/main/java/com/gymduongdouble/backend/common/web/dto/ApiError.java) có `code`, `message`, `fields`; `fields` được dùng để mô tả lỗi theo trường. [`PageResponse<T>`](../../../backend/src/main/java/com/gymduongdouble/backend/common/web/dto/PageResponse.java) chuyển `Page` thành `items`, số trang, kích thước, tổng phần tử và cờ `first`/`last`; không phải mọi API danh sách đều dùng phân trang này.

Ví dụ hình dạng lỗi, chỉ minh họa cấu trúc:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ.",
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ.", "fields": { "name": "Tên gói là bắt buộc." } },
  "timestamp": "2026-10-17T03:00:00Z"
}
```

## 2. Validation nằm ở đâu?

Đọc [`MembershipPlanRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/dto/MembershipPlanRequest.java): `@NotBlank` yêu cầu tên, `@NotNull` yêu cầu loại, `@Min`/`@DecimalMin` ràng buộc một số giá trị số. Controller dùng `@Valid @RequestBody` để kích hoạt validation khi nhận JSON. `@Min` hay `@DecimalMin` một mình không có nghĩa field bắt buộc phải khác `null`; muốn hiểu điều kiện đầy đủ cần đọc cả annotation lẫn service.

Validation DTO bảo vệ định dạng và ràng buộc cơ bản. [`MembershipPlanService`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MembershipPlanService.java) còn chịu trách nhiệm kiểm tra các điều kiện nghiệp vụ giữa nhiều trường. Tương tự, `required` hoặc `min` ở UI chỉ giúp trải nghiệm, không thay thế kiểm tra backend.

## 3. Exception được chuyển thành HTTP như thế nào?

[`GlobalExceptionHandler`](../../../backend/src/main/java/com/gymduongdouble/backend/common/exception/GlobalExceptionHandler.java) là `@RestControllerAdvice`. Một số mapping cụ thể:

| Tình huống | HTTP | Mã lỗi |
| --- | --- | --- |
| `BadRequestException` | 400 | `BAD_REQUEST` |
| Request không qua bean validation | 400 | `VALIDATION_ERROR`, có `fields` |
| JSON không đọc được | 400 | `INVALID_REQUEST_BODY` |
| Sai thông tin đăng nhập | 401 | `BAD_CREDENTIALS` |
| Không đủ quyền | 403 | `ACCESS_DENIED` |
| Không tìm thấy | 404 | `RESOURCE_NOT_FOUND` |
| Xung đột dữ liệu / optimistic lock | 409 | `CONFLICT` / `CONCURRENT_UPDATE` |
| Rate limit ở service đăng nhập | 429 | `RATE_LIMITED` và header `Retry-After` |
| Ngoại lệ chưa được xử lý | 500 | `INTERNAL_SERVER_ERROR` |

Không phải lỗi nào cũng tới advice. Lỗi xác thực/phân quyền có thể phát sinh **trong security filter**, được [`JsonAuthenticationEntryPoint`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/JsonAuthenticationEntryPoint.java), [`JsonAccessDeniedHandler`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/JsonAccessDeniedHandler.java) hoặc filter tương ứng trả trực tiếp. Phân biệt `401` chưa xác thực/token sai và `403` đã được xác thực nhưng không đủ quyền.

## 4. Frontend nhận lỗi

[`apiClient.ts`](../../../frontend/src/shared/api/apiClient.ts) gắn token, bóc `data` khỏi response chuẩn và chuyển lỗi Axios thành `ApiClientError`, gồm status, code, fields và `retryAfterSeconds` nếu có. Response HTTP 401 làm frontend xóa token và phát sự kiện đăng xuất; không nên hiển thị chi tiết stack trace cho người dùng.

## Tự kiểm tra

1. Vì sao `ApiResponse.created()` không đủ để khẳng định HTTP status là 201?
2. `@DecimalMin` không đi kèm `@NotNull` có buộc phải nhập giá trị không?
3. Vì sao phải kiểm tra cả filter lẫn `GlobalExceptionHandler` khi tìm nguồn lỗi 401?

## 5. Thực hành lần theo một lỗi validation

Giả sử client gọi tạo plan và không có tên: request được chuyển thành DTO; `@NotBlank` phát hiện lỗi ở trường `name`; Spring phát sinh `MethodArgumentNotValidException`; advice duyệt `getFieldErrors()` và tạo map `fields` với tên trường và thông điệp. Trên frontend, `ApiClientError` chứa status, code, fields. Đây là chuỗi khác với trường hợp tên hợp lệ về hình thức nhưng đã tồn tại: service ném `ConflictException` và handler trả 409.

Một JSON sai kiểu, chẳng hạn đưa object vào field số khi Jackson không thể chuyển đổi, có thể đi qua handler `HttpMessageNotReadableException` và nhận `INVALID_REQUEST_BODY`. Nếu body hợp lệ nhưng quy tắc giữa các trường sai, ví dụ giảm giá lớn hơn giá bán, service tự ném `BadRequestException`. Khi điều tra, lưu lại HTTP status, mã lỗi, method, URL và input đã ẩn dữ liệu nhạy cảm; thông báo hiển thị UI một mình thường không đủ biết lỗi nằm ở tầng nào.

## 6. Phân trang và HTTP status

`PageResponse.from(Page<T>)` dùng metadata của Spring Data Page: `page` là `getNumber()`, `size` là `getSize()`, cùng tổng số phần tử/trang và cờ đầu/cuối. Số trang của Spring Data thường bắt đầu từ 0; phải xem endpoint có dùng `PageResponse` và cấu hình pageable thực tế trước khi chỉ dẫn người dùng gọi. Danh sách plan trong ví dụ `listActive` trả `List`, không tự thành trang chỉ vì dự án có class `PageResponse`.

`ApiResponse.created` chỉ tạo body với message `CREATED`. HTTP 201 cần được controller hoặc cấu hình HTTP đặt rõ, ví dụ bằng `ResponseEntity` hay annotation tương ứng; hãy kiểm tra thực tế thay vì dùng tên method làm bằng chứng. Tương tự, lỗi do filter trực tiếp ghi response không nhất thiết đi qua advice, dù vẫn dùng cấu trúc `ApiResponse`.

## 7. Giải phẫu hợp đồng `ApiResponse<T>`

Đoạn sau được trích từ `ApiResponse.java`:

```java
public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    ApiError error,
    Instant timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", data, null, Instant.now());
    }

    public static <T> ApiResponse<T> fail(String message, ApiError error) {
        return new ApiResponse<>(false, message, null, error, Instant.now());
    }
}
```

Đã lược method `created` khỏi trích đoạn để tập trung hai nhánh. `record` gom các thành phần của response; `<T>` cho phép `data` là một DTO, một danh sách hoặc `Void`. Nhánh thành công có `error = null`; nhánh lỗi có `data = null`. `timestamp` được tạo bằng `Instant.now()`: thời gian của response, không phải ngày thu tiền hay thời điểm giao dịch phát sinh.

Đừng nhầm `success` trong JSON với HTTP status. Client cần xem cả status lẫn body: một response có mã 400 vẫn có body `ApiResponse`; trong khi lỗi mạng có thể không có body này. Khi bổ sung endpoint, cần nhất quán kiểu dữ liệu `data` với frontend, không chỉ nhìn `message`.

## 8. Validation lỗi đi qua handler như thế nào?

Đây là handler thực tế, đã bỏ annotation của class và các handler khác:

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
    Map<String, String> fields = new LinkedHashMap<>();
    exception.getBindingResult().getFieldErrors().forEach(error ->
        fields.put(error.getField(), error.getDefaultMessage())
    );

    ApiError error = ApiError.withFields("VALIDATION_ERROR", "Dữ liệu không hợp lệ.", fields);
    return ResponseEntity.badRequest().body(ApiResponse.fail("Dữ liệu không hợp lệ.", error));
}
```

Khi `@Valid @RequestBody` không đạt, Spring ném `MethodArgumentNotValidException`; handler thu thập tên field và message, trả HTTP 400. Vì đây là map một message cho mỗi tên field, nếu có nhiều lỗi cùng field, lần `put` sau có thể ghi đè lần trước. Lỗi JSON không đọc được đi vào handler khác `HttpMessageNotReadableException`, không phải lúc nào cũng có field cụ thể. Lỗi nghiệp vụ service chủ động ném `BadRequestException` lại có code `BAD_REQUEST`.

Ví dụ thực hành: gửi body thiếu một field bắt buộc của DTO bằng tài khoản demo, ghi status và `error.fields`; sau đó gửi JSON sai cú pháp để so sánh. Không dự đoán response validation của field chưa kiểm tra annotation. Tương tự, lỗi xác thực trong security filter có thể được filter trả trực tiếp thay vì qua handler này.

**Phân biệt quan trọng:** `@NotNull` từ chối null; `@Min(1)` kiểm tra giá trị số khi có giá trị nhưng không tự bắt buộc field phải tồn tại. Xem cả hai annotation và logic service trước khi kết luận dữ liệu nào bắt buộc.
