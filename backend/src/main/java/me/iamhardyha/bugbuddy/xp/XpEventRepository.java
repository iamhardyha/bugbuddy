package me.iamhardyha.bugbuddy.xp;

import me.iamhardyha.bugbuddy.model.entity.XpEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface XpEventRepository extends JpaRepository<XpEvent, Long> {

    Page<XpEvent> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
