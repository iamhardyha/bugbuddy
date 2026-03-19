package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.model.entity.ChatRoomFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRoomFeedbackRepository extends JpaRepository<ChatRoomFeedback, Long> {

    boolean existsByRoomIdAndRaterUserId(Long roomId, Long raterUserId);

    @Query("SELECT f FROM ChatRoomFeedback f WHERE f.roomId = :roomId")
    List<ChatRoomFeedback> findActiveByRoomId(@Param("roomId") Long roomId);
}
