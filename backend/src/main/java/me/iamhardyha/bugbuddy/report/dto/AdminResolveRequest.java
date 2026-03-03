package me.iamhardyha.bugbuddy.report.dto;

public record AdminResolveRequest(
        boolean suspend,
        int suspendDays
) {}
