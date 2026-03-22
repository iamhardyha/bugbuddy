package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByOauthProviderAndOauthSubject(String provider, String subject);

    boolean existsByNickname(String nickname);

    @Query(value = "SELECT u FROM UserEntity u WHERE " +
            "(:keyword IS NULL OR u.nickname LIKE CONCAT('%', :keyword, '%') OR u.email LIKE CONCAT('%', :keyword, '%')) " +
            "AND (:mentorStatus IS NULL OR u.mentorStatus = :mentorStatus) " +
            "AND (:suspended IS NULL OR " +
            "     (:suspended = true AND u.suspendedUntil IS NOT NULL AND u.suspendedUntil > CURRENT_TIMESTAMP) OR " +
            "     (:suspended = false AND (u.suspendedUntil IS NULL OR u.suspendedUntil <= CURRENT_TIMESTAMP)))",
            countQuery = "SELECT COUNT(u) FROM UserEntity u WHERE " +
            "(:keyword IS NULL OR u.nickname LIKE CONCAT('%', :keyword, '%') OR u.email LIKE CONCAT('%', :keyword, '%')) " +
            "AND (:mentorStatus IS NULL OR u.mentorStatus = :mentorStatus) " +
            "AND (:suspended IS NULL OR " +
            "     (:suspended = true AND u.suspendedUntil IS NOT NULL AND u.suspendedUntil > CURRENT_TIMESTAMP) OR " +
            "     (:suspended = false AND (u.suspendedUntil IS NULL OR u.suspendedUntil <= CURRENT_TIMESTAMP)))")
    Page<UserEntity> findAllForAdmin(
            @Param("keyword") String keyword,
            @Param("mentorStatus") MentorStatus mentorStatus,
            @Param("suspended") Boolean suspended,
            Pageable pageable);

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
