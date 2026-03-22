package me.iamhardyha.bugbuddy.admin;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.admin.dto.*;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> summary() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSummary()));
    }

    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<TrendResponse>> trends(
            @RequestParam String type,
            @RequestParam(defaultValue = "DAILY") String period,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getTrends(type, period, days)));
    }

    @GetMapping("/active-users")
    public ResponseEntity<ApiResponse<ActiveUsersResponse>> activeUsers() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getActiveUsers()));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<ReportSummaryResponse>> reports() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getReportSummary()));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryDistributionResponse>> categories() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getCategoryDistribution()));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<TagRankingResponse>> tags(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getTagRanking(limit)));
    }

    @GetMapping("/xp-distribution")
    public ResponseEntity<ApiResponse<XpDistributionResponse>> xpDistribution() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getXpDistribution()));
    }

    @GetMapping("/feeds")
    public ResponseEntity<ApiResponse<FeedStatsResponse>> feeds() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getFeedStats()));
    }
}
