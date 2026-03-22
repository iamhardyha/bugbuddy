package me.iamhardyha.bugbuddy.admin.dto;

public record ReportSummaryResponse(
        long openCount,
        long reviewingCount,
        long resolvedCount,
        long rejectedCount,
        long pendingMentorApps
) {}
