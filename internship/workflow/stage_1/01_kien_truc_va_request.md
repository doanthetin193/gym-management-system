# Bản đồ backend và vòng đời request

## 1. Bài toán và các thành phần

Backend xử lý nghiệp vụ cho phòng gym: hội viên, gói tập, công nợ, PT, báo cáo và các chức năng khác. Frontend gọi API; backend kiểm tra quyền và dữ liệu, thao tác PostgreSQL rồi trả kết quả. Mô hình đơn giản:

```text
Trình duyệt / React
       │ HTTP + JSON
       ▼
Spring Security filter → Controller → Service → Repository → PostgreSQL
                              ▲             │
                              └── DTO/response ◄── Entity
```

Đây là sơ đồ khái quát, không phải mọi endpoint đều đọc hoặc ghi database. Filter bảo mật có thể dừng request trước controller; một service cũng có thể gọi nhiều repository hoặc service khác.

## 2. Đọc cấu trúc thư mục

Thư mục gốc Java là [`backend/src/main/java/com/gymduongdouble/backend`](../../../backend/src/main/java/com/gymduongdouble/backend). Các package theo nghiệp vụ: `auth`, `member`, `membership`, `finance`, `pt`, `training`, `dashboard`, `exercise`, `ai`, `user`; `common` chứa các thành phần dùng chung. Trong từng package thường gặp:

| Lớp / thư mục | Công việc |
| --- | --- |
| `web` | Nhận request, khai báo endpoint và điều kiện quyền; gọi service. |
| `web/dto` | Kiểu dữ liệu vào/ra API, validation cho request. |
| `service` | Quy tắc nghiệp vụ và điều phối xử lý. |
| `repository` | Truy vấn/lưu entity qua Spring Data JPA. |
| `domain` | Entity và quan hệ được ánh xạ xuống cơ sở dữ liệu. |

Không ép rằng package nào cũng có đủ cả năm thư mục. Chẳng hạn `training` chứa entity và repository, còn thao tác liên quan được điều phối trong module `pt`.

## 3. Khởi động và địa chỉ API

Đọc [`BackendApplication`](../../../backend/src/main/java/com/gymduongdouble/backend/BackendApplication.java): đây là điểm vào Spring Boot. [`application.yml`](../../../backend/src/main/resources/application.yml) khai báo cổng mặc định `8080` và context path `/api`. Vì vậy mapping `/v1/membership-plans` được gọi tại `http://localhost:8080/api/v1/membership-plans` khi chạy theo cấu hình mặc định.

Script [`run-backend.ps1`](../../../backend/run-backend.ps1) dùng để chạy backend local và nạp cấu hình từ `.env` ở thư mục gốc. Các giá trị kết nối database, JWT và tài khoản khởi tạo phải quản lý như bí mật; đừng đưa file `.env` hoặc token vào tài liệu hay commit.

## 4. Ví dụ đọc API danh sách gói

Mở [`MembershipPlanController`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/MembershipPlanController.java). Method `listActive()` có `@GetMapping` và `@PreAuthorize("hasAnyRole('OWNER', 'PT')")`:

1. Client gửi `GET /api/v1/membership-plans` với Bearer token hợp lệ.
2. Security filter xác thực, sau đó kiểm tra quyền method.
3. Controller gọi `membershipPlanService.listActive()`.
4. [`MembershipPlanService`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MembershipPlanService.java) dùng [`MembershipPlanRepository`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/repository/MembershipPlanRepository.java) để lấy dữ liệu và chuyển sang response DTO.
5. Controller bọc kết quả qua `ApiResponse.ok(...)`. Spring chuyển object thành JSON.

`@RequiredArgsConstructor` của Lombok tạo constructor cho các dependency `final`; Spring inject dependency, thay vì controller tự `new` service. Controller chủ yếu nhận/trả HTTP; chính sách về gói nằm ở service, không nằm trong tên endpoint hay màu sắc UI.

## 5. Đọc code theo chiều nào?

Khi muốn hiểu một chức năng, tìm chữ trên UI → tìm API client → controller → service → repository/entity → DTO. Khi muốn hiểu một lỗi, bắt đầu từ thông báo và status, sau đó tìm handler hoặc service phát sinh lỗi. Không nên kết luận chỉ dựa vào frontend: client có thể bị bỏ qua và API được gọi trực tiếp.

## Tự kiểm tra

1. Vì sao đường dẫn client có `/api` dù controller chỉ khai báo `/v1/...`?
2. Khi nào một request không tới được controller?
3. DTO khác entity ở mục đích nào? Vì sao cần xem service trước khi khẳng định nghiệp vụ?

## 6. Giải phẫu một method controller

Xem method `create` trong `MembershipPlanController`: class có `@RestController`, `@RequestMapping("/v1/membership-plans")`; method thêm `@PostMapping`, `@PreAuthorize("hasRole('OWNER')")`. Spring kết hợp mapping class và method, cộng context path `/api` của server. `@RequestBody` yêu cầu chuyển JSON thành `MembershipPlanRequest`; `@Valid` kích hoạt bean validation. Phương thức gọi `membershipPlanService.create(request)` và bọc DTO bằng `ApiResponse.created`.

