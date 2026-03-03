package me.iamhardyha.bugbuddy.chat.dto;

import me.iamhardyha.bugbuddy.model.entity.ChatMessage;

import java.time.Instant;

public record ChatMessageResponse(
        Long id,
        Long roomId,
        Long senderUserId,
        String senderNickname,
        String messageType,
        String content,
        Instant createdAt
) {
    public static ChatMessageResponse of(ChatMessage message, String senderNickname) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRoomId(),
                message.getSenderUserId(),
                senderNickname,
                message.getMessageType().name(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
