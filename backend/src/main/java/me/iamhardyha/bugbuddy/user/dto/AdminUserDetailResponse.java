package me.iamhardyha.bugbuddy.user.dto;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;

import java.time.Instant;
import java.util.List;

public record AdminUserDetailResponse(
        Long id,
        String nickname,
        String email,
        String bio,
        String oauthProvider,
        String mentorStatus,
        int xp,
        int level,
        int reportCount,
        Instant suspendedUntil,
        Instant deactivatedAt,
        Instant createdAt,
        List<ReportSummary> recentReports
) {
    public record ReportSummary(
            Long id,
            String targetType,
            String reasonCode,
            String status,
            Instant createdAt
    ) {}

    public static AdminUserDetailResponse from(UserEntity user, List<ReportSummary> reports) {
        return new AdminUserDetailResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getBio(),
                user.getOauthProvider(),
                user.getMentorStatus().name(),
                user.getXp(),
                user.getLevel(),
                user.getReportCount(),
                user.getSuspendedUntil(),
                user.getDeactivatedAt(),
                user.getCreatedAt(),
                reports
        );
    }
}
