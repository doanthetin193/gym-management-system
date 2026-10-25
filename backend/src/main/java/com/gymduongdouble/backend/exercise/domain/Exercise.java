package com.gymduongdouble.backend.exercise.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể Bài tập / Video hướng dẫn (Exercise).
 * 
 * ====================================================================================
 * THIẾT KẾ MÔ HÌNH & BẢN CHẤT LƯU TRỮ (MENTOR NOTES):
 * 1. Cơ chế Nhúng Video Bên Thứ Ba (Third-Party Embed vs Local Storage):
 *    - Hệ thống KHÔNG tải hay lưu trữ file video (MP4) trên máy chủ Backend (tiết kiệm băng thông,
 *      tránh tốn chi phí lưu trữ S3/CDN và tránh các vấn đề bản quyền).
 *    - Thay vào đó, hệ thống chỉ lưu TRÍCH YẾU DỮ LIỆU (Metadata): `tiktokUrl`, `tiktokVideoId`,
 *      `thumbnailUrl`. Việc phát video do trình phát nhúng chính thống của TikTok đảm nhiệm ở Frontend.
 *    - KHÔNG có trường `viewCount` hay cơ chế đếm lượt xem trong database (việc phát phụ thuộc hoàn toàn TikTok).
 * 2. Đường dẫn thân thiện SEO (SEO-Friendly Slug):
 *    - Cột `slug` là UNIQUE trong database để phục vụ routing URL đẹp mắt (`/exercises/{slug}`).
 * 3. Ẩn/Hiện vs Xóa vật lý:
 *    - Cờ `active`: Dùng cho thao tác Ẩn/Hiện bài tập (`setPublished`).
 *    - Khi gọi hàm `deleteExercise`, đây là XÓA VẬT LÝ (Hard Delete) khỏi database, không phải Soft Delete.
 * ====================================================================================
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "exercises")
public class Exercise extends AuditableEntity {

    /**
     * Danh mục bài tập (VD: Lưng xô, Ngực, Chân mông...).
     * Quan hệ ManyToOne LAZY để tránh nạp thừa dữ liệu khi không cần thiết.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ExerciseCategory category;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "text")
    private String instruction;

    @Column(name = "common_mistakes", columnDefinition = "text")
    private String commonMistakes;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ExerciseDifficulty difficulty;

    @Column(name = "primary_muscle", length = 120)
    private String primaryMuscle;

    @Column(length = 120)
    private String equipment;

    /**
     * Đường link đầy đủ tới video TikTok trên trình duyệt (dạng https://www.tiktok.com/@user/video/{id}).
     */
    @Column(name = "tiktok_url", columnDefinition = "text")
    private String tiktokUrl;

    /**
     * Mã định danh số của video TikTok (Video ID trích xuất bằng Regex /video/(\\d+)).
     * Dùng để dựng iFrame nhúng trình phát TikTok ở Frontend.
     */
    @Column(name = "tiktok_video_id", length = 120)
    private String tiktokVideoId;

    @Column(name = "thumbnail_url", columnDefinition = "text")
    private String thumbnailUrl;

    /**
     * Đánh dấu bài tập tiêu biểu/nổi bật để ưu tiên đưa lên đầu danh sách Public.
     */
    @Column(nullable = false)
    private boolean featured = false;

    /**
     * Trạng thái xuất bản (active = true: Cho phép hiển thị Public; active = false: Bản nháp/Ẩn).
     */
    @Column(nullable = false)
    private boolean active = true;
}
