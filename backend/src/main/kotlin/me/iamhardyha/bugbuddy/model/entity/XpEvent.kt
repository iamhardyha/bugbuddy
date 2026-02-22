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
import me.iamhardyha.bugbuddy.model.common.TimestampedEntity
import me.iamhardyha.bugbuddy.model.enum.ReferenceType
import me.iamhardyha.bugbuddy.model.enum.XpEventType

@Entity
@Table(
    name = "xp_events",
    indexes = [
        Index(name = "idx_xp_events_user_created", columnList = "user_id, created_at"),
        Index(name = "idx_xp_events_ref", columnList = "ref_type, ref_id")
    ]
)
class XpEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    var eventType: XpEventType,

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", length = 30)
    var refType: ReferenceType? = null,

    @Column(name = "ref_id")
    var refId: Long? = null,

    @Column(name = "delta_xp", nullable = false)
    var deltaXp: Int
) : TimestampedEntity()