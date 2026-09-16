package com.gymduongdouble.backend.training.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "training_program_weeks")
public class TrainingProgramWeek extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id", nullable = false)
    private TrainingProgram program;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Column(name = "week_start_date")
    private LocalDate weekStartDate;

    @Column(name = "week_end_date")
    private LocalDate weekEndDate;

    @Column(name = "target_sessions")
    private Integer targetSessions;

    @Column(name = "target_description", columnDefinition = "text")
    private String targetDescription;

    @Column(name = "actual_sessions")
    private Integer actualSessions;

    @Column(name = "actual_result", columnDefinition = "text")
    private String actualResult;

    @Column(columnDefinition = "text")
    private String note;
}
