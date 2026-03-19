package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.ChatMessageResponse;
import me.iamhardyha.bugbuddy.chat.dto.ChatRoomEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /** 채팅방에 메시지 브로드캐스트. */
    public void sendMessage(Long roomId, ChatMessageResponse response) {
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);
    }

    /** 특정 유저에게 채팅 이벤트 브로드캐스트. */
    public void sendRoomEvent(Long userId, ChatRoomEvent event) {
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/chat-events", event);
    }
}
