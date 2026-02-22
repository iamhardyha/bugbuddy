package me.iamhardyha.bugbuddy.model.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.springframework.data.annotation.CreatedDate
import java.time.Instant

@Entity
@Table(
    name = "question_tags",
    indexes = [
        Index(name = "idx_question_tags_tag", columnList = "tag_id, question_id")
    ]
)
@IdClass(QuestionTagId::class)
class QuestionTag(
    @Id
    @Column(name = "question_id")
    var questionId: Long = 0,

    @Id
    @Column(name = "tag_id")
    var tagId: Long = 0,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant? = null
)