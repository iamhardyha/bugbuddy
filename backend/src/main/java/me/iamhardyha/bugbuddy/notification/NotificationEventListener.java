package me.iamhardyha.bugbuddy.notification;

import me.iamhardyha.bugbuddy.notification.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(NotificationEvent event) {
        try {
            notificationService.create(event);
        } catch (Exception e) {
            log.error("알림 생성 실패: type={}, triggerUser={}, recipient={}, ref={}/{}",
                    event.notificationType(), event.triggerUserId(),
                    event.recipientUserId(), event.refType(), event.refId(), e);
        }
    }
}
