package me.iamhardyha.bugbuddy.admin.dto;

import java.util.List;

public record CategoryDistributionResponse(
        List<CategoryCount> categories
) {
    public record CategoryCount(String category, long count, double percentage) {}
}
