package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.ChatMessagePayload;
import me.iamhardyha.bugbuddy.chat.dto.ChatMessageResponse;
import me.iamhardyha.bugbuddy.chat.dto.ChatRoomEvent;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.ChatMessage;
import me.iamhardyha.bugbuddy.model.entity.ChatRoom;
import me.iamhardyha.bugbuddy.model.enums.ChatMessageType;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import me.iamhardyha.bugbuddy.user.UserNicknameResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatNotificationService chatNotificationService;
    private final UserNicknameResolver userNicknameResolver;

    /** WebSocket 메시지 수신 → 저장 → 브로드캐스트. */
    @Transactional
    public ChatMessageResponse sendMessage(Long roomId, Long senderUserId, ChatMessagePayload payload) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, senderUserId);

        if (room.getStatus() != ChatRoomStatus.OPEN) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_OPEN);
        }

        ChatMessageType type = parseChatMessageType(payload.messageType());

        ChatMessage message = new ChatMessage();
        message.setRoomId(roomId);
        message.setSenderUserId(senderUserId);
        message.setMessageType(type);
        message.setContent(payload.content());

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.of(saved, userNicknameResolver.resolve(senderUserId));

        chatNotificationService.sendMessage(roomId, response);

        // 상대방에게 새 메시지 이벤트 브로드캐스트 (채팅 목록 실시간 업데이트)
        Long recipientId = room.getMentor().getId().equals(senderUserId)
                ? room.getMentee().getId()
                : room.getMentor().getId();
        chatNotificationService.sendRoomEvent(recipientId,
                ChatRoomEvent.newMessage(roomId, payload.content(), saved.getCreatedAt()));

        return response;
    }

    /** 메시지 히스토리 조회 (페이징) — 배치 닉네임 조회로 N+1 방지. */
    public Page<ChatMessageResponse> getMessages(Long roomId, Long userId, Pageable pageable) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, userId);

        Page<ChatMessage> messages = chatMessageRepository.findActiveByRoomId(roomId, pageable);

        Set<Long> senderIds = messages.getContent().stream()
                .map(ChatMessage::getSenderUserId)
                .collect(Collectors.toSet());
        Map<Long, String> nicknameMap = userNicknameResolver.resolveAll(senderIds);

        return messages.map(msg -> ChatMessageResponse.of(
                msg, nicknameMap.getOrDefault(msg.getSenderUserId(), "알 수 없는 사용자")));
    }

    /** 채팅방 읽음 처리 — 마지막 메시지 ID를 lastReadMessageId에 저장. */
    @Transactional
    public void markAsRead(Long roomId, Long userId) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, userId);

        Optional<ChatMessage> lastMessage = chatMessageRepository
                .findFirstByRoomIdOrderByIdDesc(roomId);

        lastMessage.ifPresent(msg -> {
            if (room.getMentor().getId().equals(userId)) {
                room.setMentorLastReadMessageId(msg.getId());
            } else {
                room.setMenteeLastReadMessageId(msg.getId());
            }
        });
    }

    // --- private helpers ---

    private ChatRoom findActiveRoom(Long roomId) {
        return chatRoomRepository.findActiveById(roomId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    private void assertRoomAccess(ChatRoom room, Long userId) {
        if (!room.getMentor().getId().equals(userId) && !room.getMentee().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
    }

    private ChatMessageType parseChatMessageType(String type) {
        try {
            if (type != null) {
                return ChatMessageType.valueOf(type.toUpperCase());
            }
        } catch (IllegalArgumentException ignored) {
        }
        return ChatMessageType.TEXT;
    }
}
