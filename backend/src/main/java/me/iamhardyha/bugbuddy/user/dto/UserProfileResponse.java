package me.iamhardyha.bugbuddy.user.dto;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;

public record UserProfileResponse(
        Long id,
        String nickname,
        String email,
        String bio,
        String mentorStatus,
        int xp,
        int level
) {
    public static UserProfileResponse of(UserEntity user) {
        return new UserProfileResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getBio(),
                user.getMentorStatus().name(),
                user.getXp(),
                user.getLevel()
        );
    }
}
