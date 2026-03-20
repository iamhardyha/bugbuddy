package me.iamhardyha.bugbuddy.feed.dto;

import me.iamhardyha.bugbuddy.model.entity.TechFeed;
import me.iamhardyha.bugbuddy.model.enums.FeedCategory;
import java.time.Instant;

public record FeedResponse(
        Long id,
        Long authorUserId,
        String authorNickname,
        String url,
        String title,
        String description,
        String ogImageUrl,
        String domain,
        FeedCategory category,
        String comment,
        int likeCount,
        int commentCount,
        int bookmarkCount,
        boolean myLiked,
        boolean myBookmarked,
        Instant createdAt
) {
    public static FeedResponse of(TechFeed feed, String authorNickname,
                                   boolean myLiked, boolean myBookmarked) {
        return new FeedResponse(
                feed.getId(), feed.getAuthorUserId(), authorNickname,
                feed.getUrl(), feed.getTitle(), feed.getDescription(),
                feed.getOgImageUrl(), feed.getDomain(), feed.getCategory(),
                feed.getComment(), feed.getLikeCount(), feed.getCommentCount(),
                feed.getBookmarkCount(), myLiked, myBookmarked,
                feed.getCreatedAt()
        );
    }
}
