package me.iamhardyha.bugbuddy.report;

import jakarta.validation.Valid;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.model.enums.ReportStatus;
import me.iamhardyha.bugbuddy.report.dto.AdminResolveRequest;
import me.iamhardyha.bugbuddy.report.dto.ReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /** GET /api/admin/reports — 신고 목록 조회 (status 필터, 페이징) */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> listReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(reportService.listReports(status, pageable)));
    }

    /** PATCH /api/admin/reports/{id}/review — 검토 시작 */
    @PatchMapping("/{id}/review")
    public ResponseEntity<ApiResponse<ReportResponse>> reviewReport(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminUserId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.reviewReport(id, adminUserId)));
    }

    /** PATCH /api/admin/reports/{id}/resolve — 처리 완료 (제재 포함) */
    @PatchMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ReportResponse>> resolveReport(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminUserId,
            @RequestBody(required = false) @Valid AdminResolveRequest request) {
        AdminResolveRequest resolveRequest = request != null ? request : new AdminResolveRequest(false, 0);
        return ResponseEntity.ok(ApiResponse.ok(reportService.resolveReport(id, adminUserId, resolveRequest)));
    }

    /** PATCH /api/admin/reports/{id}/reject — 신고 기각 */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReportResponse>> rejectReport(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminUserId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.rejectReport(id, adminUserId)));
    }
}
