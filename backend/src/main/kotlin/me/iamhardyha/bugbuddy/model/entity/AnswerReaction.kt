package me.iamhardyha.bugbuddy.model.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity
import me.iamhardyha.bugbuddy.model.enum.ReactionType

@Entity
@Table(
    name = "answer_reactions",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_answer_reactions_unique", columnNames = ["answer_id", "voter_user_id", "reaction_type"])
    ],
    indexes = [
        Index(name = "idx_answer_reactions_answer", columnList = "answer_id, created_at"),
        Index(name = "idx_answer_reactions_voter", columnList = "voter_user_id, created_at"),
        Index(name = "idx_answer_reactions_deleted", columnList = "deleted_at")
    ]
)
class AnswerReaction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "answer_id", nullable = false)
    var answerId: Long,

    @Column(name = "voter_user_id", nullable = false)
    var voterUserId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction_type", nullable = false, length = 20)
    var reactionType: ReactionType = ReactionType.HELPFUL
) : BaseSoftDeleteEntity()