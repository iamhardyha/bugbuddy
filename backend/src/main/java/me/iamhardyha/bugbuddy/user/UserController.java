package me.iamhardyha.bugbuddy.user;

import jakarta.validation.Valid;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionSummaryResponse;
import me.iamhardyha.bugbuddy.user.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** 공개 프로필 조회 */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<PublicProfileResponse>> getPublicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getPublicProfile(userId)));
    }

    /** 프로필 수정 */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** 회원 탈퇴 */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deactivate(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        userService.deactivate(userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** 작성한 질문 목록 (공개) */
    @GetMapping("/{userId}/questions")
    public ResponseEntity<ApiResponse<Page<QuestionSummaryResponse>>> getUserQuestions(
            @PathVariable Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserQuestions(userId, pageable)));
    }

    /** 작성한 답변 목록 (공개) */
    @GetMapping("/{userId}/answers")
    public ResponseEntity<ApiResponse<Page<UserAnswerSummaryResponse>>> getUserAnswers(
            @PathVariable Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserAnswers(userId, pageable)));
    }

    /** 활동 통계 (공개) */
    @GetMapping("/{userId}/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserStats(userId)));
    }
}
