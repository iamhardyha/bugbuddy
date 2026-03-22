package me.iamhardyha.bugbuddy.admin.dto;

import java.util.List;

public record XpDistributionResponse(List<LevelCount> levels) {
    public record LevelCount(int level, long userCount) {}
}
