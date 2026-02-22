package me.iamhardyha.bugbuddy.model.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Lob
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity
import me.iamhardyha.bugbuddy.model.enum.MentorApplicationStatus
import java.time.Instant

@Entity
@Table(
    name = "mentor_applications",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_mentor_applications_user", columnNames = ["user_id"])
    ],
    indexes = [
        Index(name = "idx_mentor_applications_status_created", columnList = "status, created_at"),
        Index(name = "idx_mentor_applications_deleted", columnList = "deleted_at")
    ]
)
class MentorApplication(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: MentorApplicationStatus = MentorApplicationStatus.PENDING,

    @Column(name = "q1_answer", nullable = false, columnDefinition = "MEDIUMTEXT")
    var q1Answer: String,

    @Column(name = "q2_answer", nullable = false, columnDefinition = "MEDIUMTEXT")
    var q2Answer: String,

    @Column(name = "reviewer_user_id")
    var reviewerUserId: Long? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,

    @Column(name = "rejection_reason", length = 500)
    var rejectionReason: String? = null
) : BaseSoftDeleteEntity()