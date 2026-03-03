package me.iamhardyha.bugbuddy.report.dto;

import me.iamhardyha.bugbuddy.model.entity.Report;
import me.iamhardyha.bugbuddy.model.enums.ReasonCode;
import me.iamhardyha.bugbuddy.model.enums.ReportStatus;
import me.iamhardyha.bugbuddy.model.enums.ReportTargetType;

import java.time.Instant;

public record ReportResponse(
        Long id,
        Long reporterUserId,
        ReportTargetType targetType,
        Long targetId,
        ReasonCode reasonCode,
        String reasonDetail,
        ReportStatus status,
        Instant resolvedAt,
        Long resolverUserId,
        Instant createdAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporterUserId(),
                report.getTargetType(),
                report.getTargetId(),
                report.getReasonCode(),
                report.getReasonDetail(),
                report.getStatus(),
                report.getResolvedAt(),
                report.getResolverUserId(),
                report.getCreatedAt()
        );
    }
}
