package me.iamhardyha.bugbuddy.question.dto;

import java.time.Instant;

public record AdminQuestionResponse(
        Long id, String title, String body,
        String category, String status, String questionType,
        int viewCount, boolean hidden,
        Instant deletedAt, Instant createdAt,
        Long authorId, String authorNickname
) {}
