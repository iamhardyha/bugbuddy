package me.iamhardyha.bugbuddy.question;

import jakarta.validation.Valid;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;
import me.iamhardyha.bugbuddy.question.dto.QuestionCreateRequest;
import me.iamhardyha.bugbuddy.question.dto.QuestionDetailResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionSummaryResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> create(
            Authentication authentication,
            @RequestBody @Valid QuestionCreateRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        QuestionDetailResponse response = questionService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuestionSummaryResponse>>> findAll(
            @RequestParam(required = false) QuestionCategory category,
            @RequestParam(required = false) QuestionType questionType,
            @RequestParam(required = false) QuestionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<QuestionSummaryResponse> response = questionService.findAll(category, questionType, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> findById(@PathVariable Long id) {
        QuestionDetailResponse response = questionService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> update(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid QuestionUpdateRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        QuestionDetailResponse response = questionService.update(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = (Long) authentication.getPrincipal();
        questionService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> close(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = (Long) authentication.getPrincipal();
        QuestionDetailResponse response = questionService.close(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
