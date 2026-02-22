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
import me.iamhardyha.bugbuddy.model.enum.ChatRoomStatus
import java.time.Instant

@Entity
@Table(
    name = "chat_rooms",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_chat_rooms_pair_open", columnNames = ["mentor_user_id", "mentee_user_id", "question_id"])
    ],
    indexes = [
        Index(name = "idx_chat_rooms_mentor_status", columnList = "mentor_user_id, status, created_at"),
        Index(name = "idx_chat_rooms_mentee_status", columnList = "mentee_user_id, status, created_at"),
        Index(name = "idx_chat_rooms_question", columnList = "question_id"),
        Index(name = "idx_chat_rooms_deleted", columnList = "deleted_at"),
        Index(name = "idx_chat_rooms_active", columnList = "deleted_at, status, created_at")
    ]
)
class ChatRoom(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    /** Optional question from which the chat was created. */
    @Column(name = "question_id")
    var questionId: Long? = null,

    @Column(name = "mentor_user_id", nullable = false)
    var mentorUserId: Long,

    @Column(name = "mentee_user_id", nullable = false)
    var menteeUserId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ChatRoomStatus = ChatRoomStatus.OPEN,

    @Column(name = "closed_at")
    var closedAt: Instant? = null
) : BaseSoftDeleteEntity()