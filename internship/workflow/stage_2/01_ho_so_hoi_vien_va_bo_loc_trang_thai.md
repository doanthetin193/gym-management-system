# 🎯 GIAI ĐOẠN 2 (SPRINT 2) - CHẶNG 01: HỒ SƠ HỘI VIÊN & BỘ LỌC TRẠNG THÁI (BACKEND)

Tài liệu này phân tích chi tiết lát cắt nghiệp vụ đầu tiên của **Sprint 2: Quản lý Hội viên & Gói tập**. Toàn bộ mã nguồn đã được triển khai hoàn chỉnh trong tầng Backend (Spring Boot 4 / Java 21).

---

## 🧭 1. Mục tiêu Nghiệp vụ của Chặng 01

Trong thực tế vận hành phòng gym, nhân viên lễ tân và chủ phòng tập thường xuyên gặp 3 bài toán nghiệp vụ quan trọng:
1. **Cập nhật thông tin hội viên (`PUT /v1/members/{id}`):** Khách đổi SĐT, đổi địa chỉ, thêm ngày sinh... Hệ thống phải cho phép sửa nhưng **tuyệt đối không cho đổi trùng SĐT với người khác** (nhưng **vẫn cho phép giữ nguyên SĐT hiện tại của chính khách đó**).
2. **Xem hồ sơ 360 độ (`GET /v1/members/{id}`):** Chỉ với 1 lần gọi API, trả về toàn diện: Thông tin cá nhân, các gói tập đang có hiệu lực, lịch sử các gói tập cũ đã hết hạn, danh sách gói buổi tập với HLV (PT), và tổng số tiền nợ còn lại.
3. **Bộ lọc chăm sóc khách hàng (`GET /v1/members?filter=...`):** Phân loại nhanh khách hàng theo 4 trạng thái:
   - `ALL`: Toàn bộ khách hàng.
   - `ACTIVE`: Khách đang có gói tập còn hạn.
   - `EXPIRING_SOON`: Khách sắp hết hạn gói trong vòng **7 ngày tới** (để lễ tân gọi điện nhắc gia hạn).
   - `EXPIRED`: Khách đã hết hạn gói tập.

---

## 🏗️ 2. Phân tích Chi tiết Từng File Mã Nguồn

### 📌 2.1. DTO Cập nhật: [MemberUpdateRequest.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/web/dto/MemberUpdateRequest.java)

```java
public record MemberUpdateRequest(
    @NotBlank(message = "Tên khách hàng là bắt buộc.")
    String fullName,

    @NotBlank(message = "Số điện thoại là bắt buộc.")
    String phone,

    LocalDate dateOfBirth,
    Gender gender,
    String address,
    String zaloPhone,
    MemberSource source,
    MemberStatus status,
    String note
) {
}
```

- **Giải thích:** Sử dụng Java 21 `record` bất biến (immutable).
- Sử dụng `@NotBlank` từ `jakarta.validation.constraints` để bảo đảm `fullName` và `phone` không được rỗng hoặc chỉ chứa khoảng trắng.

---

### 📌 2.2. DTO Hồ sơ Đa nguồn: [MemberDetailResponse.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/web/dto/MemberDetailResponse.java)

```java
public record MemberDetailResponse(
    MemberResponse profile,
    List<MemberMembershipResponse> activeMemberships,
    List<MemberMembershipResponse> membershipHistory,
    List<PtSessionPackageResponse> ptSessionPackages,
    BigDecimal totalDebt
) {
}
```

- **Tại sao cần Composite DTO này?**
  Thay vì Frontend phải gửi 4–5 request riêng biệt (gọi `/members/{id}`, gọi `/memberships/active`, gọi `/memberships/history`, gọi `/pt-packages`, gọi `/debts`), Backend gom toàn bộ thông tin trong 1 DTO duy nhất. Điều này giúp:
  - Giảm số lượng HTTP request (tiết kiệm băng thông, tăng tốc độ load trang).
  - Đảm bảo tính nhất quán của dữ liệu (data consistency) tại thời điểm tra cứu.

---

### 📌 2.3. Enum Bộ lọc: [MemberListFilter.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/web/dto/MemberListFilter.java)

```java
public enum MemberListFilter {
    ALL,
    ACTIVE,
    EXPIRING_SOON,
    EXPIRED
}
```

- Định nghĩa 4 giá trị bộ lọc chuẩn hoá, loại bỏ rủi ro sai chính tả do dùng String tự do.

---

