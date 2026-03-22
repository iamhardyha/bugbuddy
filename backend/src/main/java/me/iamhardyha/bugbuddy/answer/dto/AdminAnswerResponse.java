package me.iamhardyha.bugbuddy.answer.dto;

import java.time.Instant;

public record AdminAnswerResponse(
        Long id, Long questionId, String questionTitle,
        String body, boolean accepted,
        boolean hidden, Instant deletedAt, Instant createdAt,
        Long authorId, String authorNickname
) {}
