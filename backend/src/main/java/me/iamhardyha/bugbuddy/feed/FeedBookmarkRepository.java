package me.iamhardyha.bugbuddy.feed;

import me.iamhardyha.bugbuddy.model.entity.FeedBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FeedBookmarkRepository extends JpaRepository<FeedBookmark, Long> {

    Optional<FeedBookmark> findByFeedIdAndUserId(Long feedId, Long userId);

    boolean existsByFeedIdAndUserId(Long feedId, Long userId);

    @Query("SELECT fb.feedId FROM FeedBookmark fb WHERE fb.feedId IN :feedIds AND fb.userId = :userId")
    Set<Long> findBookmarkedFeedIds(@Param("feedIds") List<Long> feedIds, @Param("userId") Long userId);

    Page<FeedBookmark> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
