package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public interface NotificationEvent {
    Long triggerUserId();
    Long recipientUserId();
    NotificationType notificationType();
    ReferenceType refType();
    Long refId();
}
