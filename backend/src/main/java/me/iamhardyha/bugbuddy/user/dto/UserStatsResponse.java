package me.iamhardyha.bugbuddy.user.dto;

public record UserStatsResponse(
        long questionCount,
        long answerCount,
        long helpfulReceivedCount,
        long acceptedAnswerCount
) {}
