package me.iamhardyha.bugbuddy.question;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.question.dto.AdminQuestionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminQuestionResponse>>> list(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(questionService.findAllForAdmin(pageable)));
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<ApiResponse<Void>> hide(@PathVariable Long id) {
        questionService.adminHide(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable Long id) {
        questionService.adminRestore(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        questionService.adminDelete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
