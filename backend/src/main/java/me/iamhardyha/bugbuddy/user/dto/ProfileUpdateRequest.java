package me.iamhardyha.bugbuddy.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 40, message = "닉네임은 2~40자 이내여야 합니다.")
        String nickname,

        @Size(max = 280, message = "자기소개는 280자 이내여야 합니다.")
        String bio
) {}
