package me.iamhardyha.bugbuddy.admin.dto;

import java.util.List;

public record TagRankingResponse(List<TagCount> tags) {
    public record TagCount(String tagName, long count) {}
}
