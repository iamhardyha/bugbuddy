package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public record MentorApprovedEvent(
        Long triggerUserId,
        Long recipientUserId,
        Long refId
) implements NotificationEvent {
    @Override public NotificationType notificationType() { return NotificationType.MENTOR_APPROVED; }
    @Override public ReferenceType refType() { return ReferenceType.USER; }
}
