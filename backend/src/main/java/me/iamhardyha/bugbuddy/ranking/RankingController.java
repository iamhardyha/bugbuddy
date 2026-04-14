package me.iamhardyha.bugbuddy.ranking;

import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.ranking.dto.RankingResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rankings")
public class RankingController {

    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RankingResponse>> getRanking(
            @RequestParam("period") String period,
            @RequestParam(value = "offset", required = false, defaultValue = "current") String offset,
            @AuthenticationPrincipal Long userId
    ) {
        RankingPeriod periodEnum = parsePeriod(period);
        RankingOffset offsetEnum = parseOffset(offset);
        return ResponseEntity.ok(
                ApiResponse.ok(rankingService.getRanking(periodEnum, offsetEnum, userId))
        );
    }

    private RankingPeriod parsePeriod(String raw) {
        try {
            return RankingPeriod.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("period는 all, weekly, monthly 중 하나여야 합니다");
        }
    }

    private RankingOffset parseOffset(String raw) {
        try {
            return RankingOffset.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("offset은 current 또는 previous여야 합니다");
        }
    }
}
