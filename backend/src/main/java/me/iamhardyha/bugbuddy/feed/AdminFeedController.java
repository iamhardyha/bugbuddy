package me.iamhardyha.bugbuddy.feed;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.feed.dto.AdminFeedResponse;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/feeds")
@RequiredArgsConstructor
public class AdminFeedController {

    private final FeedService feedService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminFeedResponse>>> list(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(feedService.findAllForAdmin(pageable)));
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<ApiResponse<Void>> hide(@PathVariable Long id) {
        feedService.adminHide(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable Long id) {
        feedService.adminRestore(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        feedService.adminDelete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
