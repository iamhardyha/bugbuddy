package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public record AnswerAcceptedEvent(
        Long triggerUserId,
        Long recipientUserId,
        Long refId
) implements NotificationEvent {
    @Override public NotificationType notificationType() { return NotificationType.ANSWER_ACCEPTED; }
    @Override public ReferenceType refType() { return ReferenceType.ANSWER; }
}
