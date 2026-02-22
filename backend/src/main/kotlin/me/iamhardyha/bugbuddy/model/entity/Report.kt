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
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity
import me.iamhardyha.bugbuddy.model.enum.ReasonCode
import me.iamhardyha.bugbuddy.model.enum.ReportStatus
import me.iamhardyha.bugbuddy.model.enum.ReportTargetType
import java.time.Instant

@Entity
@Table(
    name = "reports",
    indexes = [
        Index(name = "idx_reports_status_created", columnList = "status, created_at"),
        Index(name = "idx_reports_target", columnList = "target_type, target_id"),
        Index(name = "idx_reports_reporter", columnList = "reporter_user_id, created_at"),
        Index(name = "idx_reports_deleted", columnList = "deleted_at")
    ]
)
class Report(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "reporter_user_id", nullable = false)
    var reporterUserId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    var targetType: ReportTargetType,

    @Column(name = "target_id", nullable = false)
    var targetId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", nullable = false, length = 30)
    var reasonCode: ReasonCode,

    @Column(name = "reason_detail", length = 500)
    var reasonDetail: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ReportStatus = ReportStatus.OPEN,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @Column(name = "resolver_user_id")
    var resolverUserId: Long? = null
) : BaseSoftDeleteEntity()