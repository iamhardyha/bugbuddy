package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.TimestampedEntity;
import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(name = "idx_notifications_user_read", columnList = "user_id, is_read, created_at"),
                @Index(name = "idx_notifications_user_created", columnList = "user_id, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Notification extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 수신자 */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false, length = 30)
    private ReferenceType refType;

    @Column(name = "ref_id", nullable = false)
    private Long refId;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;
}
