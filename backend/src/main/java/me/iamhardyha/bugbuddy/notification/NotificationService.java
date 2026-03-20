package me.iamhardyha.bugbuddy.notification;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.chat.ChatRoomRepository;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.entity.ChatRoom;
import me.iamhardyha.bugbuddy.model.entity.Notification;
import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.notification.dto.NotificationResponse;
import me.iamhardyha.bugbuddy.notification.event.NotificationEvent;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void create(NotificationEvent event) {
        // Self-notification guard
        if (event.triggerUserId().equals(event.recipientUserId())) {
            return;
        }

        // Duplicate guard
        boolean exists = notificationRepository.existsByTriggerUserIdAndRefTypeAndRefIdAndType(
                event.triggerUserId(), event.refType(), event.refId(), event.notificationType());
        if (exists) {
            return;
        }

        Notification notification = new Notification();
        notification.setUserId(event.recipientUserId());
        notification.setType(event.notificationType());
        notification.setRefType(event.refType());
        notification.setRefId(event.refId());
        notification.setTriggerUserId(event.triggerUserId());
        notificationRepository.save(notification);
    }

    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        // 1) Fetch notifications page
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        // 2) If empty, return mapped empty page
        if (notifications.isEmpty()) {
            return notifications.map(n -> NotificationResponse.of(n, null, null));
        }

        // 3) Batch fetch trigger user nicknames
        List<Long> triggerUserIds = notifications.stream()
                .map(Notification::getTriggerUserId)
                .distinct()
                .toList();

        Map<Long, String> nicknameMap = userRepository.findAllById(triggerUserIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getNickname));

        // 4) Group refIds by refType and batch fetch titles (separate maps to avoid key collision)
        Map<Long, String> questionTitleMap = new HashMap<>();
        Map<Long, String> answerTitleMap = new HashMap<>();
        Map<Long, String> chatRoomTitleMap = new HashMap<>();

        List<Long> questionIds = notifications.stream()
                .filter(n -> n.getRefType() == ReferenceType.QUESTION)
                .map(Notification::getRefId)
                .distinct()
                .toList();

        List<Long> answerIds = notifications.stream()
                .filter(n -> n.getRefType() == ReferenceType.ANSWER)
                .map(Notification::getRefId)
                .distinct()
                .toList();

        List<Long> chatRoomIds = notifications.stream()
                .filter(n -> n.getRefType() == ReferenceType.CHAT_ROOM)
                .map(Notification::getRefId)
                .distinct()
                .toList();

        // 5) Guard each batch query with isEmpty() to avoid empty IN() clause on MySQL
        if (!questionIds.isEmpty()) {
            questionRepository.findAllById(questionIds).forEach(q ->
                    questionTitleMap.put(q.getId(), q.getTitle()));
        }

        if (!answerIds.isEmpty()) {
            answerRepository.findAllActiveByIds(answerIds).forEach(a ->
                    answerTitleMap.put(a.getId(), a.getQuestion().getTitle()));
        }

        if (!chatRoomIds.isEmpty()) {
            chatRoomRepository.findAllActiveByIds(chatRoomIds).forEach(r ->
                    chatRoomTitleMap.put(r.getId(), r.getQuestion() != null ? r.getQuestion().getTitle() : null));
        }

        // 6) Map notifications to response DTOs
        return notifications.map(n -> {
            String nickname = nicknameMap.get(n.getTriggerUserId());
            String title = switch (n.getRefType()) {
                case QUESTION -> questionTitleMap.get(n.getRefId());
                case ANSWER -> answerTitleMap.get(n.getRefId());
                case CHAT_ROOM -> chatRoomTitleMap.get(n.getRefId());
                default -> null;
            };
            return NotificationResponse.of(n, nickname, title);
        });
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!notification.getUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.NOTIFICATION_ACCESS_DENIED);
        }

        notification.setRead(true);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
