package me.iamhardyha.bugbuddy.ranking;

import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
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

    private static final String PERIOD_ERROR_MESSAGE = "period는 all, weekly, monthly 중 하나여야 합니다";
    private static final String OFFSET_ERROR_MESSAGE = "offset은 current 또는 previous여야 합니다";

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
        if (periodEnum == null) {
            return badRequest(PERIOD_ERROR_MESSAGE);
        }
        RankingOffset offsetEnum = parseOffset(offset);
        if (offsetEnum == null) {
            return badRequest(OFFSET_ERROR_MESSAGE);
        }
        return ResponseEntity.ok(
                ApiResponse.ok(rankingService.getRanking(periodEnum, offsetEnum, userId))
        );
    }

    private ResponseEntity<ApiResponse<RankingResponse>> badRequest(String message) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT.name(), message));
    }

    private RankingPeriod parsePeriod(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return RankingPeriod.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private RankingOffset parseOffset(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return RankingOffset.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
