package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.model.entity.ChatRoom;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT r FROM ChatRoom r WHERE r.id = :id")
    Optional<ChatRoom> findActiveById(@Param("id") Long id);

    @Query("SELECT r FROM ChatRoom r WHERE (r.mentorUserId = :userId OR r.menteeUserId = :userId) ORDER BY r.createdAt DESC")
    List<ChatRoom> findActiveByUserId(@Param("userId") Long userId);

    boolean existsByMentorUserIdAndMenteeUserIdAndQuestionIdAndStatusNot(
            Long mentorUserId, Long menteeUserId, Long questionId, ChatRoomStatus status);
}
