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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /** POST /api/chat/rooms — 채팅 제안 (멘토만) */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatRoomResponse>> propose(
            Authentication authentication,
            @RequestBody @Valid ChatRoomCreateRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        ChatRoomResponse response = chatService.proposeChat(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /** PATCH /api/chat/rooms/{id}/accept — 채팅 수락 (멘티) */
    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> accept(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = (Long) authentication.getPrincipal();
        ChatRoomResponse response = chatService.acceptChat(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** GET /api/chat/rooms — 내 채팅방 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getMyRooms(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<ChatRoomResponse> response = chatService.getMyRooms(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** PATCH /api/chat/rooms/{id}/read — 읽음 처리 */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = (Long) authentication.getPrincipal();
        chatService.markAsRead(userId, id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /** GET /api/chat/rooms/{id}/messages — 메시지 히스토리 (페이징) */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
            Authentication authentication,
            @PathVariable Long id,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Long userId = (Long) authentication.getPrincipal();
        Page<ChatMessageResponse> response = chatService.getMessages(userId, id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** PATCH /api/chat/rooms/{id}/close — 세션 종료 */
    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> close(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = (Long) authentication.getPrincipal();
        ChatRoomResponse response = chatService.closeRoom(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** POST /api/chat/rooms/{id}/feedback — 피드백 제출 */
    @PostMapping("/{id}/feedback")
    public ResponseEntity<ApiResponse<Void>> submitFeedback(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid ChatFeedbackRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        chatService.submitFeedback(userId, id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }
}
