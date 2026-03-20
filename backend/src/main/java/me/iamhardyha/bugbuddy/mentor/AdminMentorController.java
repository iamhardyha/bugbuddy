package me.iamhardyha.bugbuddy.mentor;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.mentor.dto.AdminMentorApplicationResponse;
import me.iamhardyha.bugbuddy.mentor.dto.MentorRejectRequest;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/mentor/applications")
@RequiredArgsConstructor
public class AdminMentorController {

    private final MentorService mentorService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminMentorApplicationResponse>>> getApplications(
            @RequestParam(required = false) MentorApplicationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Long adminUserId) {
        Page<AdminMentorApplicationResponse> response = mentorService.getApplications(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminMentorApplicationResponse>> getApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminUserId) {
        AdminMentorApplicationResponse response = mentorService.getApplicationDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminUserId) {
        mentorService.approve(id, adminUserId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminUserId,
            @RequestBody @Valid MentorRejectRequest request) {
        mentorService.reject(id, adminUserId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
