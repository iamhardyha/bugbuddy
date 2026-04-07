package me.iamhardyha.bugbuddy.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminXpAdjustRequest(
        @Min(-10000) @Max(10000) int deltaXp,
        @NotBlank @Size(max = 255) String reason
) {}
