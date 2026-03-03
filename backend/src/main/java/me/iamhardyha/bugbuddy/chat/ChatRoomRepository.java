package me.iamhardyha.bugbuddy.chat;

import me.iamhardyha.bugbuddy.model.entity.ChatRoom;
import me.iamhardyha.bugbuddy.model.enums.ChatRoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT r FROM ChatRoom r WHERE r.id = :id AND r.deletedAt IS NULL")
    Optional<ChatRoom> findActiveById(@Param("id") Long id);

    @Query("SELECT r FROM ChatRoom r WHERE (r.mentorUserId = :userId OR r.menteeUserId = :userId) AND r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    Page<ChatRoom> findActiveByUserId(@Param("userId") Long userId, Pageable pageable);

    boolean existsByMentorUserIdAndMenteeUserIdAndQuestionIdAndStatusNot(
            Long mentorUserId, Long menteeUserId, Long questionId, ChatRoomStatus status);
}
