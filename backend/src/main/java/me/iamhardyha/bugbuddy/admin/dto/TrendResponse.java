package me.iamhardyha.bugbuddy.admin.dto;

import java.util.List;

public record TrendResponse(
        String type,
        String period,
        List<TrendPoint> points
) {
    public record TrendPoint(String date, long count) {}
}
