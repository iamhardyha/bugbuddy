package me.iamhardyha.bugbuddy.admin.dto;

public record DashboardSummaryResponse(
        long totalUsers,
        long totalQuestions,
        long totalAnswers,
        long totalFeeds,
        long todaySignups
) {}
