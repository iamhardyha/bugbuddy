package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ChatMessageType;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("deleted_at IS NULL")
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

    /** 텍스트/시스템 메시지 내용. 마크다운 지원 (이미지는 uploads 테이블로 관리). */
    @Column(columnDefinition = "MEDIUMTEXT")
    private String content;
}
