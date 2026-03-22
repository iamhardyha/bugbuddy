package me.iamhardyha.bugbuddy.feed.dto;

import java.time.Instant;

public record AdminFeedResponse(
        Long id, String url, String title, String description,
        String category, String comment,
        int likeCount, int commentCount,
        boolean hidden, Instant deletedAt, Instant createdAt,
        Long authorId, String authorNickname
) {}
