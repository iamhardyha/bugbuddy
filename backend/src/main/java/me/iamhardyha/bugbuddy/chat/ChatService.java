package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.*;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.*;
import me.iamhardyha.bugbuddy.model.enums.ChatMessageType;
import me.iamhardyha.bugbuddy.model.enums.ChatRoleType;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final XpService xpService;

    public ChatService(ChatRoomRepository chatRoomRepository,
                       ChatMessageRepository chatMessageRepository,
                       ChatRoomFeedbackRepository feedbackRepository,
                       UserRepository userRepository,
                       AnswerRepository answerRepository,
                       QuestionRepository questionRepository,
                       SimpMessagingTemplate messagingTemplate,
                       XpService xpService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.answerRepository = answerRepository;
        this.questionRepository = questionRepository;
        this.messagingTemplate = messagingTemplate;
        this.xpService = xpService;
    }

    /** 질문자(멘티) → 채팅 신청 (PENDING 상태로 생성). */
    @Transactional
    public ChatRoomResponse proposeChat(Long menteeUserId, ChatRoomCreateRequest request) {
        Answer answer = answerRepository.findActiveById(request.answerId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND));

        if (!answer.isAllowOneToOne()) {
            throw new BugBuddyException(ErrorCode.CHAT_ANSWER_NOT_ALLOWED);
        }

        Question question = questionRepository.findActiveById(answer.getQuestionId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthor().getId().equals(menteeUserId)) {
            throw new BugBuddyException(ErrorCode.CHAT_NOT_QUESTION_AUTHOR);
        }

        Long mentorUserId = answer.getAuthorUserId();

        boolean duplicate = chatRoomRepository.existsByMentorUserIdAndMenteeUserIdAndQuestionIdAndStatusNot(
                mentorUserId, menteeUserId, question.getId(), ChatRoomStatus.CLOSED);
        if (duplicate) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_DUPLICATE);
        }

        ChatRoom room = new ChatRoom();
        room.setMentorUserId(mentorUserId);
        room.setMenteeUserId(menteeUserId);
        room.setQuestionId(question.getId());
        room.setStatus(ChatRoomStatus.PENDING);

        ChatRoom saved = chatRoomRepository.save(room);

        return buildRoomResponse(saved, menteeUserId);
    }

    /** 멘토 → 채팅 수락 (PENDING → OPEN). */
    @Transactional
    public ChatRoomResponse acceptChat(Long mentorUserId, Long roomId) {
        ChatRoom room = findActiveRoom(roomId);

        if (!room.getMentorUserId().equals(mentorUserId)) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
        if (room.getStatus() != ChatRoomStatus.PENDING) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_PENDING);
        }

        room.setStatus(ChatRoomStatus.OPEN);

        sendSystemMessage(room.getId(), "멘토링 세션이 시작되었습니다.");

        // 멘티에게 수락 이벤트 브로드캐스트 (채팅 목록 실시간 업데이트)
        broadcastUserEvent(room.getMenteeUserId(), ChatRoomEvent.roomAccepted(roomId));

        return buildRoomResponse(room, mentorUserId);
    }

    /** 내 채팅방 목록 조회. */
    public List<ChatRoomResponse> getMyRooms(Long userId) {
        return chatRoomRepository.findActiveByUserId(userId).stream()
                .map(room -> buildRoomResponse(room, userId))
                .toList();
    }

    /** 메시지 히스토리 조회 (페이징). */
    public Page<ChatMessageResponse> getMessages(Long userId, Long roomId, Pageable pageable) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, userId);

        return chatMessageRepository.findActiveByRoomId(roomId, pageable)
                .map(msg -> ChatMessageResponse.of(msg, getNickname(msg.getSenderUserId())));
    }

    /** 세션 종료. */
    @Transactional
    public ChatRoomResponse closeRoom(Long userId, Long roomId) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, userId);

        if (room.getStatus() != ChatRoomStatus.OPEN) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_OPEN);
        }

        room.setStatus(ChatRoomStatus.CLOSED);
        room.setClosedAt(Instant.now());

        sendSystemMessage(roomId, "멘토링 세션이 종료되었습니다. 피드백을 남겨주세요.");

        // 양측에 종료 이벤트 브로드캐스트 (채팅 목록 + 채팅방 실시간 업데이트)
        ChatRoomEvent closedEvent = ChatRoomEvent.roomClosed(roomId);
        broadcastUserEvent(room.getMentorUserId(), closedEvent);
        broadcastUserEvent(room.getMenteeUserId(), closedEvent);

        return buildRoomResponse(room, userId);
    }

    /** 피드백 제출 + 평점 재계산 + XP 이벤트. */
    @Transactional
    public void submitFeedback(Long userId, Long roomId, ChatFeedbackRequest request) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, userId);

        if (room.getStatus() != ChatRoomStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_OPEN);
        }
        if (feedbackRepository.existsByRoomIdAndRaterUserId(roomId, userId)) {
            throw new BugBuddyException(ErrorCode.CHAT_FEEDBACK_ALREADY_EXISTS);
        }

        boolean raterIsMentee = room.getMenteeUserId().equals(userId);
        ChatRoleType raterRole = raterIsMentee ? ChatRoleType.MENTEE : ChatRoleType.MENTOR;

        ChatRoomFeedback feedback = new ChatRoomFeedback();
        feedback.setRoomId(roomId);
        feedback.setRaterUserId(userId);
        feedback.setRaterRole(raterRole);
        feedback.setRating(request.rating());
        feedback.setComment(request.comment());
        feedbackRepository.save(feedback);

        if (raterIsMentee) {
            // 멘티 → 멘토 평점
            recalculateMentorRating(room.getMentorUserId(), request.rating());
            grantChatFeedbackXp(room.getMentorUserId(), roomId, request.rating());
        } else {
            // 멘토 → 멘티 평점
            recalculateMenteeRating(room.getMenteeUserId(), request.rating());
        }
    }

    /** 채팅방 읽음 처리 — 마지막 메시지 ID를 lastReadMessageId에 저장. */
    @Transactional
    public void markAsRead(Long userId, Long roomId) {
        ChatRoom room = findActiveRoom(roomId);
        assertRoomAccess(room, userId);

        Optional<ChatMessage> lastMessage = chatMessageRepository
                .findFirstByRoomIdOrderByIdDesc(roomId);

        lastMessage.ifPresent(msg -> {
            if (room.getMentorUserId().equals(userId)) {
                room.setMentorLastReadMessageId(msg.getId());
            } else {
                room.setMenteeLastReadMessageId(msg.getId());
            }
        });
    }

    /** WebSocket 메시지 수신 → 저장 → 브로드캐스트. */
    @Transactional
    public ChatMessageResponse handleWebSocketMessage(Long roomId, Long senderUserId, ChatMessagePayload payload) {
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
        ChatMessageResponse response = ChatMessageResponse.of(saved, getNickname(senderUserId));

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);

        // 상대방에게 새 메시지 이벤트 브로드캐스트 (채팅 목록 실시간 업데이트)
        Long recipientId = room.getMentorUserId().equals(senderUserId)
                ? room.getMenteeUserId()
                : room.getMentorUserId();
        broadcastUserEvent(recipientId,
                ChatRoomEvent.newMessage(roomId, payload.content(), saved.getCreatedAt()));

        return response;
    }

    // --- private helpers ---

    private ChatRoom findActiveRoom(Long roomId) {
        return chatRoomRepository.findActiveById(roomId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    private void assertRoomAccess(ChatRoom room, Long userId) {
        if (!room.getMentorUserId().equals(userId) && !room.getMenteeUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
    }

    private UserEntity findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
    }

    private String getNickname(Long userId) {
        return userRepository.findById(userId)
                .map(UserEntity::getNickname)
                .orElse("알 수 없음");
    }

    private ChatRoomResponse buildRoomResponse(ChatRoom room, Long currentUserId) {
        Long lastReadId = room.getMentorUserId().equals(currentUserId)
                ? room.getMentorLastReadMessageId()
                : room.getMenteeLastReadMessageId();

        long unreadCount = lastReadId == null
                ? chatMessageRepository.countAllFromOthers(room.getId(), currentUserId)
                : chatMessageRepository.countUnreadAfter(room.getId(), lastReadId, currentUserId);

        Optional<ChatMessage> lastMsg = chatMessageRepository
                .findFirstByRoomIdOrderByIdDesc(room.getId());
        String lastMsgContent = lastMsg.map(ChatMessage::getContent).orElse(null);
        Instant lastMsgAt = lastMsg.map(m -> m.getCreatedAt()).orElse(null);

        String questionTitle = null;
        if (room.getQuestionId() != null) {
            questionTitle = questionRepository.findActiveById(room.getQuestionId())
                    .map(q -> q.getTitle())
                    .orElse(null);
        }

        boolean myFeedbackSubmitted = feedbackRepository.existsByRoomIdAndRaterUserId(room.getId(), currentUserId);

        return ChatRoomResponse.of(
                room,
                getNickname(room.getMentorUserId()),
                getNickname(room.getMenteeUserId()),
                questionTitle,
                (int) Math.min(unreadCount, 99),
                lastMsgContent,
                lastMsgAt,
                myFeedbackSubmitted
        );
    }

    private void broadcastUserEvent(Long userId, ChatRoomEvent event) {
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/chat-events", event);
    }

    private void sendSystemMessage(Long roomId, String text) {
        ChatMessage systemMsg = new ChatMessage();
        systemMsg.setRoomId(roomId);
        systemMsg.setSenderUserId(0L);  // 0 = 시스템
        systemMsg.setMessageType(ChatMessageType.SYSTEM);
        systemMsg.setContent(text);
        ChatMessage saved = chatMessageRepository.save(systemMsg);

        ChatMessageResponse response = new ChatMessageResponse(
                saved.getId(), roomId, 0L, "SYSTEM",
                ChatMessageType.SYSTEM.name(), text, saved.getCreatedAt());
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);
    }

    private void grantChatFeedbackXp(Long mentorUserId, Long roomId, int rating) {
        if (rating >= 4) {
            xpService.grantXp(mentorUserId, XpEventType.CHAT_FEEDBACK_POSITIVE,
                    ReferenceType.CHAT_ROOM, roomId, 50);
        } else {
            xpService.grantXp(mentorUserId, XpEventType.CHAT_FEEDBACK_NEGATIVE,
                    ReferenceType.CHAT_ROOM, roomId, 0);
            // 부정 피드백 5회 누적마다 -10 XP 차감
            long negativeCount = xpService.countEvents(mentorUserId, XpEventType.CHAT_FEEDBACK_NEGATIVE, 0);
            if (negativeCount % 5 == 0) {
                xpService.grantXp(mentorUserId, XpEventType.CHAT_FEEDBACK_NEGATIVE,
                        ReferenceType.CHAT_ROOM, roomId, -10);
            }
        }
    }

    /** 멘티 → 멘토 평점 증분 재계산. */
    private void recalculateMentorRating(Long mentorUserId, int newRating) {
        UserEntity mentor = findUser(mentorUserId);

        int currentCount = mentor.getMentorRatingCount();
        BigDecimal currentAvg = mentor.getMentorAvgRating() != null
                ? mentor.getMentorAvgRating()
                : BigDecimal.ZERO;

        int newCount = currentCount + 1;
        BigDecimal newAvg = currentAvg.multiply(BigDecimal.valueOf(currentCount))
                .add(BigDecimal.valueOf(newRating))
                .divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);

        mentor.setMentorRatingCount(newCount);
        mentor.setMentorAvgRating(newAvg);
        userRepository.save(mentor);
    }

    /** 멘토 → 멘티 평점 증분 재계산. */
    private void recalculateMenteeRating(Long menteeUserId, int newRating) {
        UserEntity mentee = findUser(menteeUserId);

        int currentCount = mentee.getMenteeRatingCount();
        BigDecimal currentAvg = mentee.getMenteeAvgRating() != null
                ? mentee.getMenteeAvgRating()
                : BigDecimal.ZERO;

        int newCount = currentCount + 1;
        BigDecimal newAvg = currentAvg.multiply(BigDecimal.valueOf(currentCount))
                .add(BigDecimal.valueOf(newRating))
                .divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);

        mentee.setMenteeRatingCount(newCount);
        mentee.setMenteeAvgRating(newAvg);
        userRepository.save(mentee);
    }

    private ChatMessageType parseChatMessageType(String type) {
        try {
            if (type != null) {
                return ChatMessageType.valueOf(type.toUpperCase());
            }
        } catch (IllegalArgumentException ignored) {}
        return ChatMessageType.TEXT;
    }
}
