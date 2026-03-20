package me.iamhardyha.bugbuddy.feed;

import me.iamhardyha.bugbuddy.model.entity.FeedComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedCommentRepository extends JpaRepository<FeedComment, Long> {
    Page<FeedComment> findAllByFeedIdOrderByCreatedAtAsc(Long feedId, Pageable pageable);
}
