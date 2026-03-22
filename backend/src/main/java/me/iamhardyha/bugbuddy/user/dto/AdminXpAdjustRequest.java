package me.iamhardyha.bugbuddy.user.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminXpAdjustRequest(
        int deltaXp,
        @NotBlank String reason
) {}
