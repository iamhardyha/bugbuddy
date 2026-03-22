package me.iamhardyha.bugbuddy.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AdminSuspendRequest(
        @Min(1) @Max(365) int suspendDays
) {}
