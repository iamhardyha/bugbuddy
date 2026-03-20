package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public record ChatRequestedEvent(
        Long triggerUserId,
        Long recipientUserId,
        Long refId
) implements NotificationEvent {
    @Override public NotificationType notificationType() { return NotificationType.CHAT_REQUESTED; }
    @Override public ReferenceType refType() { return ReferenceType.CHAT_ROOM; }
}
