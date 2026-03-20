package me.iamhardyha.bugbuddy.feed;

import me.iamhardyha.bugbuddy.model.entity.FeedLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FeedLikeRepository extends JpaRepository<FeedLike, Long> {

    /** Include soft-deleted — for find-and-restore toggle pattern */
    @Query(value = "SELECT * FROM feed_likes WHERE feed_id = :feedId AND user_id = :userId LIMIT 1", nativeQuery = true)
    Optional<FeedLike> findByFeedIdAndUserId(@Param("feedId") Long feedId, @Param("userId") Long userId);

    /** Active like check (respects @SQLRestriction) */
    boolean existsByFeedIdAndUserId(Long feedId, Long userId);

    /** Batch check for feed list — which feeds has user liked */
    @Query("SELECT fl.feedId FROM FeedLike fl WHERE fl.feedId IN :feedIds AND fl.userId = :userId")
    Set<Long> findLikedFeedIds(@Param("feedIds") List<Long> feedIds, @Param("userId") Long userId);
}
