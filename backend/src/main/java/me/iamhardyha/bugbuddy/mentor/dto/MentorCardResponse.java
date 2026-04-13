package me.iamhardyha.bugbuddy.mentor.dto;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;

import java.math.BigDecimal;

public record MentorCardResponse(
        Long id,
        String nickname,
        String bio,
        int level,
        int xp,
        BigDecimal mentorAvgRating,
        int mentorRatingCount
) {
    public static MentorCardResponse of(UserEntity u) {
        return new MentorCardResponse(
                u.getId(),
                u.getNickname(),
                u.getBio(),
                u.getLevel(),
                u.getXp(),
                u.getMentorAvgRating(),
                u.getMentorRatingCount()
        );
    }
}
