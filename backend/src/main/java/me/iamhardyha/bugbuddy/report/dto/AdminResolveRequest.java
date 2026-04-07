package me.iamhardyha.bugbuddy.report.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AdminResolveRequest(
        boolean suspend,
        @Min(0) @Max(365) int suspendDays
) {}
