package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.TimestampedEntity;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;

@Entity
@Table(
        name = "xp_events",
        indexes = {
                @Index(name = "idx_xp_events_user_created", columnList = "user_id, created_at"),
                @Index(name = "idx_xp_events_ref", columnList = "ref_type, ref_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class XpEvent extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private XpEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", length = 30)
    private ReferenceType refType;

    @Column(name = "ref_id")
    private Long refId;

    @Column(name = "delta_xp", nullable = false)
    private int deltaXp;
}
