package me.iamhardyha.bugbuddy.chat.dto;

import java.time.Instant;

/**
 * 유저별 채팅 이벤트 — /topic/user/{userId}/chat-events 로 브로드캐스트.
 * 채팅 목록 실시간 업데이트, 채팅방 상태 변경 알림에 사용.
 */
public record ChatRoomEvent(
        String type,
        Long roomId,
        String status,
        String lastMessageContent,
        Instant lastMessageAt
) {

    public static ChatRoomEvent roomClosed(Long roomId) {
        return new ChatRoomEvent("ROOM_CLOSED", roomId, "CLOSED", null, null);
    }

    public static ChatRoomEvent roomAccepted(Long roomId) {
        return new ChatRoomEvent("ROOM_ACCEPTED", roomId, "OPEN", null, null);
    }

    public static ChatRoomEvent newMessage(Long roomId, String content, Instant at) {
        return new ChatRoomEvent("NEW_MESSAGE", roomId, null, content, at);
    }
}
