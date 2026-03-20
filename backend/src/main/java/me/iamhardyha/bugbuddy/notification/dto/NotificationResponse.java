package me.iamhardyha.bugbuddy.notification.dto;

import me.iamhardyha.bugbuddy.model.entity.Notification;
import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        ReferenceType refType,
        Long refId,
        String triggerUserNickname,
        String targetTitle,
        boolean isRead,
        Instant createdAt
) {
    public static NotificationResponse of(
            Notification n, String triggerUserNickname, String targetTitle) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getRefType(), n.getRefId(),
                triggerUserNickname, targetTitle,
                n.isRead(), n.getCreatedAt()
        );
    }
}
