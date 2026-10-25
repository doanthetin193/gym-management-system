package com.gymduongdouble.backend.exercise.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể Danh mục Bài tập (ExerciseCategory).
 * 
 * ====================================================================================
 * VAI TRÒ & QUY TẮC LIÊN KẾT (MENTOR NOTES):
 * 1. Master Data danh mục:
 *    - Tách riêng danh mục giúp chuẩn hóa dữ liệu, tránh lặp lại chuỗi thô ("Ngực", "Lưng xô")
 *      trong từng bài tập và cho phép Chủ phòng chủ động sắp xếp thứ tự hiển thị (sortOrder).
 * 2. Cơ chế Ràng buộc Kép khi hiển thị (Cascading Visibility):
 *    - Khi một danh mục bị ẩn (`active = false`), toàn bộ bài tập thuộc danh mục này
 *      sẽ TỰ ĐỘNG BỊ ẨN khỏi trang Public (do điều kiện Specification kiểm tra đồng thời
 *      cả `exercise.active == true` và `category.active == true`).
 * 3. SEO Slug:
 *    - `slug` duy nhất dùng để lọc theo URL (VD: `/exercises?category=nguc-vai-tay-sau`).
 * ====================================================================================
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "exercise_categories")
public class ExerciseCategory extends AuditableEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    /**
     * Tên icon đại diện ở giao diện Frontend (VD: "Dumbbell", "Flame", "Zap"...).
     */
    @Column(name = "icon_name", length = 80)
    private String iconName;

    /**
     * Thứ tự hiển thị ưu tiên trên thanh điều hướng/bộ lọc (số nhỏ đứng trước).
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /**
     * Trạng thái kích hoạt (active = false sẽ ẩn toàn bộ bài tập của danh mục này khỏi trang Public).
     */
    @Column(nullable = false)
    private boolean active = true;
}
