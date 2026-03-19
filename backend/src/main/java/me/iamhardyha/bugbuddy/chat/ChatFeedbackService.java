package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.chat.dto.ChatFeedbackRequest;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.ChatRoom;
import me.iamhardyha.bugbuddy.model.entity.ChatRoomFeedback;
import me.iamhardyha.bugbuddy.model.enums.ChatRoleType;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.xp.XpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatFeedbackService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final XpService xpService;

    /** 피드백 제출 + 평점 재계산 (DB-level atomic) + XP 이벤트. */
    @Transactional
    public void submitFeedback(Long roomId, Long userId, ChatFeedbackRequest request) {
        ChatRoom room = chatRoomRepository.findActiveById(roomId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        assertRoomAccess(room, userId);

        if (room.getStatus() != ChatRoomStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_NOT_OPEN);
        }
        if (feedbackRepository.existsByRoomIdAndRaterUserId(roomId, userId)) {
            throw new BugBuddyException(ErrorCode.CHAT_FEEDBACK_ALREADY_EXISTS);
        }

        boolean raterIsMentee = room.getMentee().getId().equals(userId);
        ChatRoleType raterRole = raterIsMentee ? ChatRoleType.MENTEE : ChatRoleType.MENTOR;

        ChatRoomFeedback feedback = new ChatRoomFeedback();
        feedback.setRoomId(roomId);
        feedback.setRaterUserId(userId);
        feedback.setRaterRole(raterRole);
        feedback.setRating(request.rating());
        feedback.setComment(request.comment());
        feedbackRepository.save(feedback);

        if (raterIsMentee) {
            // 멘티 → 멘토 평점 (DB-level atomic recalculation)
            userRepository.recalculateMentorRating(room.getMentor().getId());
            grantChatFeedbackXp(room.getMentor().getId(), roomId, request.rating());
        } else {
            // 멘토 → 멘티 평점 (DB-level atomic recalculation)
            userRepository.recalculateMenteeRating(room.getMentee().getId());
        }
    }

    private void assertRoomAccess(ChatRoom room, Long userId) {
        if (!room.getMentor().getId().equals(userId) && !room.getMentee().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
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
}
