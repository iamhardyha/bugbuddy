package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.model.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.roomId = :roomId AND m.deletedAt IS NULL ORDER BY m.createdAt ASC")
    Page<ChatMessage> findActiveByRoomId(@Param("roomId") Long roomId, Pageable pageable);

    /** 채팅방의 마지막 메시지 (삭제 제외). */
    Optional<ChatMessage> findFirstByRoomIdAndDeletedAtIsNullOrderByIdDesc(Long roomId);

    /** lastReadMessageId 이후 상대방이 보낸 미읽음 메시지 수. */
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.roomId = :roomId AND m.deletedAt IS NULL AND m.id > :lastReadId AND m.senderUserId != :userId")
    long countUnreadAfter(@Param("roomId") Long roomId, @Param("lastReadId") Long lastReadId, @Param("userId") Long userId);

    /** 한 번도 읽지 않은 경우: 상대방이 보낸 전체 메시지 수. */
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.roomId = :roomId AND m.deletedAt IS NULL AND m.senderUserId != :userId")
    long countAllFromOthers(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
