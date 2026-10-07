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

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private static final Pattern TIKTOK_VIDEO_PATTERN = Pattern.compile("/video/(\\d+)");
    private static final String DEFAULT_AUTHOR = "DUONG DOUBLE";
    private static final String DEFAULT_AUTHOR_TIKTOK = "https://www.tiktok.com/@duong.double";

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
            PageRequest.of(page, normalizeSize(size), Sort.by(Sort.Direction.DESC, "featured").and(Sort.by(Sort.Direction.ASC, "name")))
        ).map(ExerciseResponse::from));
    }

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
            PageRequest.of(page, normalizeSize(size), Sort.by(Sort.Direction.DESC, "updatedAt"))
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

    @Transactional
    public ExerciseResponse setPublished(Long id, PublishExerciseRequest request) {
        Exercise exercise = exerciseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        exercise.setActive(Boolean.TRUE.equals(request.published()));
        return ExerciseResponse.from(exercise);
    }

    @Transactional
    public ExerciseResponse incrementView(Long id) {
        Exercise exercise = exerciseRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        exercise.setViewCount((exercise.getViewCount() == null ? 0L : exercise.getViewCount()) + 1);
        return ExerciseResponse.from(exercise);
    }

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
        exercise.setAuthorName(Optional.ofNullable(trimToNull(request.authorName())).orElse(DEFAULT_AUTHOR));
        exercise.setAuthorTiktokUrl(Optional.ofNullable(trimToNull(request.authorTiktokUrl())).orElse(DEFAULT_AUTHOR_TIKTOK));
        exercise.setFeatured(Boolean.TRUE.equals(request.featured()));
        exercise.setActive(request.published() == null || request.published());
        if (exercise.getViewCount() == null) {
            exercise.setViewCount(0L);
        }
    }

    private Specification<Exercise> exerciseSpec(
        String categorySlug,
        ExerciseDifficulty level,
        String keyword,
        Boolean featured,
        Boolean published
    ) {
        return (root, query, criteriaBuilder) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("category", JoinType.LEFT);
            }
            var predicates = criteriaBuilder.conjunction();

            if (published != null) {
                predicates = criteriaBuilder.and(predicates, criteriaBuilder.equal(root.get("active"), published));
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

    private Exercise findPublicBySlugOrId(String slugOrId) {
        if (slugOrId.chars().allMatch(Character::isDigit)) {
            return exerciseRepository.findByIdAndActiveTrue(Long.valueOf(slugOrId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
        }

        return exerciseRepository.findBySlugAndActiveTrue(slugOrId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập/video."));
    }

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

    private String extractTiktokVideoId(String url) {
        Matcher matcher = TIKTOK_VIDEO_PATTERN.matcher(url);
        return matcher.find() ? matcher.group(1) : null;
    }

    private void validateTiktokUrl(String url) {
        if (url == null || !(url.contains("tiktok.com") || url.contains("vt.tiktok.com"))) {
            throw new BadRequestException("Vui lòng nhập đúng link TikTok.");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return 12;
        }
        return Math.min(size, 50);
    }
}
