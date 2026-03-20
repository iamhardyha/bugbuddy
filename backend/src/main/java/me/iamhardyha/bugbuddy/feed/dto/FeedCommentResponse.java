package me.iamhardyha.bugbuddy.feed.dto;

import me.iamhardyha.bugbuddy.model.entity.FeedComment;
import java.time.Instant;

public record FeedCommentResponse(
        Long id,
        Long authorUserId,
        String authorNickname,
        String body,
        Instant createdAt
) {
    public static FeedCommentResponse of(FeedComment comment, String authorNickname) {
        return new FeedCommentResponse(
                comment.getId(), comment.getAuthorUserId(),
                authorNickname, comment.getBody(), comment.getCreatedAt()
        );
    }
}
