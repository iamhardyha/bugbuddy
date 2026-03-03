package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.*;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.*;
import me.iamhardyha.bugbuddy.model.enums.ChatMessageType;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
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

@Service
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final XpService xpService;

    public ChatService(ChatRoomRepository chatRoomRepository,
                       ChatMessageRepository chatMessageRepository,
                       ChatRoomFeedbackRepository feedbackRepository,
                       UserRepository userRepository,
                       QuestionRepository questionRepository,
                       SimpMessagingTemplate messagingTemplate,
                       XpService xpService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.messagingTemplate = messagingTemplate;
        this.xpService = xpService;
    }

    /** 멘토 → 채팅 제안 (PENDING 상태로 생성). */
    @Transactional
    public ChatRoomResponse proposeChat(Long mentorUserId, ChatRoomCreateRequest request) {
        UserEntity mentor = findUser(mentorUserId);
        if (mentor.getMentorStatus() != MentorStatus.APPROVED) {
            throw new BugBuddyException(ErrorCode.CHAT_NOT_MENTOR);
        }

        Question question = questionRepository.findActiveById(request.questionId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.isAllowOneToOne()) {
            throw new BugBuddyException(ErrorCode.CHAT_QUESTION_NOT_ALLOWED);
        }

        Long menteeUserId = question.getAuthorUserId();

        boolean duplicate = chatRoomRepository.existsByMentorUserIdAndMenteeUserIdAndQuestionIdAndStatusNot(
                mentorUserId, menteeUserId, request.questionId(), ChatRoomStatus.CLOSED);
        if (duplicate) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_DUPLICATE);
        }

        ChatRoom room = new ChatRoom();
        room.setMentorUserId(mentorUserId);
        room.setMenteeUserId(menteeUserId);
        room.setQuestionId(request.questionId());
        room.setStatus(ChatRoomStatus.PENDING);

        ChatRoom saved = chatRoomRepository.save(room);

        return buildRoomResponse(saved);
    }

    /** 멘티 → 채팅 수락 (PENDING → OPEN). */
    @Transactional
    public ChatRoomResponse acceptChat(Long menteeUserId, Long roomId) {
        ChatRoom room = findActiveRoom(roomId);

        if (!room.getMenteeUserId().equals(menteeUserId)) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
        if (room.getStatus() != ChatRoomStatus.PENDING) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_PENDING);
        }

        room.setStatus(ChatRoomStatus.OPEN);

        sendSystemMessage(room.getId(), "멘토링 세션이 시작되었습니다.");

        return buildRoomResponse(room);
    }

    /** 내 채팅방 목록 조회. */
    public Page<ChatRoomResponse> getMyRooms(Long userId, Pageable pageable) {
        return chatRoomRepository.findActiveByUserId(userId, pageable)
                .map(this::buildRoomResponse);
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

        return buildRoomResponse(room);
    }

    /** 피드백 제출 + 멘토 평점 재계산 + XP 이벤트. */
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

        ChatRoomFeedback feedback = new ChatRoomFeedback();
        feedback.setRoomId(roomId);
        feedback.setRaterUserId(userId);
        feedback.setRating(request.rating());
        feedback.setComment(request.comment());
        feedbackRepository.save(feedback);

        recalculateMentorRating(room.getMentorUserId(), roomId);
        grantChatFeedbackXp(room.getMentorUserId(), roomId, request.rating());
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

    private ChatRoomResponse buildRoomResponse(ChatRoom room) {
        return ChatRoomResponse.of(room, getNickname(room.getMentorUserId()), getNickname(room.getMenteeUserId()));
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
        }
    }

    private void recalculateMentorRating(Long mentorUserId, Long roomId) {
        List<ChatRoomFeedback> allFeedbacks = feedbackRepository.findActiveByRoomId(roomId);

        // 멘토가 받은 피드백만 계산 (멘티가 작성한 것)
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) return;

        Long menteeUserId = room.getMenteeUserId();
        List<ChatRoomFeedback> menteeFeedbacks = allFeedbacks.stream()
                .filter(f -> f.getRaterUserId().equals(menteeUserId))
                .toList();

        if (menteeFeedbacks.isEmpty()) return;

        UserEntity mentor = findUser(mentorUserId);

        int currentCount = mentor.getMentorRatingCount();
        BigDecimal currentAvg = mentor.getMentorAvgRating() != null
                ? mentor.getMentorAvgRating()
                : BigDecimal.ZERO;

        // 새 피드백의 rating
        int newRating = menteeFeedbacks.getLast().getRating();
        int newCount = currentCount + 1;
        BigDecimal newAvg = currentAvg.multiply(BigDecimal.valueOf(currentCount))
                .add(BigDecimal.valueOf(newRating))
                .divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);

        mentor.setMentorRatingCount(newCount);
        mentor.setMentorAvgRating(newAvg);
        userRepository.save(mentor);
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
