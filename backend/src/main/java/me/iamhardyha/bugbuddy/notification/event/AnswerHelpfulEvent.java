package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public record AnswerHelpfulEvent(
        Long triggerUserId,
        Long recipientUserId,
        Long refId
) implements NotificationEvent {
    @Override public NotificationType notificationType() { return NotificationType.HELPFUL_RECEIVED; }
    @Override public ReferenceType refType() { return ReferenceType.ANSWER; }
}
