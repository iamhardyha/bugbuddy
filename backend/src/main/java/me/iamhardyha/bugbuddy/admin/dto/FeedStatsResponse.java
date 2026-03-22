package me.iamhardyha.bugbuddy.admin.dto;

import java.util.List;

public record FeedStatsResponse(
        long totalFeeds,
        List<FeedCategoryCount> categories,
        double avgLikes,
        double avgComments
) {
    public record FeedCategoryCount(String category, long count) {}
}
