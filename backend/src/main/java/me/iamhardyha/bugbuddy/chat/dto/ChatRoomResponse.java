package me.iamhardyha.bugbuddy.chat.dto;

import me.iamhardyha.bugbuddy.model.entity.ChatRoom;

import java.time.Instant;

public record ChatRoomResponse(
        Long id,
        Long questionId,
        Long mentorUserId,
        String mentorNickname,
        Long menteeUserId,
        String menteeNickname,
        String status,
        Instant createdAt,
        Instant closedAt
) {
    public static ChatRoomResponse of(ChatRoom room, String mentorNickname, String menteeNickname) {
        return new ChatRoomResponse(
                room.getId(),
                room.getQuestionId(),
                room.getMentorUserId(),
                mentorNickname,
                room.getMenteeUserId(),
                menteeNickname,
                room.getStatus().name(),
                room.getCreatedAt(),
                room.getClosedAt()
        );
    }
}
