package me.iamhardyha.bugbuddy.xp.dto;

import me.iamhardyha.bugbuddy.model.entity.XpEvent;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;

import java.time.Instant;

public record XpEventResponse(
        Long id,
        XpEventType eventType,
        ReferenceType refType,
        Long refId,
        int deltaXp,
        Instant createdAt
) {
    public static XpEventResponse of(XpEvent event) {
        return new XpEventResponse(
                event.getId(),
                event.getEventType(),
                event.getRefType(),
                event.getRefId(),
                event.getDeltaXp(),
                event.getCreatedAt()
        );
    }
}
