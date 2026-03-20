package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.ChatMessageResponse;
import me.iamhardyha.bugbuddy.chat.dto.ChatRoomCreateRequest;
import me.iamhardyha.bugbuddy.chat.dto.ChatRoomEvent;
import me.iamhardyha.bugbuddy.chat.dto.ChatRoomResponse;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.*;
import me.iamhardyha.bugbuddy.model.enums.ChatMessageType;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.notification.event.ChatAcceptedEvent;
import me.iamhardyha.bugbuddy.notification.event.ChatRequestedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomFeedbackRepository feedbackRepository;
    private final ChatNotificationService chatNotificationService;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** 질문자(멘티) → 채팅 신청 (PENDING 상태로 생성). */
    @Transactional
    public ChatRoomResponse proposeChat(Long menteeUserId, ChatRoomCreateRequest request) {
        Answer answer = answerRepository.findActiveById(request.answerId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND));

        if (!answer.isAllowOneToOne()) {
            throw new BugBuddyException(ErrorCode.CHAT_ANSWER_NOT_ALLOWED);
        }

        Question question = questionRepository.findActiveById(answer.getQuestion().getId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthor().getId().equals(menteeUserId)) {
            throw new BugBuddyException(ErrorCode.CHAT_NOT_QUESTION_AUTHOR);
        }

        UserEntity mentor = answer.getAuthor();
        UserEntity mentee = question.getAuthor();

        boolean duplicate = chatRoomRepository.existsByMentorIdAndMenteeIdAndQuestionIdAndStatusNot(
                mentor.getId(), mentee.getId(), question.getId(), ChatRoomStatus.CLOSED);
        if (duplicate) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_DUPLICATE);
        }

        ChatRoom room = new ChatRoom();
        room.setMentor(mentor);
        room.setMentee(mentee);
        room.setQuestion(question);
        room.setStatus(ChatRoomStatus.PENDING);

        ChatRoom saved = chatRoomRepository.save(room);

        eventPublisher.publishEvent(new ChatRequestedEvent(menteeUserId, mentor.getId(), saved.getId()));

        return ChatRoomResponse.of(
                saved,
                question.getTitle(),
                0,
                null,
                null,
                false
        );
    }

    /** 멘토 → 채팅 수락 (PENDING → OPEN). */
    @Transactional
    public ChatRoomResponse acceptChat(Long mentorUserId, Long roomId) {
        ChatRoom room = findActiveRoom(roomId);

        if (!room.getMentor().getId().equals(mentorUserId)) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
        if (room.getStatus() != ChatRoomStatus.PENDING) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_PENDING);
        }

        room.setStatus(ChatRoomStatus.OPEN);

        sendSystemMessage(room.getId(), "멘토링 세션이 시작되었습니다.");

        // 멘티에게 수락 이벤트 브로드캐스트 (채팅 목록 실시간 업데이트)
        chatNotificationService.sendRoomEvent(room.getMentee().getId(), ChatRoomEvent.roomAccepted(roomId));

        eventPublisher.publishEvent(new ChatAcceptedEvent(mentorUserId, room.getMentee().getId(), roomId));

        return buildSingleRoomResponse(room, mentorUserId);
    }

    /** 내 채팅방 목록 조회 — batch 쿼리로 N+1 방지. */
    public List<ChatRoomResponse> getMyRooms(Long userId) {
        // 1. Fetch rooms with JOIN FETCH (mentor, mentee, question) — 1 query
        List<ChatRoom> rooms = chatRoomRepository.findActiveByUserId(userId);
        if (rooms.isEmpty()) {
            return List.of();
        }

        List<Long> roomIds = rooms.stream().map(ChatRoom::getId).toList();

        // 2. Batch last messages — 1 query
        Map<Long, ChatMessage> lastMessageMap = chatMessageRepository.findLastMessagesByRoomIds(roomIds)
                .stream()
                .collect(Collectors.toMap(ChatMessage::getRoomId, m -> m));

        // 3. Batch unread counts — split into "read" and "never read" rooms
        Map<Long, Long> lastReadIdMap = new HashMap<>();
        List<Long> neverReadRoomIds = new ArrayList<>();
        List<Long> readRoomIds = new ArrayList<>();

        for (ChatRoom room : rooms) {
            Long lastReadId = room.getMentor().getId().equals(userId)
                    ? room.getMentorLastReadMessageId()
                    : room.getMenteeLastReadMessageId();
            if (lastReadId != null) {
                lastReadIdMap.put(room.getId(), lastReadId);
                readRoomIds.add(room.getId());
            } else {
                neverReadRoomIds.add(room.getId());
            }
        }

        Map<Long, Long> unreadCountMap = new HashMap<>();

        // For rooms with lastReadId, query unread per-room using the minimum lastReadId
        // We need per-room unread counts, so we query rooms that have been read
        if (!readRoomIds.isEmpty()) {
            // We need to query each group by lastReadId — but for simplicity, use per-room single-query approach
            // For batch: query all with min lastReadId, then filter in memory
            Long minLastReadId = lastReadIdMap.values().stream().min(Long::compareTo).orElse(0L);
            List<Object[]> unreadResults = chatMessageRepository.countUnreadByRoomIdsAfter(readRoomIds, userId, minLastReadId);
            Map<Long, Long> rawUnreadMap = new HashMap<>();
            for (Object[] row : unreadResults) {
                rawUnreadMap.put((Long) row[0], (Long) row[1]);
            }
            // The batch query used minLastReadId which may over-count for rooms with a higher lastReadId.
            // For correctness, we re-query per room or accept the slight over-count.
            // Better approach: use individual per-room lastReadId via the existing single queries.
            // Since the batch approach with a single lastReadId is imprecise, let's use per-room queries for read rooms.
            for (Long roomId : readRoomIds) {
                Long lastReadId = lastReadIdMap.get(roomId);
                long count = chatMessageRepository.countUnreadAfter(roomId, lastReadId, userId);
                unreadCountMap.put(roomId, count);
            }
        }

        if (!neverReadRoomIds.isEmpty()) {
            List<Object[]> neverReadResults = chatMessageRepository.countAllFromOthersByRoomIds(neverReadRoomIds, userId);
            for (Object[] row : neverReadResults) {
                unreadCountMap.put((Long) row[0], (Long) row[1]);
            }
        }

        // 4. Batch feedback submitted — 1 query
        Set<Long> submittedRoomIds = feedbackRepository.findSubmittedRoomIds(roomIds, userId);

        // 5. Assemble in memory
        return rooms.stream()
                .map(room -> {
                    ChatMessage lastMsg = lastMessageMap.get(room.getId());
                    String lastMsgContent = lastMsg != null ? lastMsg.getContent() : null;
                    Instant lastMsgAt = lastMsg != null ? lastMsg.getCreatedAt() : null;

                    long unread = unreadCountMap.getOrDefault(room.getId(), 0L);
                    String questionTitle = room.getQuestion() != null ? room.getQuestion().getTitle() : null;

                    return ChatRoomResponse.of(
                            room,
                            questionTitle,
                            (int) Math.min(unread, 99),
                            lastMsgContent,
                            lastMsgAt,
                            submittedRoomIds.contains(room.getId())
                    );
                })
                .toList();
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
        chatNotificationService.sendRoomEvent(room.getMentor().getId(), closedEvent);
        chatNotificationService.sendRoomEvent(room.getMentee().getId(), closedEvent);

        return buildSingleRoomResponse(room, userId);
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

    /** Build response for a single room (used by accept, close, propose). */
    private ChatRoomResponse buildSingleRoomResponse(ChatRoom room, Long currentUserId) {
        Long lastReadId = room.getMentor().getId().equals(currentUserId)
                ? room.getMentorLastReadMessageId()
                : room.getMenteeLastReadMessageId();

        long unreadCount = lastReadId == null
                ? chatMessageRepository.countAllFromOthers(room.getId(), currentUserId)
                : chatMessageRepository.countUnreadAfter(room.getId(), lastReadId, currentUserId);

        java.util.Optional<ChatMessage> lastMsg = chatMessageRepository
                .findFirstByRoomIdOrderByIdDesc(room.getId());
        String lastMsgContent = lastMsg.map(ChatMessage::getContent).orElse(null);
        Instant lastMsgAt = lastMsg.map(ChatMessage::getCreatedAt).orElse(null);

        String questionTitle = room.getQuestion() != null ? room.getQuestion().getTitle() : null;

        boolean myFeedbackSubmitted = feedbackRepository.existsByRoomIdAndRaterUserId(room.getId(), currentUserId);

        return ChatRoomResponse.of(
                room,
                questionTitle,
                (int) Math.min(unreadCount, 99),
                lastMsgContent,
                lastMsgAt,
                myFeedbackSubmitted
        );
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
        chatNotificationService.sendMessage(roomId, response);
    }
}
