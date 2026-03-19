package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(
        name = "chat_rooms",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_chat_rooms_pair_open", columnNames = {"mentor_user_id", "mentee_user_id", "question_id"})
        },
        indexes = {
                @Index(name = "idx_chat_rooms_mentor_status", columnList = "mentor_user_id, status, created_at"),
                @Index(name = "idx_chat_rooms_mentee_status", columnList = "mentee_user_id, status, created_at"),
                @Index(name = "idx_chat_rooms_question", columnList = "question_id"),
                @Index(name = "idx_chat_rooms_deleted", columnList = "deleted_at"),
                @Index(name = "idx_chat_rooms_active", columnList = "deleted_at, status, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ChatRoom extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Optional question from which the chat was created. */
    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "mentor_user_id", nullable = false)
    private Long mentorUserId;

    @Column(name = "mentee_user_id", nullable = false)
    private Long menteeUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatRoomStatus status = ChatRoomStatus.OPEN;

    @Column(name = "closed_at")
    private Instant closedAt;

    /** 멘토가 마지막으로 읽은 메시지 ID. null = 한 번도 읽지 않음. */
    @Column(name = "mentor_last_read_message_id")
    private Long mentorLastReadMessageId;

    /** 멘티가 마지막으로 읽은 메시지 ID. null = 한 번도 읽지 않음. */
    @Column(name = "mentee_last_read_message_id")
    private Long menteeLastReadMessageId;
}
