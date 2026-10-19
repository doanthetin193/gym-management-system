# Entity, repository, transaction và dữ liệu local

## 1. Entity và quan hệ

JPA entity là object Java được Hibernate ánh xạ với bảng. Ví dụ [`User`](../../../backend/src/main/java/com/gymduongdouble/backend/user/domain/User.java) ánh xạ bảng `users`; email có ràng buộc unique, trạng thái được lưu theo tên enum, quan hệ role dùng `@ManyToMany` qua bảng `user_roles`. Tên field Java không nhất thiết giống tên cột, vì `@Column` có thể đặt tên cột rõ ràng.

Entity kế thừa [`AuditableEntity`](../../../backend/src/main/java/com/gymduongdouble/backend/common/domain/AuditableEntity.java), lớp này kế thừa [`BaseEntity`](../../../backend/src/main/java/com/gymduongdouble/backend/common/domain/BaseEntity.java):

- `id` dùng `GenerationType.IDENTITY`; database cấp khóa chính.
- `createdAt`, `updatedAt` dùng Spring Data JPA auditing; [`JpaConfig`](../../../backend/src/main/java/com/gymduongdouble/backend/common/config/JpaConfig.java) bật auditing.
- `deleted` mặc định `false` chỉ là cột nền tảng. Dự án **chưa có cơ chế soft delete hoàn chỉnh tự động áp dụng cho mọi query và thao tác xóa**; không nên trình bày rằng đã có.

`@MappedSuperclass` cho các lớp cha dùng chung mapping; nó không tạo một bảng riêng chỉ vì lớp cha tồn tại. Khi đọc entity, chú ý nullable, unique, loại dữ liệu, `fetch` và cascade được khai báo thực tế, thay vì suy ra từ giao diện.

## 2. Repository

[`UserRepository`](../../../backend/src/main/java/com/gymduongdouble/backend/user/repository/UserRepository.java) là ví dụ lớp truy cập dữ liệu. Spring Data tạo implementation từ interface; method tìm theo email/điện thoại phục vụ xác thực. Repository cung cấp cơ chế truy vấn, còn quyết định tài khoản có được đăng nhập hay không thuộc service và security.

Không phải mọi quan hệ được nạp sẵn: `User.roles` dùng `LAZY`. Cấu hình `spring.jpa.open-in-view: false` nghĩa là không duy trì persistence context cho toàn bộ thời gian render response; service cần chuẩn bị dữ liệu cần thiết khi còn trong phạm vi phù hợp.

## 3. Transaction thực tế

Đọc [`AuthService`](../../../backend/src/main/java/com/gymduongdouble/backend/auth/service/AuthService.java). `login()` có `@Transactional`: sau khi xác thực thành công, code lấy `User` từ repository và đặt `lastLoginAt`; Hibernate có thể theo dõi thay đổi entity đang được quản lý và ghi xuống khi transaction commit. `changePassword()` cũng dùng transaction khi thay password hash và tăng phiên bản token.

Trong [`CustomUserDetailsService`](../../../backend/src/main/java/com/gymduongdouble/backend/common/security/CustomUserDetailsService.java), `loadUserByUsername()` dùng `@Transactional(readOnly = true)` để đọc dữ liệu và dựng `AuthenticatedUser`.

Transaction giúp nhóm thao tác database theo một ranh giới nhất quán; không biến lời gọi HTTP bên ngoài hay trạng thái trong bộ nhớ thành dữ liệu được database tự rollback. Chi tiết rollback còn phụ thuộc loại exception và cấu hình Spring, không nên hiểu là mọi ngoại lệ đều giống nhau.

## 4. Cấu hình local và ngày giờ

[`application.yml`](../../../backend/src/main/resources/application.yml) hiện cấu hình PostgreSQL, `ddl-auto: update`, `open-in-view: false` và Flyway `enabled: false`. Hibernate có thể cập nhật schema khi chạy; đây **không phải** lịch sử migration được Flyway quản lý. Không xóa database chỉ để khắc phục lỗi startup nếu chưa sao lưu và xác nhận dữ liệu.

[`AppClock`](../../../backend/src/main/java/com/gymduongdouble/backend/common/time/AppClock.java) cung cấp ngày hiện tại theo `Asia/Ho_Chi_Minh`; cấu hình Hibernate cũng chỉ định múi giờ JDBC. `LocalDate` biểu diễn ngày nghiệp vụ không kèm giờ; `Instant` biểu diễn một thời điểm, như `lastLoginAt`. Khi đọc từng service, cần kiểm tra nó thực sự dùng nguồn thời gian nào; không giả định mọi nơi đều gọi `AppClock`.

## 5. Khởi tạo dữ liệu

[`DataInitializer`](../../../backend/src/main/java/com/gymduongdouble/backend/common/config/DataInitializer.java) là nơi cần đọc khi tìm dữ liệu khởi tạo. Các thông số owner/demo lấy từ cấu hình; không mặc định seed là công cụ sao lưu hay migration. Trước khi chạy với database đang có dữ liệu, xem điều kiện trong initializer và `DEMO_SEED_ENABLED`.

## Tự kiểm tra

1. `@MappedSuperclass` khác `@Entity` thế nào?
2. Tại sao sửa `lastLoginAt` trong transaction có thể được lưu dù không gọi `save()` ngay tại dòng đó?
3. Vì sao `deleted` và Flyway hiện tại không nên được giới thiệu là hai cơ chế đã hoàn chỉnh?

## 6. Persistence context và dirty checking bằng ví dụ

Trong `AuthService.login`, lời gọi `userRepository.findById(...)` tìm entity trong transaction và `setLastLoginAt(Instant.now())`. Entity được quản lý có thể bị Hibernate theo dõi: khi transaction flush/commit, Hibernate so trạng thái và phát sinh update cần thiết. Đây là lý do đoạn code không nhất thiết phải gọi `save` ngay sau setter. Ngược lại, thay một DTO hoặc một object không được quản lý không tự ghi database.

