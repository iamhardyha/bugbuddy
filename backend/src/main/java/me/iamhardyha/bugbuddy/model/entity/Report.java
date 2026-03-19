package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ReasonCode;
import me.iamhardyha.bugbuddy.model.enums.ReportStatus;
import me.iamhardyha.bugbuddy.model.enums.ReportTargetType;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(
        name = "reports",
        indexes = {
                @Index(name = "idx_reports_status_created", columnList = "status, created_at"),
                @Index(name = "idx_reports_target", columnList = "target_type, target_id"),
                @Index(name = "idx_reports_reporter", columnList = "reporter_user_id, created_at"),
                @Index(name = "idx_reports_deleted", columnList = "deleted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Report extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_user_id", nullable = false)
    private Long reporterUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", nullable = false, length = 30)
    private ReasonCode reasonCode;

    @Column(name = "reason_detail", length = 500)
    private String reasonDetail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status = ReportStatus.OPEN;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolver_user_id")
    private Long resolverUserId;
}