### 📌 2.4. Tầng Truy vấn Dữ liệu: [MemberRepository.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/repository/MemberRepository.java)

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    List<Member> findByFullNameContainingIgnoreCaseOrPhoneContaining(String fullName, String phone);
}
```

> [!IMPORTANT]
> **Điểm mấu chốt: `existsByPhoneAndIdNot(String phone, Long id)`**
> - **Bài toán:** Khi Hội viên A (ID = 1, SĐT = `0901234567`) cập nhật địa chỉ hoặc ngày sinh mà không thay đổi SĐT:
>   - Nếu ta dùng `findByPhone("0901234567")`, hệ thống sẽ tìm thấy Hội viên A và báo lỗi: *"Số điện thoại đã tồn tại"* (báo lỗi oan!).
>   - Nếu dùng `existsByPhoneAndIdNot("0901234567", 1L)`, Spring Data JPA sẽ sinh câu lệnh SQL:
>     `SELECT count(*) > 0 FROM members WHERE phone = '0901234567' AND id <> 1`
>   - Nhờ đó, khách hàng có thể thoải mái giữ nguyên SĐT cũ của họ, nhưng nếu đổi sang SĐT của một người khác (ví dụ ID = 2) thì hệ thống sẽ ngay lập tức chặn lại và ném `ConflictException`.

---

### 📌 2.5. Tầng Nghiệp vụ: [MemberService.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/service/MemberService.java)

#### A. Cập nhật thông tin hội viên (`update`)
```java
@Transactional
public MemberResponse update(Long id, MemberUpdateRequest request) {
    Member member = findEntity(id);
    String normalizedPhone = request.phone().trim();

    // 1. Kiểm tra SĐT có bị trùng với người khác không
    if (memberRepository.existsByPhoneAndIdNot(normalizedPhone, id)) {
        throw new ConflictException("Số điện thoại đã tồn tại trong hệ thống.");
    }

    // 2. Cập nhật các trường thông tin
    member.setFullName(request.fullName().trim());
    member.setPhone(normalizedPhone);
    member.setDateOfBirth(request.dateOfBirth());
    member.setGender(request.gender());
    member.setAddress(request.address());
    member.setZaloPhone(StringUtils.hasText(request.zaloPhone()) ? request.zaloPhone().trim() : normalizedPhone);
    member.setSource(request.source());
    member.setStatus(request.status() == null ? member.getStatus() : request.status());
    member.setNote(request.note());

    return MemberResponse.from(memberRepository.save(member));
}
```

#### B. Lấy chi tiết hồ sơ 360 độ (`getDetail`)
```java
@Transactional(readOnly = true)
public MemberDetailResponse getDetail(Long id) {
    Member member = findEntity(id);
    LocalDate today = LocalDate.now();
    List<MemberMembership> memberships = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(id);

    // Tách thành 2 danh sách: Đang active và Lịch sử cũ
    List<MemberMembershipResponse> activeMemberships = memberships.stream()
        .filter(membership -> isActiveMembership(membership, today))
        .map(MemberMembershipResponse::from)
        .toList();

    List<MemberMembershipResponse> membershipHistory = memberships.stream()
        .filter(membership -> !isActiveMembership(membership, today))
        .map(MemberMembershipResponse::from)
        .toList();

    // Lấy danh sách các gói buổi PT
    List<PtSessionPackageResponse> ptSessionPackages = ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(id).stream()
        .map(PtSessionPackageResponse::from)
        .toList();

    return new MemberDetailResponse(
        MemberResponse.from(member),
        activeMemberships,
        membershipHistory,
        ptSessionPackages,
        totalDebt(id)
    );
}
```

#### C. Lọc danh sách hội viên theo trạng thái (`list`)
```java
private static final int EXPIRING_SOON_DAYS = 7;

private boolean matchesFilter(MemberSummaryResponse summary, MemberListFilter filter, LocalDate today) {
    if (filter == MemberListFilter.ALL) {
        return true;
    }
    if (summary.endDate() == null) {
        return false;
    }

    return switch (filter) {
        case ACTIVE -> !summary.endDate().isBefore(today); // endDate >= today
        case EXPIRING_SOON -> !summary.endDate().isBefore(today)
            && !summary.endDate().isAfter(today.plusDays(EXPIRING_SOON_DAYS)); // today <= endDate <= today + 7
        case EXPIRED -> summary.endDate().isBefore(today); // endDate < today
        case ALL -> true;
    };
}
```

---

### 📌 2.6. Tầng REST Controller: [MemberController.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/member/web/MemberController.java)

```java
@RestController
@RequestMapping("/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberResponse> create(@Valid @RequestBody MemberCreateRequest request) {
        return ApiResponse.created(memberService.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<MemberDetailResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(memberService.getDetail(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberResponse> update(@PathVariable Long id, @Valid @RequestBody MemberUpdateRequest request) {
        return ApiResponse.ok(memberService.update(id, request));
    }

    @GetMapping
    public ApiResponse<List<MemberSummaryResponse>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "ALL") MemberListFilter filter
    ) {
        return ApiResponse.ok(memberService.list(keyword, filter));
    }
}
```

- `@PreAuthorize("hasRole('OWNER')")`: Chỉ tài khoản chủ phòng (OWNER) mới có quyền tạo và chỉnh sửa thông tin khách hàng.
- Endpoint `GET /v1/members`: Nhận `filter` dạng enum, mặc định là `ALL`.

---

## 💡 3. Tóm tắt Kiến thức Cần Nắm Cho Phỏng vấn / Bảo vệ Đồ án

1. **Tại sao lại dùng `existsByPhoneAndIdNot` thay vì `findByPhone` khi update?**
   - Trả lời: Khi update, người dùng có thể chỉ sửa tên hoặc ngày sinh mà không sửa SĐT. `existsByPhoneAndIdNot` cho phép người dùng giữ nguyên SĐT của mình mà không bị dính lỗi trùng, đồng thời vẫn ngăn chặn việc lấy SĐT của người khác.
2. **DTO `MemberDetailResponse` giải quyết vấn đề gì trong kiến trúc?**
   - Trả lời: Giải quyết bài toán N+1 request ở Frontend và giảm overhead mạng bằng cách tổng hợp Profile, Active Memberships, History, PT Packages và Tổng nợ vào 1 payload duy nhất.
3. **Logic lọc `EXPIRING_SOON` được tính toán như thế nào?**
   - Trả lời: Lấy các gói tập có ngày kết thúc nằm trong khoảng từ `hôm nay (today)` đến `hôm nay + 7 ngày (today + 7)`.