Đừng kết luận một method `@Transactional` chắc chắn thành công chỉ vì đã chạy qua `repository.save`: database vẫn có thể báo lỗi tại flush hoặc commit. Khi có lỗi, cần phân biệt exception xảy ra trước hay sau commit và dữ liệu nào thực sự thuộc transaction. Lời gọi self-invocation trong cùng bean và proxy Spring cũng là chủ đề cần kiểm tra cẩn thận, không mặc định mọi annotation đều được kích hoạt theo cùng cách.

## 7. Quan hệ lazy và DTO

`User.roles` là quan hệ LAZY. Trong `CustomUserDetailsService.loadUserByUsername`, code dựng `AuthenticatedUser` ngay trong method `@Transactional(readOnly = true)` và duyệt role để tạo authorities. Bài học là cần xác định **nơi truy cập quan hệ** và transaction bao quanh, thay vì chỉ thấy `LAZY` rồi kết luận lúc nào cũng có lỗi. Với `open-in-view: false`, trả entity trực tiếp và đợi phần serialize ngoài transaction đọc các quan hệ chưa nạp là cách dễ gặp vấn đề.

Với tiền, đọc annotation `precision=15, scale=2` ở `MemberMembership` và `DebtRecord`; tìm từng phép `BigDecimal.add`, `subtract`, `compareTo` trong service. `precision` và `scale` là ràng buộc biểu diễn ở cột, còn điều kiện số tiền không vượt nợ được kiểm tra ở service/DTO. Hai lớp bảo vệ có vai trò khác nhau.

## 8. Bài thực hành không làm thay đổi dữ liệu

1. Mở entity `User`, viết bảng ánh xạ: tên field Java, tên cột, nullable, unique và quan hệ. Với field không có `@Column(name=...)`, đối chiếu naming strategy trước khi khẳng định tên SQL cụ thể.
2. Trong `application.yml`, giải thích từng dòng `datasource`, `ddl-auto`, `open-in-view`, múi giờ JDBC và `flyway.enabled`. Đọc biến môi trường chỉ theo tên, không đưa giá trị bí mật vào báo cáo.
3. Tìm `@Version` trong entity công nợ và đọc handler lỗi xung đột. Tự giải thích tại sao hai transaction cập nhật cùng bản ghi cần kiểm tra phiên bản.

## 9. Từ lớp Java đến bảng: đọc `BaseEntity`

Đoạn trích thực tế, đã bỏ import:

```java
@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean deleted = false;
}
```

`@MappedSuperclass` nghĩa là các entity kế thừa nhận mapping của những field này; nó không mặc nhiên tạo bảng riêng cho `BaseEntity`. `@Id` là khóa chính JPA; `IDENTITY` để database sinh ID khi chèn. `Long` có thể là `null` trước khi lưu, khác `long` nguyên thủy. `nullable = false` là khai báo mapping/schema, không phải nghiệp vụ tự xóa hay tự ẩn dữ liệu.

`deleted` chỉ là boolean mặc định `false`: code này **không** tự chuyển thành `true` khi gọi `delete`, không tự thêm `WHERE deleted = false`, và không tự khôi phục. Do đó không được thuyết trình rằng dự án đã có soft delete hoàn chỉnh chỉ vì thấy field này. Muốn biết bản ghi nào thực sự bị ẩn hoặc xóa, phải đọc repository và service của từng module.

`AuditableEntity` kế thừa cấu trúc này và dùng `@CreatedDate`, `@LastModifiedDate` cùng `AuditingEntityListener`. Hãy tìm thêm `@EnableJpaAuditing`: listener và cấu hình auditing cùng phối hợp điền thời gian. `createdAt` được khai báo `updatable = false`; không nhầm với `lastLoginAt`, một trường nghiệp vụ riêng được cập nhật khi đăng nhập.

## 10. Transaction nhìn qua ví dụ thu tiền

Ví dụ minh họa ý tưởng, **không phải nguyên văn method**:

```java
@Transactional
public void thuTien(...) {
    // Kiểm tra khoản nợ, số tiền và quyền.
    // Ghi phiếu thu, cập nhật số đã trả và số còn nợ.
}
```

Nếu đang xử lý một phiếu thu 2 triệu, lưu phiếu thành công nhưng cập nhật công nợ lỗi, hai thay đổi không nên tách rời: transaction giúp chúng cùng commit hoặc rollback theo cấu hình và loại exception. Chỉ riêng annotation không chứng minh mọi hành động bên ngoài, ví dụ HTTP sang dịch vụ thứ ba, đều có thể rollback bằng database. Cũng cần chú ý thời điểm JPA flush: lỗi ràng buộc hay optimistic lock có thể xuất hiện khi flush/commit thay vì ngay dòng `save`.

Ở entity `DebtRecord`, `@Version` giúp phát hiện hai transaction cùng sửa từ một phiên bản cũ. Ví dụ cùng đọc version 3; giao dịch A commit thành 4; B còn dựa trên 3 thì bị xung đột và handler trả 409. B phải tải lại trước khi thử lại, không cộng hai phiếu một cách mù quáng. Đây là optimistic locking, không phải tự động xếp hàng chờ như pessimistic lock.

**Bài đọc:** mở `DebtRecord`, `PaymentService.create` và handler `ObjectOptimisticLockingFailureException`; viết ra những bản ghi được cập nhật, kiểm tra lỗi có thể xảy ra, và trạng thái mong đợi sau rollback. Không chạy thử ghi phiếu trên dữ liệu thực chỉ để quan sát transaction.
