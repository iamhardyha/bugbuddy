package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ChatMessageType;

@Entity
@Table(
        name = "chat_messages",
        indexes = {
                @Index(name = "idx_chat_messages_room_created", columnList = "room_id, created_at"),
                @Index(name = "idx_chat_messages_sender_created", columnList = "sender_user_id, created_at"),
                @Index(name = "idx_chat_messages_deleted", columnList = "deleted_at"),
                @Index(name = "idx_chat_messages_room_active", columnList = "room_id, deleted_at, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "sender_user_id", nullable = false)
    private Long senderUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    private ChatMessageType messageType = ChatMessageType.TEXT;

    /** Content of text or system messages. Nullable when messageType = FILE. */
    @Column(columnDefinition = "MEDIUMTEXT")
    private String content;

    /** URL of uploaded file (if messageType = FILE). */
    @Column(name = "file_url", length = 500)
    private String fileUrl;
}
