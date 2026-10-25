package com.gymduongdouble.backend.exercise.service;

import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.exercise.domain.Exercise;
import com.gymduongdouble.backend.exercise.domain.ExerciseCategory;
import com.gymduongdouble.backend.exercise.repository.ExerciseCategoryRepository;
import com.gymduongdouble.backend.exercise.repository.ExerciseRepository;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseCategoryRequest;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseCategoryResponse;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseRequest;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseResponse;
import com.gymduongdouble.backend.exercise.web.dto.PublishExerciseRequest;
import jakarta.persistence.criteria.JoinType;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dịch vụ Quản lý Thư viện Bài tập và Video hướng dẫn kỹ thuật TikTok.
 * 
 * ====================================================================================
 * CÁC QUY TẮC THIẾT KẾ & TỐI ƯU CỐT LÕI (MENTOR NOTES):
 * 1. Cơ chế Nhúng Video TikTok (Third-Party Embed Architecture):
 *    - Hệ thống chỉ lưu TRÍCH YẾU DỮ LIỆU (Metadata: URL, Video ID, Thumbnail, Tên, Mô tả, v.v.).
 *    - Backend KHÔNG tải file MP4 về lưu trữ để tiết kiệm dung lượng, băng thông và tránh rủi ro bản quyền.
 *    - Frontend sử dụng `tiktokVideoId` để dựng iFrame nhúng trình phát chính thức từ CDN của TikTok.
 * 2. Xác thực Link TikTok & Chặn Link Rút Gọn (SSRF & Thread Pool Protection):
 *    - `validateTiktokUrl` bắt buộc link đầy đủ có dạng `/video/{id}` (bắt bằng regex `/video/(\\d+)`).
 *    - Link rút gọn (`vt.tiktok.com/...`) bị TỪ CHỐI vì nó đòi hỏi backend phải thực hiện HTTP redirect
 *      ra internet ngoài để lấy URL gốc -> Gây nghẽn thread pool backend và tiềm ẩn nguy cơ SSRF.
 * 3. Sinh Slug chuẩn SEO & Xử lý Trùng lặp (SEO Slugification):
 *    - Tự động bỏ dấu tiếng Việt (Normalizer Form NFD), chuyển thường và thay khoảng trắng bằng dấu gạch ngang.
 *    - Nếu slug bị trùng, tự động gắn hậu tố `-2`, `-3`...
 * 4. Ràng buộc Kép khi Hiển thị Public (Double Active Constraint):
 *    - Bài tập public CHỈ hiển thị khi: `exercise.active == true` VÀ `category.active == true`.
 *    - Nếu danh mục bị ẩn, tất cả bài tập thuộc danh mục đó tự động biến mất khỏi public mà không cần update DB.
 * 5. Tối ưu N+1 Query & Câu lệnh COUNT Phân trang:
 *    - Trong `exerciseSpec`, chỉ kích hoạt `root.fetch("category")` khi query lấy Entity dữ liệu.
 *    - Khi Hibernate chạy query COUNT tính tổng số bản ghi phân trang, fetch join được BỎ QUA để
 *      tránh ngoại lệ SemanticException và tăng tốc câu lệnh COUNT.
 * 6. Ẩn (Soft Toggle) vs Xóa vật lý (Hard Delete):
 *    - `setPublished`: Thay đổi cờ `active` (Ẩn/Hiện bài viết, dữ liệu vẫn được bảo tồn).
 *    - `deleteExercise`: Gọi `repository.delete()` -> XÓA VẬT LÝ hoàn toàn khỏi DB.
 * ====================================================================================
 */
@Service
@RequiredArgsConstructor
public class ExerciseService {

    private static final Pattern TIKTOK_VIDEO_PATTERN = Pattern.compile("/video/(\\d+)");

    private final ExerciseRepository exerciseRepository;
    private final ExerciseCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<ExerciseCategoryResponse> listPublicCategories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
            .map(ExerciseCategoryResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ExerciseCategoryResponse> listOwnerCategories() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream()
            .map(ExerciseCategoryResponse::from)
            .toList();
    }

