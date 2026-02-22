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
import me.iamhardyha.bugbuddy.model.enum.QuestionCategory
import me.iamhardyha.bugbuddy.model.enum.QuestionStatus
import me.iamhardyha.bugbuddy.model.enum.QuestionType

@Entity
@Table(
    name = "questions",
    indexes = [
        Index(name = "idx_questions_author_created", columnList = "author_user_id, created_at"),
        Index(name = "idx_questions_category_created", columnList = "category, created_at"),
        Index(name = "idx_questions_status_created", columnList = "status, created_at"),
        Index(name = "idx_questions_type_created", columnList = "question_type, created_at"),
        Index(name = "idx_questions_active_list", columnList = "deleted_at, status, created_at"),
        Index(name = "idx_questions_deleted", columnList = "deleted_at")
    ]
)
class Question(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "author_user_id", nullable = false)
    var authorUserId: Long,

    @Column(nullable = false, length = 120)
    var title: String,

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    var body: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var category: QuestionCategory,

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    var questionType: QuestionType,

    @Column(name = "allow_1to1", nullable = false)
    var allowOneToOne: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: QuestionStatus = QuestionStatus.OPEN,

    @Column(name = "view_count", nullable = false)
    var viewCount: Int = 0
) : BaseSoftDeleteEntity()