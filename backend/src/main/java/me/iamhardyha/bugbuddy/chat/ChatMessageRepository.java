package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.model.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.roomId = :roomId AND m.deletedAt IS NULL ORDER BY m.createdAt ASC")
    Page<ChatMessage> findActiveByRoomId(@Param("roomId") Long roomId, Pageable pageable);
}
