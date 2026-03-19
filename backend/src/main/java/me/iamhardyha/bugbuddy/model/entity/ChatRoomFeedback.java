package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ChatRoleType;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(
        name = "chat_room_feedback",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_chat_feedback_unique", columnNames = {"room_id", "rater_user_id"})
        },
        indexes = {
                @Index(name = "idx_chat_feedback_room", columnList = "room_id, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ChatRoomFeedback extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "rater_user_id", nullable = false)
    private Long raterUserId;

    /** 평점을 준 사람의 채팅방 내 역할 (MENTOR / MENTEE). */
    @Enumerated(EnumType.STRING)
    @Column(name = "rater_role", nullable = false, length = 10)
    private ChatRoleType raterRole;

    /** Rating: 1~5점 별점. */
    @Column(name = "rating", nullable = false, columnDefinition = "TINYINT")
    private int rating;

    @Column(name = "comment", length = 500)
    private String comment;
}
