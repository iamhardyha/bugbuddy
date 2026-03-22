package me.iamhardyha.bugbuddy.answer;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.answer.dto.AdminAnswerResponse;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/answers")
@RequiredArgsConstructor
public class AdminAnswerController {

    private final AnswerService answerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminAnswerResponse>>> list(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(answerService.findAllForAdmin(pageable)));
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<ApiResponse<Void>> hide(@PathVariable Long id) {
        answerService.adminHide(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable Long id) {
        answerService.adminRestore(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        answerService.adminDelete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
