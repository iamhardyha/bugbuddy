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
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity
import me.iamhardyha.bugbuddy.model.enum.SnapshotRole

@Entity
@Table(
    name = "answers",
    indexes = [
        Index(name = "idx_answers_question_created", columnList = "question_id, created_at"),
        Index(name = "idx_answers_author_created", columnList = "author_user_id, created_at"),
        Index(name = "idx_answers_accepted", columnList = "question_id, is_accepted, created_at"),
        Index(name = "idx_answers_deleted", columnList = "deleted_at"),
        Index(name = "idx_answers_active_question", columnList = "question_id, deleted_at, created_at")
    ]
)
class Answer(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "question_id", nullable = false)
    var questionId: Long,

    @Column(name = "author_user_id", nullable = false)
    var authorUserId: Long,

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    var body: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "author_snapshot_role", nullable = false, length = 20)
    var authorSnapshotRole: SnapshotRole = SnapshotRole.USER,

    @Column(name = "is_accepted", nullable = false)
    var isAccepted: Boolean = false
) : BaseSoftDeleteEntity()