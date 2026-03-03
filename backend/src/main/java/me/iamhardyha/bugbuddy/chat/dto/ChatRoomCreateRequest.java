package me.iamhardyha.bugbuddy.chat.dto;

import jakarta.validation.constraints.NotNull;

public record ChatRoomCreateRequest(
        @NotNull(message = "questionId는 필수입니다.") Long questionId
) {}
