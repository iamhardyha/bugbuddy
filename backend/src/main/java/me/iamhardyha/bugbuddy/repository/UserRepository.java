package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByOauthProviderAndOauthSubject(String provider, String subject);

    boolean existsByNickname(String nickname);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE UserEntity u SET u.xp = u.xp + :delta WHERE u.id = :userId")
    void addXp(@Param("userId") Long userId, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE UserEntity u SET u.mentorAvgRating = (SELECT COALESCE(AVG(f.rating), 0) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentor.id = :userId)), u.mentorRatingCount = (SELECT COUNT(f) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentor.id = :userId)) WHERE u.id = :userId")
    void recalculateMentorRating(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserEntity u SET u.menteeAvgRating = (SELECT COALESCE(AVG(f.rating), 0) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentee.id = :userId)), u.menteeRatingCount = (SELECT COUNT(f) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentee.id = :userId)) WHERE u.id = :userId")
    void recalculateMenteeRating(@Param("userId") Long userId);
}
