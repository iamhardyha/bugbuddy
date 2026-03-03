package me.iamhardyha.bugbuddy.xp;

import me.iamhardyha.bugbuddy.model.entity.XpEvent;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface XpEventRepository extends JpaRepository<XpEvent, Long> {

    Page<XpEvent> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndEventTypeAndDeltaXp(Long userId, XpEventType eventType, int deltaXp);
}