    @Transactional
    public ExerciseCategoryResponse createCategory(ExerciseCategoryRequest request) {
        ExerciseCategory category = new ExerciseCategory();
        applyCategory(category, request);
        return ExerciseCategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public ExerciseCategoryResponse updateCategory(Long id, ExerciseCategoryRequest request) {
        ExerciseCategory category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục bài tập."));
        applyCategory(category, request);
        return ExerciseCategoryResponse.from(category);
    }

    /**
     * Phân trang trực tiếp tại Database (Database Pagination via JPA & SQL LIMIT/OFFSET).
     * 
     * [LUỒNG XỬ LÝ]:
     * 1. Specification (exerciseSpec): Lắp ghép điều kiện WHERE động (keyword, difficulty, category...).
     * 2. Pageable (PageRequest.of): Chỉ định page, size và thứ tự sắp xếp -> Dịch thành LIMIT, OFFSET, ORDER BY.
     * 3. exerciseRepository.findAll(): Thực thi 2 câu lệnh SQL (SELECT LIMIT/OFFSET lấy dữ liệu trang + SELECT COUNT tính tổng).
     * 4. .map(ExerciseResponse::from): Chuyển Entity sang DTO ngay trong @Transactional (Session DB còn mở),
     *    đảm bảo nạp an toàn quan hệ LAZY (category.getName()) mà không bị LazyInitializationException.
     * 5. PageResponse.from(): Đóng gói Page<DTO> thành DTO chuẩn hoá gọn gàng gửi về cho Client.
     */
    @Transactional(readOnly = true)
    public PageResponse<ExerciseResponse> listPublicExercises(
        String categorySlug,
        ExerciseDifficulty level,
        String keyword,
        Boolean featured,
        int page,
        int size
    ) {
        return PageResponse.from(exerciseRepository.findAll(
            exerciseSpec(categorySlug, level, keyword, featured, true),
            PageRequest.of(normalizePage(page), normalizeSize(size), Sort.by(Sort.Direction.DESC, "featured").and(Sort.by(Sort.Direction.ASC, "name")))
        ).map(ExerciseResponse::from));
    }

    /**
     * Phân trang danh sách bài tập dành cho Owner (Quản trị viên):
     * - Khác với Public (chỉ xem bài đã published), Owner có thể lọc cả bài nháp (published = false).
     * - Sắp xếp theo updatedAt DESC để bài tập vừa chỉnh sửa/tạo mới luôn nổi lên đầu danh sách.
     */
    @Transactional(readOnly = true)
    public PageResponse<ExerciseResponse> listOwnerExercises(
        String categorySlug,
        ExerciseDifficulty level,
        String keyword,
        Boolean featured,
        Boolean published,
        int page,
        int size
    ) {
        return PageResponse.from(exerciseRepository.findAll(
            exerciseSpec(categorySlug, level, keyword, featured, published),
            PageRequest.of(normalizePage(page), normalizeSize(size), Sort.by(Sort.Direction.DESC, "updatedAt"))
        ).map(ExerciseResponse::from));
    }

    @Transactional(readOnly = true)
    public ExerciseResponse getPublicExercise(String slugOrId) {
        Exercise exercise = findPublicBySlugOrId(slugOrId);
        return ExerciseResponse.from(exercise);
    }

    @Transactional
    public ExerciseResponse createExercise(ExerciseRequest request) {
        Exercise exercise = new Exercise();
        applyExercise(exercise, request);
        return ExerciseResponse.from(exerciseRepository.save(exercise));
    }

    @Transactional
    public ExerciseResponse updateExercise(Long id, ExerciseRequest request) {
        Exercise exercise = exerciseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        applyExercise(exercise, request);
        return ExerciseResponse.from(exercise);
    }

    /**
     * Ẩn / Hiện bài tập (Soft Toggle):
     * Chỉ thay đổi cờ boolean active, bản ghi vẫn lưu trong DB.
     * Khi active = false, bài tập lập tức bị ẩn khỏi trang Public.
     */
    @Transactional
    public ExerciseResponse setPublished(Long id, PublishExerciseRequest request) {
        Exercise exercise = exerciseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        exercise.setActive(Boolean.TRUE.equals(request.published()));
        return ExerciseResponse.from(exercise);
    }

    /**
     * Xóa bài tập khỏi hệ thống:
     * LƯU Ý: Đây là XÓA VẬT LÝ (Hard Physical Delete) bằng repository.delete(),
     * KHÔNG PHẢI xóa mềm (Soft Delete). Bản ghi và metadata sẽ bị xóa hẳn khỏi database.
     */
    @Transactional
    public void deleteExercise(Long id) {
        Exercise exercise = exerciseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        exerciseRepository.delete(exercise);
    }

    private void applyCategory(ExerciseCategory category, ExerciseCategoryRequest request) {
        String name = request.name().trim();
        String slug = uniqueSlug(request.slug(), name, category.getId(), true);

        category.setName(name);
        category.setSlug(slug);
        category.setDescription(trimToNull(request.description()));
        category.setIconName(trimToNull(request.iconName()));
        category.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        category.setActive(request.active() == null || request.active());
    }

    /**
     * Đồng bộ thông tin từ ExerciseRequest vào Entity:
     * - Xác thực danh mục tồn tại.
     * - Kiểm tra và trích xuất TikTok video ID.
     * - Sinh slug duy nhất nếu chưa có hoặc có yêu cầu slug tùy chỉnh.
     */
    private void applyExercise(Exercise exercise, ExerciseRequest request) {
        ExerciseCategory category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục bài tập."));

        String tiktokUrl = trimToNull(request.tiktokUrl());
        validateTiktokUrl(tiktokUrl);

        String name = request.title().trim();
        exercise.setCategory(category);
        exercise.setName(name);
        exercise.setSlug(uniqueSlug(request.slug(), name, exercise.getId(), false));
        exercise.setDescription(trimToNull(request.description()));
        exercise.setInstruction(trimToNull(request.instruction()));
        exercise.setCommonMistakes(trimToNull(request.commonMistakes()));
        exercise.setDifficulty(request.level() == null ? ExerciseDifficulty.BEGINNER : request.level());
        exercise.setPrimaryMuscle(trimToNull(request.muscleGroup()));
        exercise.setEquipment(trimToNull(request.equipment()));
        exercise.setTiktokUrl(tiktokUrl);
        exercise.setTiktokVideoId(extractTiktokVideoId(tiktokUrl));
        exercise.setThumbnailUrl(trimToNull(request.thumbnailUrl()));
        exercise.setFeatured(Boolean.TRUE.equals(request.featured()));
        exercise.setActive(request.published() == null || request.published());
    }

    /**
     * Xây dựng câu lệnh WHERE động (Dynamic Query) bằng JPA Specification:
     * - Tránh việc phải viết hàng chục method tìm kiếm trong Repository.
     * - Khi câu query lấy dữ liệu (getResultType != Long.class): Dùng root.fetch("category") để giải quyết triệt để lỗi N+1 Query.
     * - Khi câu query đếm số lượng (getResultType == Long.class - tức COUNT query): Bỏ qua fetch join để câu lệnh COUNT chạy tối ưu nhất.
     */
    private Specification<Exercise> exerciseSpec(
        String categorySlug,
        ExerciseDifficulty level,
        String keyword,
        Boolean featured,
        Boolean published
    ) {
        return (root, query, criteriaBuilder) -> {
            // Fetch join bảng Category để tránh N+1 khi query dữ liệu; bỏ qua khi query COUNT
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("category", JoinType.LEFT);
            }
            var predicates = criteriaBuilder.conjunction();

            // RÀNG BUỘC KÉP: Nếu bài tập published = true, thì category của bài tập cũng BẮT BUỘC active = true
            if (published != null) {
                predicates = criteriaBuilder.and(predicates, criteriaBuilder.equal(root.get("active"), published));
                if (Boolean.TRUE.equals(published)) {
                    predicates = criteriaBuilder.and(predicates, criteriaBuilder.isTrue(root.get("category").get("active")));
                }
            }
            if (featured != null) {
                predicates = criteriaBuilder.and(predicates, criteriaBuilder.equal(root.get("featured"), featured));
            }
            if (level != null) {
                predicates = criteriaBuilder.and(predicates, criteriaBuilder.equal(root.get("difficulty"), level));
            }
            if (categorySlug != null && !categorySlug.isBlank()) {
                predicates = criteriaBuilder.and(predicates, criteriaBuilder.equal(root.get("category").get("slug"), categorySlug.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
                predicates = criteriaBuilder.and(predicates, criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("primaryMuscle")), pattern)
                ));
            }

            return predicates;
        };
    }

    /**
     * Tìm bài tập chi tiết cho trang Public theo ID số hoặc SEO slug:
     * - Tự động nhận diện chuỗi số để tìm theo ID, ngược lại tìm theo slug.
     * - Yêu cầu BẮT BUỘC cả bài tập và danh mục đều đang ACTIVE (active = true).
     */
    private Exercise findPublicBySlugOrId(String slugOrId) {
        if (slugOrId.chars().allMatch(Character::isDigit)) {
            return exerciseRepository.findByIdAndActiveTrue(Long.valueOf(slugOrId))
                .filter(exercise -> exercise.getCategory() != null && exercise.getCategory().isActive())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        }

        return exerciseRepository.findBySlugAndActiveTrue(slugOrId)
            .filter(exercise -> exercise.getCategory() != null && exercise.getCategory().isActive())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
    }

    /**
     * Sinh Slug duy nhất cho Bài tập hoặc Danh mục:
     * - Nếu slug đã tồn tại (khác ID hiện tại đang update), tự động tăng hậu tố -2, -3, ...
     */
    private String uniqueSlug(String requestedSlug, String fallbackText, Long currentId, boolean categorySlug) {
        String base = slugify(Optional.ofNullable(trimToNull(requestedSlug)).orElse(fallbackText));
        String candidate = base;
        int suffix = 2;

        while (slugExists(candidate, currentId, categorySlug)) {
            candidate = base + "-" + suffix;
            suffix++;
        }

        return candidate;
    }

    private boolean slugExists(String slug, Long currentId, boolean categorySlug) {
        if (categorySlug) {
            return categoryRepository.findBySlug(slug)
                .map(category -> !category.getId().equals(currentId))
                .orElse(false);
        }

        return exerciseRepository.findBySlug(slug)
            .map(exercise -> !exercise.getId().equals(currentId))
            .orElse(false);
    }

    /**
     * Chuẩn hóa chuỗi tiếng Việt thành SEO Slug (VD: "Bài Tập Ngực Dưới" -> "bai-tap-nguc-duoi"):
     * - Dùng Normalizer Form NFD tách dấu thanh, thay đ/Đ thành d/D, xóa dấu tổ hợp Unicode \p{M}.
     * - Đổi sang chữ thường và thay mọi ký tự không phải chữ/số thành dấu gạch ngang (-).
     */
    private String slugify(String raw) {
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFD)
            .replace("đ", "d")
            .replace("Đ", "D")
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");

        if (normalized.isBlank()) {
            throw new BadRequestException("Không thể tạo slug từ tên đã nhập.");
        }

        return normalized;
    }

    /**
     * Trích xuất mã số Video ID của TikTok từ URL bằng biểu thức chính quy /video/(\\d+).
     */
    private String extractTiktokVideoId(String url) {
        Matcher matcher = TIKTOK_VIDEO_PATTERN.matcher(url);
        return matcher.find() ? matcher.group(1) : null;
    }

    /**
     * Kiểm tra tính hợp lệ của liên kết TikTok:
     * - Bắt buộc chứa domain tiktok.com hoặc vt.tiktok.com.
     * - BẮT BUỘC trích xuất được Video ID. Link rút gọn (vt.tiktok.com/ZS...) không chứa video ID
     *   sẽ bị từ chối ngay để tránh rủi ro không nhúng được player ở Frontend.
     */
    private void validateTiktokUrl(String url) {
        if (url == null || !(url.contains("tiktok.com") || url.contains("vt.tiktok.com"))) {
            throw new BadRequestException("Vui lòng nhập đúng link TikTok.");
        }
        if (extractTiktokVideoId(url) == null) {
            throw new BadRequestException("Vui lòng dùng link TikTok đầy đủ có dạng /video/{id}; link rút gọn không thể nhúng ổn định.");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    /**
     * Giới hạn kích thước trang (Page Size Guard):
     * Nếu client truyền size <= 0 thì lấy mặc định 12 (lưới 3x4).
     * Giới hạn tối đa 50 bản ghi/trang để chống tấn công DoS làm tràn RAM server (Heap OutOfMemory).
     */
    private int normalizeSize(int size) {
        if (size <= 0) {
            return 12;
        }
        return Math.min(size, 50);
    }

    /**
     * Ngăn chặn số trang âm (Zero-based Page Index Guard).
     */
    private int normalizePage(int page) {
        return Math.max(page, 0);
    }
}
