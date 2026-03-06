package me.iamhardyha.bugbuddy.chat.dto;

import me.iamhardyha.bugbuddy.model.entity.ChatRoom;

import java.time.Instant;

public record ChatRoomResponse(
        Long id,
        Long questionId,
        String questionTitle,
        Long mentorUserId,
        String mentorNickname,
        Long menteeUserId,
        String menteeNickname,
        String status,
        int unreadCount,
        String lastMessageContent,
        Instant lastMessageAt,
        Instant createdAt,
        Instant closedAt,
        boolean myFeedbackSubmitted
) {
    public static ChatRoomResponse of(
            ChatRoom room,
            String mentorNickname,
            String menteeNickname,
            String questionTitle,
            int unreadCount,
            String lastMessageContent,
            Instant lastMessageAt,
            boolean myFeedbackSubmitted
    ) {
        return new ChatRoomResponse(
                room.getId(),
                room.getQuestionId(),
                questionTitle,
                room.getMentorUserId(),
                mentorNickname,
                room.getMenteeUserId(),
                menteeNickname,
                room.getStatus().name(),
                unreadCount,
                lastMessageContent,
                lastMessageAt,
                room.getCreatedAt(),
                room.getClosedAt(),
                myFeedbackSubmitted
        );
    }
}
