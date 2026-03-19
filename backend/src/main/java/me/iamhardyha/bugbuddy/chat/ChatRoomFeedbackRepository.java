package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.model.entity.ChatRoomFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface ChatRoomFeedbackRepository extends JpaRepository<ChatRoomFeedback, Long> {

    boolean existsByRoomIdAndRaterUserId(Long roomId, Long raterUserId);

    @Query("SELECT f FROM ChatRoomFeedback f WHERE f.roomId = :roomId")
    List<ChatRoomFeedback> findActiveByRoomId(@Param("roomId") Long roomId);

    /** Batch: room IDs where the given user has already submitted feedback. */
    @Query("SELECT f.roomId FROM ChatRoomFeedback f WHERE f.roomId IN :roomIds AND f.raterUserId = :userId")
    Set<Long> findSubmittedRoomIds(@Param("roomIds") Collection<Long> roomIds, @Param("userId") Long userId);
}
