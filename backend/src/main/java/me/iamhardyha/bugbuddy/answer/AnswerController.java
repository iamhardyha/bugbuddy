package me.iamhardyha.bugbuddy.answer;

import jakarta.validation.Valid;
import me.iamhardyha.bugbuddy.answer.dto.AnswerCreateRequest;
import me.iamhardyha.bugbuddy.answer.dto.AnswerResponse;
import me.iamhardyha.bugbuddy.answer.dto.AnswerUpdateRequest;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions/{questionId}/answers")
public class AnswerController {

    private final AnswerService answerService;

    public AnswerController(AnswerService answerService) {
        this.answerService = answerService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AnswerResponse>> create(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long questionId,
            @RequestBody @Valid AnswerCreateRequest request
    ) {
        AnswerResponse response = answerService.create(userId, questionId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AnswerResponse>>> findAll(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long questionId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<AnswerResponse> response = answerService.findAllByQuestion(questionId, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{answerId}")
    public ResponseEntity<ApiResponse<AnswerResponse>> update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            @RequestBody @Valid AnswerUpdateRequest request
    ) {
        AnswerResponse response = answerService.update(userId, questionId, answerId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{answerId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long questionId,
            @PathVariable Long answerId
    ) {
        answerService.delete(userId, questionId, answerId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{answerId}/accept")
    public ResponseEntity<ApiResponse<AnswerResponse>> accept(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long questionId,
            @PathVariable Long answerId
    ) {
        AnswerResponse response = answerService.accept(userId, questionId, answerId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 도움됐어요 추가
    @PostMapping("/{answerId}/reactions")
    public ResponseEntity<ApiResponse<AnswerResponse>> addReaction(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long questionId,
            @PathVariable Long answerId
    ) {
        AnswerResponse response = answerService.addReaction(userId, questionId, answerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // 도움됐어요 취소
    @DeleteMapping("/{answerId}/reactions")
    public ResponseEntity<ApiResponse<AnswerResponse>> removeReaction(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long questionId,
            @PathVariable Long answerId
    ) {
        AnswerResponse response = answerService.removeReaction(userId, questionId, answerId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
