package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;

import java.time.Instant;

@Entity
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
}
