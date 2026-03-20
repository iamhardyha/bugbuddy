package me.iamhardyha.bugbuddy.mentor;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.mentor.dto.MentorApplicationResponse;
import me.iamhardyha.bugbuddy.mentor.dto.MentorApplyRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<MentorApplicationResponse>> apply(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid MentorApplyRequest request) {
        MentorApplicationResponse response = mentorService.apply(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/apply/me")
    public ResponseEntity<ApiResponse<MentorApplicationResponse>> getMyApplication(
            @AuthenticationPrincipal Long userId) {
        MentorApplicationResponse response = mentorService.getMyApplication(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
