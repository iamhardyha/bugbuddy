package me.iamhardyha.bugbuddy.user.dto;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;

import java.math.BigDecimal;

public record PublicProfileResponse(
        Long id,
        String nickname,
        String bio,
        int level,
        int xp,
        long questionCount,
        long answerCount,
        boolean isMentor,
        BigDecimal mentorAvgRating,
        int mentorRatingCount
) {
    public static PublicProfileResponse of(UserEntity user, long questionCount, long answerCount) {
        boolean isMentor = user.getMentorStatus() == MentorStatus.APPROVED;
        return new PublicProfileResponse(
                user.getId(),
                user.getNickname(),
                user.getBio(),
                user.getLevel(),
                user.getXp(),
                questionCount,
                answerCount,
                isMentor,
                isMentor ? user.getMentorAvgRating() : null,
                isMentor ? user.getMentorRatingCount() : 0
        );
    }
}
