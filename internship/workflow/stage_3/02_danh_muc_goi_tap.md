# Danh mục gói tập: mô hình, API và kiểm tra nghiệp vụ

## 1. Gói mẫu khác lượt đăng ký

`MembershipPlan` là định nghĩa sản phẩm: tên, loại gói, thời hạn, giá mặc định và số buổi. `MemberMembership` là lượt một hội viên đăng ký gói đó: ngày bắt đầu/kết thúc, giá bán thực tế, giảm giá, đã thu và còn nợ. Nhiều lượt đăng ký có thể tham chiếu cùng một plan; không nhầm việc sửa tình trạng bán của plan với xóa lịch sử khách đã mua.

Mở [`MembershipPlan`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/domain/MembershipPlan.java), [`MembershipPlanController`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/MembershipPlanController.java), [`MembershipPlanRequest`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/web/dto/MembershipPlanRequest.java) và [`MembershipPlanService`](../../../backend/src/main/java/com/gymduongdouble/backend/membership/service/MembershipPlanService.java).

## 2. Những trường đáng chú ý

| Trường | Vai trò trong code |
| --- | --- |
| `name` | Tên plan; service trim và kiểm tra trùng không phân biệt hoa thường khi tạo. |
| `planType` | Enum phân biệt loại; dùng trong kiểm tra cấu trúc và tạo gói buổi PT. |
| `ptLevel` | Phân loại PT cho plan PT; không phải chứng chỉ hay hồ sơ năng lực của từng huấn luyện viên. |
| `durationDays` | Số ngày mặc định để tính ngày kết thúc lượt đăng ký. |
| `defaultPrice` | Giá mặc định; lượt đăng ký có thể có `actualPrice` riêng. |
| `ptSessionCount`, `practiceSessionCount` | Định mức của plan PT. |
| `guidanceSessionCount` | Định mức cho loại GUIDANCE. |
| `description`, `active` | Mô tả quyền lợi và trạng thái niêm yết bán. |

Tiền dùng `BigDecimal` và cột có precision/scale; điều này tránh kiểu số nhị phân `double` cho các phép tính tiền. `BigDecimal.ZERO` là giá trị 0; so sánh bằng `compareTo`, không nên dùng toán tử `>` cho object.

## 3. Các endpoint và quyền

Controller có `POST /api/v1/membership-plans` cho OWNER tạo; `GET /api/v1/membership-plans` cho OWNER/PT lấy danh sách active; `GET /api/v1/membership-plans/all` cho OWNER lấy toàn bộ; `PUT /api/v1/membership-plans/{id}/active` cho OWNER đổi trạng thái active. `PublicMembershipPlanController` có `GET /api/v1/public/membership-plans` cho trang chủ, dùng cùng query active nhưng ánh xạ sang `PublicMembershipPlanResponse` nhỏ hơn. Đây là những method được khai báo trong controller; đừng suy ra có API sửa mọi thông tin plan từ việc có API đổi trạng thái.

Frontend quản lý tại [`MembershipPlansPage.tsx`](../../../frontend/src/features/membership-plans/pages/MembershipPlansPage.tsx); xem API client mà trang gọi và đối chiếu controller trước khi nói chức năng nào đã tồn tại.

## 4. Validation theo hai tầng

`MembershipPlanRequest` kiểm tra kiểu và giới hạn cơ bản bằng annotation. Ví dụ `@NotBlank` với tên, `@NotNull` với loại, `@Min(1)` với thời hạn khi trường có giá trị, các số buổi không âm. Nhưng `@Min` không tự bắt `null`; service có kiểm tra thời hạn phải tồn tại và lớn hơn 0.

Trong `validatePlanShape()`:

- `PT`: phải có `ptLevel`, số buổi PT > 0 và số buổi ôn tập > 0; không được khai báo `guidanceSessionCount` khác `null`.
- `GUIDANCE`: không có các trường PT; số buổi hướng dẫn phải > 0.
- Các loại còn lại: không có trường PT, đồng thời `guidanceSessionCount` phải là `null`.

