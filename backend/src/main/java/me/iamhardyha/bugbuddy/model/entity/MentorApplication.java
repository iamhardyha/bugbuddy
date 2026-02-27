package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationStatus;

import java.time.Instant;

@Entity
@Table(
        name = "mentor_applications",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_mentor_applications_user", columnNames = {"user_id"})
        },
        indexes = {
                @Index(name = "idx_mentor_applications_status_created", columnList = "status, created_at"),
                @Index(name = "idx_mentor_applications_deleted", columnList = "deleted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class MentorApplication extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MentorApplicationStatus status = MentorApplicationStatus.PENDING;

    @Column(name = "q1_answer", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String q1Answer;

    @Column(name = "q2_answer", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String q2Answer;

    @Column(name = "reviewer_user_id")
    private Long reviewerUserId;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
