package me.iamhardyha.bugbuddy.ranking.dto;

public record MyRankResponse(
        int rank,
        int xp,
        Integer periodXp,
        int xpToTop100,
        boolean inTop100,
        long acceptedAnswerCount,
        long answerCount,
        long questionCount
) {}
