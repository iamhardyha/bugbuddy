package me.iamhardyha.bugbuddy.admin.dto;

public record AdminLoginResponse(
        String accessToken,
        String refreshToken
) {}
