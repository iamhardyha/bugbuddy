package me.iamhardyha.bugbuddy.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.user.dto.AdminMentorStatusRequest;
import me.iamhardyha.bugbuddy.user.dto.AdminNicknameRequest;
import me.iamhardyha.bugbuddy.user.dto.AdminSuspendRequest;
import me.iamhardyha.bugbuddy.user.dto.AdminUserDetailResponse;
import me.iamhardyha.bugbuddy.user.dto.AdminUserListResponse;
import me.iamhardyha.bugbuddy.user.dto.AdminXpAdjustRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserListResponse>>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String mentorStatus,
            @RequestParam(required = false) Boolean suspended,
            Pageable pageable) {
        MentorStatus parsedStatus = null;
        if (mentorStatus != null) {
            try {
                parsedStatus = MentorStatus.valueOf(mentorStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BugBuddyException(ErrorCode.INVALID_INPUT);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.listUsers(keyword, parsedStatus, suspended, pageable)));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> getDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getDetail(userId)));
    }

    @PatchMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<Void>> suspend(
            @PathVariable Long userId,
            @RequestBody @Valid AdminSuspendRequest request) {
        adminUserService.suspend(userId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<Void>> unsuspend(@PathVariable Long userId) {
        adminUserService.unsuspend(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{userId}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long userId) {
        adminUserService.deactivate(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{userId}/nickname")
    public ResponseEntity<ApiResponse<Void>> changeNickname(
            @PathVariable Long userId,
            @RequestBody @Valid AdminNicknameRequest request) {
        adminUserService.changeNickname(userId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{userId}/xp")
    public ResponseEntity<ApiResponse<Void>> adjustXp(
            @PathVariable Long userId,
            @RequestBody @Valid AdminXpAdjustRequest request) {
        adminUserService.adjustXp(userId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{userId}/mentor-status")
    public ResponseEntity<ApiResponse<Void>> changeMentorStatus(
            @PathVariable Long userId,
            @RequestBody @Valid AdminMentorStatusRequest request) {
        adminUserService.changeMentorStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
