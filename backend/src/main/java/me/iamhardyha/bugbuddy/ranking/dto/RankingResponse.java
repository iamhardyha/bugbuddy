package me.iamhardyha.bugbuddy.ranking.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record RankingResponse(
        String period,
        String offset,
        OffsetDateTime rangeStart,
        OffsetDateTime rangeEnd,
        List<RankingRowResponse> topRankings,
        MyRankResponse myRank
) {}
