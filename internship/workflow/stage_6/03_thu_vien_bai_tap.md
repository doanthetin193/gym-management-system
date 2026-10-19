# Thư viện bài tập và video TikTok

## 1. Dữ liệu và hai nhóm API

[`Exercise`](../../../backend/src/main/java/com/gymduongdouble/backend/exercise/domain/Exercise.java) và [`ExerciseCategory`](../../../backend/src/main/java/com/gymduongdouble/backend/exercise/domain/ExerciseCategory.java) lưu thông tin bài tập và danh mục. Nội dung có thể gồm tên, slug, mô tả, hướng dẫn, lỗi thường gặp, độ khó, nhóm cơ, thiết bị, link/video ID TikTok, thumbnail, featured và active; hãy mở entity để xem nullability và quan hệ cụ thể.

[`PublicExerciseController`](../../../backend/src/main/java/com/gymduongdouble/backend/exercise/web/PublicExerciseController.java) cho khách lấy danh mục, danh sách, chi tiết bài tập public. [`OwnerExerciseController`](../../../backend/src/main/java/com/gymduongdouble/backend/exercise/web/OwnerExerciseController.java) yêu cầu OWNER để quản lý danh mục và bài tập. Code không quản lý thống kê viewCount TikTok trong flow này.

## 2. Tạo/cập nhật video

Trong [`ExerciseService.applyExercise`](../../../backend/src/main/java/com/gymduongdouble/backend/exercise/service/ExerciseService.java), service tìm category, trim URL, gọi `validateTiktokUrl`, tạo slug duy nhất rồi gán các trường request. `extractTiktokVideoId` lấy chữ số theo regex `/video/(\\d+)`. Link rút gọn không có đoạn video ID bị từ chối; thông báo yêu cầu link đầy đủ.

Điều kiện URL hiện tại dùng kiểm tra chuỗi chứa `tiktok.com` hoặc `vt.tiktok.com` và có mẫu `/video/{id}`; đây là kiểm tra đang triển khai, **không phải** một bộ xác minh host URL chặt chẽ. Khi mô tả cho mentor cần nói đúng giới hạn này, không khẳng định nó chứng minh mọi URL đều an toàn hoặc video luôn tồn tại.

`uniqueSlug` lấy slug request hoặc tên, bỏ dấu bằng `Normalizer`, đổi chữ thường, thay ký tự ngoài chữ/số bằng `-`; nếu trùng thì nối `-2`, `-3`... theo vòng lặp. Trong update, bản ghi hiện tại được loại khỏi kiểm tra trùng. Điều này giúp tạo đường dẫn dễ đọc, không thay thế database constraint hay kiểm thử cạnh tranh.

## 3. Lọc và phân trang

`listPublicExercises` tạo Spring Data `Specification` với published=true, lọc thêm categorySlug, level, keyword, featured nếu có; khi published=true còn yêu cầu category active. Danh sách public sắp xếp featured giảm dần rồi tên tăng dần. `listOwnerExercises` cho phép lọc thêm published và sắp theo updatedAt giảm dần.

`normalizePage` không cho số trang âm; `normalizeSize` dùng 12 khi size ≤ 0 và tối đa 50. Kết quả được đổi sang `PageResponse`. `exerciseSpec` fetch category cho query trả entity, nhưng không fetch trong query count; đọc nhánh `query.getResultType()` để hiểu tại sao pagination tạo cả truy vấn danh sách lẫn tổng số.

Chi tiết public tìm theo ID nếu input toàn chữ số, nếu không tìm theo slug; cần bài tập active và category active. Owner có endpoint đổi published và xóa; `deleteExercise` gọi repository.delete, không nên gọi đó là soft delete.

## 4. Frontend và giới hạn nhúng

Trang quản lý là [`OwnerExercisesPage.tsx`](../../../frontend/src/features/exercises/pages/OwnerExercisesPage.tsx); component nhúng video và trang public cần được lần theo import thực tế. Hệ thống lưu liên kết và thông tin phục vụ hiển thị, còn video được cung cấp bởi TikTok: trạng thái video, việc cho phép nhúng và kết nối mạng có thể ảnh hưởng phát lại. Không suy ra hệ thống đang tải video về server hay có số lượt xem chính xác.

## 5. Tự kiểm tra

1. Tạo video thử bằng link đầy đủ và link rút gọn: đối chiếu `validateTiktokUrl` và kết quả.
2. Tắt bài hoặc category: giải thích khác biệt danh sách quản trị và public.
3. Tạo hai bài cùng tên: phân tích slug và suffix. Tìm nơi code áp dụng giới hạn page size.
4. Xem Network: trang lấy metadata từ API riêng và việc phát video phụ thuộc bên thứ ba như thế nào? Không thử với dữ liệu nhạy cảm.

## 6. Truy vấn bài công khai và lọc danh mục

Trích nhánh thực tế trong `ExerciseService.exerciseSpec`:

```java
if (published != null) {
    predicates = criteriaBuilder.and(predicates, criteriaBuilder.equal(root.get("active"), published));
    if (Boolean.TRUE.equals(published)) {
        predicates = criteriaBuilder.and(predicates, criteriaBuilder.isTrue(root.get("category").get("active")));
    }
}
```

Khi truy vấn public yêu cầu `published = true`, không chỉ bài phải active mà danh mục của bài cũng phải active. Nếu bài active nhưng danh mục bị ẩn, bài không thỏa điều kiện public. `Specification` dựng điều kiện truy vấn tùy bộ lọc; còn `PageRequest` áp trang/kích thước/sắp xếp. Hãy kiểm tra `normalizePage`, `normalizeSize` và response phân trang trước khi gọi từ frontend.

Khi OWNER ẩn bài, method `setPublished` đổi `active`; khi xóa, `deleteExercise` gọi repository `delete`, là hành vi khác ẩn. Từ code này không nên nói chức năng thư viện đang soft delete hoàn chỉnh.

## 7. Đường đi của link TikTok và giới hạn kiểm tra

`applyExercise` lấy `tiktokUrl`, gọi `validateTiktokUrl`, lưu URL và tách ID. Kiểm tra hiện tại dùng `contains` và yêu cầu mẫu `/video/{id}`; nó là kiểm tra định dạng theo code, không phải bằng chứng đã xác thực chặt host hay nội dung của video. Trình phát nhúng còn phụ thuộc TikTok, mạng, quyền riêng tư và chính sách bên ngoài; metadata trong database tồn tại không bảo đảm bên thứ ba luôn phát được.

Bài thực hành trên dữ liệu demo: tạo bài với link đầy đủ hợp lệ; kiểm tra ID trích ra và hiển thị; thử link rút gọn và quan sát lỗi; ẩn danh mục rồi kiểm tra public. Không nhận xét hệ thống có thống kê lượt xem: hãy tìm trong entity/API hiện tại trước, vì thư viện tập trung nhúng và quản lý metadata bài.
