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
import me.iamhardyha.bugbuddy.model.enum.ChatMessageType

@Entity
@Table(
    name = "chat_messages",
    indexes = [
        Index(name = "idx_chat_messages_room_created", columnList = "room_id, created_at"),
        Index(name = "idx_chat_messages_sender_created", columnList = "sender_user_id, created_at"),
        Index(name = "idx_chat_messages_deleted", columnList = "deleted_at"),
        Index(name = "idx_chat_messages_room_active", columnList = "room_id, deleted_at, created_at")
    ]
)
class ChatMessage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "room_id", nullable = false)
    var roomId: Long,

    @Column(name = "sender_user_id", nullable = false)
    var senderUserId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    var messageType: ChatMessageType = ChatMessageType.TEXT,

    /** Content of text or system messages. Nullable when messageType = FILE. */
    @Column(columnDefinition = "MEDIUMTEXT")
    var content: String? = null,

    /** URL of uploaded file (if messageType = FILE). */
    @Column(name = "file_url", length = 500)
    var fileUrl: String? = nullsou
) : BaseSoftDeleteEntity()