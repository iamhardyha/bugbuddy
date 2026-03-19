package me.iamhardyha.bugbuddy.chat;

import jakarta.validation.Valid;
import me.iamhardyha.bugbuddy.chat.dto.*;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
public class ChatController {

    private final ChatRoomService chatRoomService;
    private final ChatMessageService chatMessageService;
    private final ChatFeedbackService chatFeedbackService;

    public ChatController(ChatRoomService chatRoomService,
                          ChatMessageService chatMessageService,
                          ChatFeedbackService chatFeedbackService) {
        this.chatRoomService = chatRoomService;
        this.chatMessageService = chatMessageService;
        this.chatFeedbackService = chatFeedbackService;
    }

    /** POST /api/chat/rooms — 채팅 신청 (질문자만) */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatRoomResponse>> propose(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid ChatRoomCreateRequest request
    ) {
        ChatRoomResponse response = chatRoomService.proposeChat(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /** PATCH /api/chat/rooms/{id}/accept — 채팅 수락 (멘토) */
    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> accept(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        ChatRoomResponse response = chatRoomService.acceptChat(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** GET /api/chat/rooms — 내 채팅방 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getMyRooms(
            @AuthenticationPrincipal Long userId
    ) {
        List<ChatRoomResponse> response = chatRoomService.getMyRooms(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** PATCH /api/chat/rooms/{id}/read — 읽음 처리 */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        chatMessageService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /** GET /api/chat/rooms/{id}/messages — 메시지 히스토리 (페이징) */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<ChatMessageResponse> response = chatMessageService.getMessages(id, userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** PATCH /api/chat/rooms/{id}/close — 세션 종료 */
    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> close(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        ChatRoomResponse response = chatRoomService.closeRoom(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** POST /api/chat/rooms/{id}/feedback — 피드백 제출 */
    @PostMapping("/{id}/feedback")
    public ResponseEntity<ApiResponse<Void>> submitFeedback(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody @Valid ChatFeedbackRequest request
    ) {
        chatFeedbackService.submitFeedback(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }
}
