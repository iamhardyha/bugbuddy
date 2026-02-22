package me.iamhardyha.bugbuddy.model.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity

@Entity
@Table(
    name = "chat_room_feedback",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_chat_feedback_unique", columnNames = ["room_id", "rater_user_id"])
    ],
    indexes = [
        Index(name = "idx_chat_feedback_room", columnList = "room_id, created_at")
    ]
)
class ChatRoomFeedback(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "room_id", nullable = false)
    var roomId: Long,

    @Column(name = "rater_user_id", nullable = false)
    var raterUserId: Long,

    /** Rating: true=positive (1), false=negative (0). */
    @Column(name = "rating", nullable = false)
    var rating: Boolean,

    @Column(name = "comment", length = 500)
    var comment: String? = null
) : BaseSoftDeleteEntity()