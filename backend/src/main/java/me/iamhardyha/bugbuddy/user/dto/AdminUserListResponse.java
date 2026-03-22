package me.iamhardyha.bugbuddy.user.dto;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;

import java.time.Instant;

public record AdminUserListResponse(
        Long id,
        String nickname,
        String email,
        String mentorStatus,
        int xp,
        int level,
        int reportCount,
        Instant suspendedUntil,
        Instant createdAt
) {
    public static AdminUserListResponse from(UserEntity user) {
        return new AdminUserListResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getMentorStatus().name(),
                user.getXp(),
                user.getLevel(),
                user.getReportCount(),
                user.getSuspendedUntil(),
                user.getCreatedAt()
        );
    }
}
