package me.iamhardyha.bugbuddy.feed;

import me.iamhardyha.bugbuddy.model.entity.TechFeed;
import me.iamhardyha.bugbuddy.model.enums.FeedCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeedRepository extends JpaRepository<TechFeed, Long> {

    Page<TechFeed> findAllByHiddenFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<TechFeed> findAllByHiddenFalseAndCategoryOrderByCreatedAtDesc(FeedCategory category, Pageable pageable);

    Page<TechFeed> findAllByHiddenFalseOrderByLikeCountDescCreatedAtDesc(Pageable pageable);

    Page<TechFeed> findAllByHiddenFalseAndCategoryOrderByLikeCountDescCreatedAtDesc(FeedCategory category, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TechFeed f SET f.likeCount = f.likeCount + :delta WHERE f.id = :id")
    void updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TechFeed f SET f.commentCount = f.commentCount + :delta WHERE f.id = :id")
    void updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TechFeed f SET f.bookmarkCount = f.bookmarkCount + :delta WHERE f.id = :id")
    void updateBookmarkCount(@Param("id") Long id, @Param("delta") int delta);

    // ── Admin native queries (bypass @SQLRestriction) ──

    @Query(value = "SELECT f.id, f.url, f.title, f.description, f.category, f.comment, " +
                   "f.like_count, f.comment_count, f.hidden, f.deleted_at, f.created_at, " +
                   "f.author_user_id, u.nickname AS author_nickname " +
                   "FROM tech_feeds f JOIN users u ON f.author_user_id = u.id " +
                   "ORDER BY f.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM tech_feeds",
           nativeQuery = true)
    Page<Object[]> findAllForAdmin(Pageable pageable);

    @Modifying
    @Query(value = "UPDATE tech_feeds SET hidden = :hidden WHERE id = :id", nativeQuery = true)
    void updateHidden(@Param("id") Long id, @Param("hidden") boolean hidden);

    @Modifying
    @Query(value = "UPDATE tech_feeds SET hidden = false, deleted_at = NULL WHERE id = :id", nativeQuery = true)
    void restoreById(@Param("id") Long id);

    @Modifying
    @Query(value = "UPDATE tech_feeds SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL", nativeQuery = true)
    void softDeleteById(@Param("id") Long id);
}
