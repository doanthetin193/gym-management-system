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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "exercises")
public class Exercise extends AuditableEntity {

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

    @Column(name = "tiktok_url", columnDefinition = "text")
    private String tiktokUrl;

    @Column(name = "tiktok_video_id", length = 120)
    private String tiktokVideoId;

    @Column(name = "thumbnail_url", columnDefinition = "text")
    private String thumbnailUrl;

    @Column(nullable = false)
    private boolean featured = false;

    @Column(nullable = false)
    private boolean active = true;
}
