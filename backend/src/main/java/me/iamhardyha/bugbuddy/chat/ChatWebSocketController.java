package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.ChatMessagePayload;
import me.iamhardyha.bugbuddy.chat.dto.ChatMessageResponse;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;

    public ChatWebSocketController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * 클라이언트 발행 경로: /app/chat/{roomId}
     * 브로드캐스트 경로:    /topic/chat/{roomId}
     */
    @MessageMapping("/chat/{roomId}")
    public void sendMessage(
            @DestinationVariable Long roomId,
            ChatMessagePayload payload,
            Principal principal
    ) {
        Long senderUserId = Long.parseLong(principal.getName());
        ChatMessageResponse response = chatService.handleWebSocketMessage(roomId, senderUserId, payload);
        // 브로드캐스트는 ChatService 내 SimpMessagingTemplate에서 처리
    }
}
