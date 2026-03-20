package me.iamhardyha.bugbuddy.notification;

import me.iamhardyha.bugbuddy.model.entity.Notification;
import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId);

    boolean existsByTriggerUserIdAndRefTypeAndRefIdAndType(
            Long triggerUserId, ReferenceType refType, Long refId, NotificationType type);
}
