package me.iamhardyha.bugbuddy.feed;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.feed.dto.FeedCommentCreateRequest;
import me.iamhardyha.bugbuddy.feed.dto.FeedCommentResponse;
import me.iamhardyha.bugbuddy.feed.dto.FeedCreateRequest;
import me.iamhardyha.bugbuddy.feed.dto.FeedResponse;
import me.iamhardyha.bugbuddy.feed.dto.FeedUpdateRequest;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.model.enums.FeedCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    // ── Feed CRUD ──

    @PostMapping
    public ResponseEntity<ApiResponse<FeedResponse>> create(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid FeedCreateRequest request) {
        FeedResponse response = feedService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FeedResponse>>> getFeeds(
            @RequestParam(required = false) FeedCategory category,
            @RequestParam(defaultValue = "createdAt") String sort,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal Long userId) {
        Page<FeedResponse> response = feedService.getFeeds(category, sort, pageable, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeedResponse>> getFeed(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        FeedResponse response = feedService.getFeed(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeedResponse>> update(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid FeedUpdateRequest request) {
        FeedResponse response = feedService.update(id, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        feedService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ── Like ──

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> like(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        feedService.like(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> unlike(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        feedService.unlike(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ── Bookmark ──

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ApiResponse<Void>> bookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        feedService.bookmark(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }

    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<ApiResponse<Void>> removeBookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        feedService.removeBookmark(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<ApiResponse<Page<FeedResponse>>> getBookmarks(
            @AuthenticationPrincipal Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FeedResponse> response = feedService.getBookmarks(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/liked")
    public ResponseEntity<ApiResponse<Page<FeedResponse>>> getLikedFeeds(
            @AuthenticationPrincipal Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FeedResponse> response = feedService.getLikedFeeds(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Comments ──

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<FeedCommentResponse>> createComment(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid FeedCommentCreateRequest request) {
        FeedCommentResponse response = feedService.createComment(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<Page<FeedCommentResponse>>> getComments(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<FeedCommentResponse> response = feedService.getComments(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long userId) {
        feedService.deleteComment(id, commentId, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
