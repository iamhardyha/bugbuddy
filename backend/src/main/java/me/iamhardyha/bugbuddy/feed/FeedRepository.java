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

    Page<TechFeed> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<TechFeed> findAllByCategoryOrderByCreatedAtDesc(FeedCategory category, Pageable pageable);

    Page<TechFeed> findAllByOrderByLikeCountDescCreatedAtDesc(Pageable pageable);

    Page<TechFeed> findAllByCategoryOrderByLikeCountDescCreatedAtDesc(FeedCategory category, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TechFeed f SET f.likeCount = f.likeCount + :delta WHERE f.id = :id")
    void updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TechFeed f SET f.commentCount = f.commentCount + :delta WHERE f.id = :id")
    void updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TechFeed f SET f.bookmarkCount = f.bookmarkCount + :delta WHERE f.id = :id")
    void updateBookmarkCount(@Param("id") Long id, @Param("delta") int delta);
}
