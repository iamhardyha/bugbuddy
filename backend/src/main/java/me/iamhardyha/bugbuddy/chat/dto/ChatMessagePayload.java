package me.iamhardyha.bugbuddy.chat.dto;

/** WebSocket(STOMP)으로 클라이언트가 전송하는 메시지 페이로드. */
public record ChatMessagePayload(
        String content,
        String messageType  // TEXT | FILE
) {}