Những bước này không chạy ngẫu nhiên. Request cần đi qua security chain. Sau đó Spring MVC tìm method, chuyển body, validation, rồi mới gọi method. Nếu role không đủ thì không được coi là service đã kiểm tra và lưu dữ liệu. Nếu JSON không đọc được hoặc DTO lỗi thì logic bên trong method có thể chưa được thực hiện. Vì vậy khi debug, đặt câu hỏi: request đã vào filter chưa, đến controller chưa, service có chạy chưa, transaction có commit chưa?

Để theo dõi một request thực tế mà không sửa code, chọn dữ liệu thử nghiệm, mở Network trong trình duyệt, kiểm tra method, URL, status và response. Không chụp hoặc gửi header Authorization hay mật khẩu. Sau đó đối chiếu method controller và tìm từng lời gọi tiếp theo trong IDE.

## 7. Cách tách các thuật ngữ thường nhầm

**Bean** là đối tượng do Spring container quản lý. `@Service` đánh dấu một thành phần nghiệp vụ; `@RestController` đánh dấu thành phần web. Các thành phần được inject qua constructor. Điều này giúp thay dependency trong test và quản lý vòng đời, nhưng bản thân annotation `@Service` không tự bảo đảm code đúng nghiệp vụ.

**Request DTO** là hợp đồng dữ liệu đầu vào, thường dùng Java `record` và validation. **Response DTO** là hợp đồng đầu ra. **Entity** phản ánh dữ liệu lưu và quan hệ JPA. Tách chúng giúp API không bắt buộc lộ toàn bộ cấu trúc database hoặc các quan hệ lazy. Tuy nhiên việc tách lớp chỉ hữu ích khi mapping đúng; đọc `from(...)` của response để hiểu những gì thực sự trả về.

**Repository** là nơi truy cập dữ liệu, không tự thay thế service. **Transaction** không phải là một HTTP request: nó là ranh giới quản lý thao tác dữ liệu; một request có thể thực hiện nhiều thao tác, hoặc không thao tác database.

## 8. Đọc thật kỹ một controller: danh mục gói tập

Đây là đoạn trích nguyên văn trong `MembershipPlanController`, đã bỏ import và các method khác:

```java
@RestController
@RequestMapping("/v1/membership-plans")
@RequiredArgsConstructor
public class MembershipPlanController {
    private final MembershipPlanService membershipPlanService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MembershipPlanResponse> create(@Valid @RequestBody MembershipPlanRequest request) {
        return ApiResponse.created(membershipPlanService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<MembershipPlanResponse>> listActive() {
        return ApiResponse.ok(membershipPlanService.listActive());
    }
}
```

Giải thích theo đúng thứ tự khi đọc:

1. `@RestController` đăng ký lớp xử lý web; giá trị trả về được Spring chuyển thành JSON thay vì tên template HTML.
2. `@RequestMapping` đặt đường dẫn chung. Ứng dụng còn có context path `/api`, vì vậy đường dẫn đầy đủ là `/api/v1/membership-plans`. Chỉ đọc annotation trong lớp mà quên context path sẽ gọi sai URL.
3. `@RequiredArgsConstructor` là Lombok sinh constructor cho field `final`. Spring inject service vào constructor đó; controller không tự `new MembershipPlanService()`.
4. `@PostMapping` chọn HTTP POST. `@PreAuthorize` yêu cầu role OWNER; đây là kiểm tra quyền ở method, bên cạnh cấu hình Security và JWT filter.
5. `@RequestBody` chuyển JSON thành `MembershipPlanRequest`; `@Valid` yêu cầu chạy các ràng buộc khai báo trên DTO trước khi method được gọi. Validation DTO không thay thế quy tắc nghiệp vụ ở service.
6. Controller gọi service, rồi gói kết quả bằng `ApiResponse.created`. Nó không tự lưu entity và tên `created` trong body không tự chứng minh HTTP status là 201.
7. `@GetMapping` cùng đường dẫn nhưng khác HTTP method. OWNER và PT được qua annotation, service lấy những gói active; bản thân annotation không lọc dữ liệu.

## 9. Tập lần theo một request

Giả sử OWNER mở danh sách gói: trình duyệt gửi `GET /api/v1/membership-plans` kèm Bearer token; security filter kiểm tra token; method security kiểm tra role; controller gọi `listActive`; service gọi repository, ánh xạ entity sang DTO; cuối cùng response được bọc trong `ApiResponse` và frontend đọc dữ liệu. Nếu không có quyền, request có thể dừng trước khi service chạy. Nếu repository không tìm thấy gói active, danh sách rỗng khác với lỗi 404.

Khi tự học, hãy đặt breakpoint lần lượt tại controller, `MembershipPlanService.listActive` và `MembershipPlanRepository.findByActiveTrueOrderByNameAsc`. Xem loại giá trị tại mỗi điểm: request/param ở controller, entity trong service, response DTO trả ra. Nếu chạy bằng debugger, dùng tài khoản demo và tuyệt đối không chép Bearer token vào tài liệu hay ảnh báo cáo.

**Câu hỏi tự kiểm tra:** Nếu bỏ `@Valid`, ràng buộc trên DTO có còn tự chạy ở điểm này không? Nếu PT gọi POST, lỗi xuất hiện trước hay sau khi service tạo gói? Nếu `@RequestMapping` giống nhau nhưng HTTP method khác, Spring phân biệt hai handler bằng gì? Đối chiếu luồng thực tế, không kết luận chỉ từ tên biến.
