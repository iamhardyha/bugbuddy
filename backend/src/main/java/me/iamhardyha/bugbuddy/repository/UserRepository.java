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

    @Query(value = "SELECT u FROM UserEntity u " +
            "WHERE u.mentorStatus = me.iamhardyha.bugbuddy.model.enums.MentorStatus.APPROVED " +
            "  AND u.deactivatedAt IS NULL " +
            "  AND (:keyword IS NULL " +
            "       OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "       OR LOWER(COALESCE(u.bio, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))",
            countQuery = "SELECT COUNT(u) FROM UserEntity u " +
            "WHERE u.mentorStatus = me.iamhardyha.bugbuddy.model.enums.MentorStatus.APPROVED " +
            "  AND u.deactivatedAt IS NULL " +
            "  AND (:keyword IS NULL " +
            "       OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "       OR LOWER(COALESCE(u.bio, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<UserEntity> findApprovedMentors(@Param("keyword") String keyword, Pageable pageable);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE UserEntity u SET u.xp = u.xp + :delta WHERE u.id = :userId")
    void addXp(@Param("userId") Long userId, @Param("delta") int delta);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "UPDATE users SET xp = xp + :delta, " +
            "level = CASE " +
            "  WHEN xp + :delta >= 10000 THEN 10 " +
            "  WHEN xp + :delta >= 6000 THEN 9 " +
            "  WHEN xp + :delta >= 4000 THEN 8 " +
            "  WHEN xp + :delta >= 2500 THEN 7 " +
            "  WHEN xp + :delta >= 1500 THEN 6 " +
            "  WHEN xp + :delta >= 900 THEN 5 " +
            "  WHEN xp + :delta >= 500 THEN 4 " +
            "  WHEN xp + :delta >= 250 THEN 3 " +
            "  WHEN xp + :delta >= 100 THEN 2 " +
            "  ELSE 1 " +
            "END " +
            "WHERE id = :userId", nativeQuery = true)
    void addXpAndRecalculateLevel(@Param("userId") Long userId, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE UserEntity u SET u.mentorAvgRating = (SELECT COALESCE(AVG(f.rating), 0) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentor.id = :userId)), u.mentorRatingCount = (SELECT COUNT(f) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentor.id = :userId)) WHERE u.id = :userId")
    void recalculateMentorRating(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserEntity u SET u.menteeAvgRating = (SELECT COALESCE(AVG(f.rating), 0) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentee.id = :userId)), u.menteeRatingCount = (SELECT COUNT(f) FROM ChatRoomFeedback f WHERE f.roomId IN (SELECT r.id FROM ChatRoom r WHERE r.mentee.id = :userId)) WHERE u.id = :userId")
    void recalculateMenteeRating(@Param("userId") Long userId);
}
