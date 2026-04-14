package me.iamhardyha.bugbuddy.ranking.dto;

public record RankingRowResponse(
        int rank,
        Long userId,
        String nickname,
        int level,
        int xp,
        Integer periodXp,
        String bio,
        String mentorStatus,
        long acceptedAnswerCount,
        long answerCount,
        long questionCount,
        boolean isCurrentUser
) {}