Lưu ý kiểm tra một trường phải `null` khác với kiểm tra bằng 0. Nếu client gửi `guidanceSessionCount: 0` cho plan PT, điều kiện `!= null` vẫn từ chối. Đây là chi tiết hữu ích khi test API trực tiếp.

## 5. Lưu dữ liệu và active

Sau khi validation, service kiểm tra tên trùng bằng `existsByNameIgnoreCase`, tạo entity, giá mặc định null thành 0 và `active` null thành `true`. `listActive` dùng repository lấy plan active theo tên; `listAll` lấy cả active lẫn inactive; `listPublic` dùng cùng điều kiện active nhưng ánh xạ sang DTO công khai rút gọn. Khi `updateActive`, entity được nạp trong transaction, đổi cờ và trả response; `MemberMembershipService.create` cũng kiểm tra plan active, không chỉ dựa vào việc UI có hiển thị plan hay không.

Trạng thái plan không phải trạng thái của từng lượt đăng ký. Khi cần phân tích ảnh hưởng tới gói đã bán, xem code ở module membership thay vì mặc định rằng inactive sẽ đổi toàn bộ lịch sử.

## 6. Tình huống tự kiểm thử

1. Tạo plan PT thiếu `ptLevel`: DTO có thể nhận, nhưng service phải từ chối.
2. Gửi plan PT với `guidanceSessionCount=0`: phân tích vì sao vẫn bị từ chối.
3. Tạo plan hai lần với cùng tên khác chữ hoa/thường: service kiểm tra ở đâu?
4. Tắt plan và thử đăng ký mới: tìm kiểm tra backend, không chỉ quan sát dropdown.
5. Tại sao giá mặc định của plan và giá thực tế trên lượt đăng ký có thể khác?

## 7. Repository và phép biến đổi từ entity sang response

Đây là method thật trong `MembershipPlanService`:

```java
@Transactional(readOnly = true)
public List<MembershipPlanResponse> listActive() {
    return membershipPlanRepository.findByActiveTrueOrderByNameAsc().stream()
        .map(MembershipPlanResponse::from)
        .toList();
}
```

Tên repository thể hiện điều kiện `active = true` và thứ tự tên tăng dần. `stream()` đi qua từng entity; `map` tạo DTO; `toList()` tạo danh sách kết quả. `readOnly = true` biểu thị ý định đọc trong transaction, không phải bộ kiểm soát quyền và cũng không có nghĩa bất kỳ thay đổi nào chắc chắn bị database từ chối. Endpoint OWNER xem toàn bộ dùng luồng khác, nên một plan bị tắt không nhất thiết biến mất khỏi mọi màn hình.

Mở `MembershipPlanResponse.from` để xem field nào được trả; đừng giả định entity có field nào thì API đều gửi field đó. Mở `MembershipPlanRequest` và `validatePlanShape` để phân biệt validation định dạng với kiểm tra theo loại plan. Gói PT cần thông tin/buổi phù hợp PT; gói hướng dẫn có quy tắc riêng. Một gói bị tắt không được chọn đăng ký mới theo kiểm tra ở service, nhưng không có nghĩa lịch sử cũ phải bị xóa.

## 8. Giá niêm yết và giá giao dịch không phải một

Giả sử plan niêm yết 1.000.000 đồng. Một lượt đăng ký được nhập giá thực tế 900.000 đồng và giảm tiếp 100.000 đồng; số phải thu của lượt đó là 800.000 đồng, trước khi xét đã thanh toán. `MembershipPlan.defaultPrice` phục vụ làm giá mặc định; `MemberMembership.actualPrice` và `discountAmount` phản ánh lượt bán. Không tính doanh thu bằng cách nhân số hội viên với giá niêm yết: thực thu cần dựa trên phiếu thu.

Khi review, tạo bảng gồm loại gói, duration, giá mặc định, số buổi từng loại, active; với mỗi loại hãy đối chiếu nhánh validation. Không tạo plan thật chỉ để test nếu có thể dùng unit test hoặc dữ liệu demo; thay đổi plan làm ảnh hưởng dropdown và thao tác đăng ký của người khác.
