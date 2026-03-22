package me.iamhardyha.bugbuddy.feed;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.feed.dto.AdminFeedResponse;
import me.iamhardyha.bugbuddy.feed.dto.FeedCommentCreateRequest;
import me.iamhardyha.bugbuddy.feed.dto.FeedCommentResponse;
import me.iamhardyha.bugbuddy.feed.dto.FeedCreateRequest;
import me.iamhardyha.bugbuddy.feed.dto.FeedResponse;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.FeedBookmark;
import me.iamhardyha.bugbuddy.model.entity.FeedComment;
import me.iamhardyha.bugbuddy.model.entity.FeedLike;
import me.iamhardyha.bugbuddy.model.entity.TechFeed;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.FeedCategory;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.notification.event.FeedCommentedEvent;
import me.iamhardyha.bugbuddy.notification.event.FeedLikedEvent;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedService {

    private final FeedRepository feedRepository;
    private final FeedCommentRepository feedCommentRepository;
    private final FeedLikeRepository feedLikeRepository;
    private final FeedBookmarkRepository feedBookmarkRepository;
    private final UserRepository userRepository;
    private final OgMetaParser ogMetaParser;
    private final XpService xpService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public FeedResponse create(Long userId, FeedCreateRequest request) {
        OgMetaParser.OgMeta og = ogMetaParser.parse(request.url());

        TechFeed feed = new TechFeed();
        feed.setAuthorUserId(userId);
        feed.setUrl(request.url());
        feed.setTitle(og.title());
        feed.setDescription(og.description());
        feed.setOgImageUrl(og.ogImageUrl());
        feed.setDomain(og.domain());
        feed.setCategory(request.category());
        feed.setComment(request.comment());

        TechFeed saved = feedRepository.save(feed);

        xpService.grantXp(userId, XpEventType.FEED_CREATED, ReferenceType.FEED, saved.getId(), 3);

        String nickname = getUserNickname(userId);
        return FeedResponse.of(saved, nickname, false, false);
    }

    public Page<FeedResponse> getFeeds(FeedCategory category, String sort, Pageable pageable, Long currentUserId) {
        Page<TechFeed> feedPage = fetchFeedPage(category, sort, pageable);

        if (feedPage.isEmpty()) {
            return feedPage.map(f -> FeedResponse.of(f, null, false, false));
        }

        List<Long> userIds = feedPage.stream()
                .map(TechFeed::getAuthorUserId)
                .distinct()
                .toList();
        Map<Long, String> nicknameMap = buildNicknameMap(userIds);

        List<Long> feedIds = feedPage.stream().map(TechFeed::getId).toList();
        Set<Long> myLikedIds = currentUserId != null
                ? feedLikeRepository.findLikedFeedIds(feedIds, currentUserId)
                : Collections.emptySet();
        Set<Long> myBookmarkedIds = currentUserId != null
                ? feedBookmarkRepository.findBookmarkedFeedIds(feedIds, currentUserId)
                : Collections.emptySet();

        return feedPage.map(f -> FeedResponse.of(
                f,
                nicknameMap.get(f.getAuthorUserId()),
                myLikedIds.contains(f.getId()),
                myBookmarkedIds.contains(f.getId())
        ));
    }

    public FeedResponse getFeed(Long feedId, Long currentUserId) {
        TechFeed feed = findFeedOrThrow(feedId);
        String nickname = getUserNickname(feed.getAuthorUserId());

        boolean myLiked = false;
        boolean myBookmarked = false;
        if (currentUserId != null) {
            myLiked = feedLikeRepository.existsByFeedIdAndUserId(feedId, currentUserId);
            myBookmarked = feedBookmarkRepository.existsByFeedIdAndUserId(feedId, currentUserId);
        }

        return FeedResponse.of(feed, nickname, myLiked, myBookmarked);
    }

    @Transactional
    public void delete(Long feedId, Long userId) {
        TechFeed feed = findFeedOrThrow(feedId);
        if (!feed.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.FEED_FORBIDDEN);
        }
        feed.softDelete();
    }

    @Transactional
    public void like(Long feedId, Long userId) {
        TechFeed feed = findFeedOrThrow(feedId);

        if (feed.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.FEED_SELF_LIKE);
        }

        // Native query includes soft-deleted rows
        var existingLike = feedLikeRepository.findByFeedIdAndUserId(feedId, userId);

        if (existingLike.isPresent()) {
            FeedLike like = existingLike.get();
            if (!like.isDeleted()) {
                throw new BugBuddyException(ErrorCode.FEED_ALREADY_LIKED);
            }
            // Restore soft-deleted like
            like.setDeletedAt(null);
        } else {
            FeedLike like = new FeedLike();
            like.setFeedId(feedId);
            like.setUserId(userId);
            feedLikeRepository.save(like);
        }

        feedRepository.updateLikeCount(feedId, 1);
        xpService.grantXp(feed.getAuthorUserId(), XpEventType.FEED_LIKED_RECEIVED, ReferenceType.FEED, feedId, 2);
        eventPublisher.publishEvent(new FeedLikedEvent(userId, feed.getAuthorUserId(), feedId));
    }

    @Transactional
    public void unlike(Long feedId, Long userId) {
        // Native query includes soft-deleted rows
        FeedLike like = feedLikeRepository.findByFeedIdAndUserId(feedId, userId)
                .filter(fl -> !fl.isDeleted())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.FEED_LIKE_NOT_FOUND));

        like.softDelete();
        feedRepository.updateLikeCount(feedId, -1);
    }

    @Transactional
    public void bookmark(Long feedId, Long userId) {
        findFeedOrThrow(feedId);

        if (feedBookmarkRepository.existsByFeedIdAndUserId(feedId, userId)) {
            throw new BugBuddyException(ErrorCode.FEED_ALREADY_BOOKMARKED);
        }

        FeedBookmark bookmark = new FeedBookmark();
        bookmark.setFeedId(feedId);
        bookmark.setUserId(userId);
        feedBookmarkRepository.save(bookmark);

        feedRepository.updateBookmarkCount(feedId, 1);
    }

    @Transactional
    public void removeBookmark(Long feedId, Long userId) {
        FeedBookmark bookmark = feedBookmarkRepository.findByFeedIdAndUserId(feedId, userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.FEED_BOOKMARK_NOT_FOUND));

        feedBookmarkRepository.delete(bookmark);
        feedRepository.updateBookmarkCount(feedId, -1);
    }

    public Page<FeedResponse> getBookmarks(Long userId, Pageable pageable) {
        Page<FeedBookmark> bookmarkPage = feedBookmarkRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);

        if (bookmarkPage.isEmpty()) {
            return bookmarkPage.map(b -> null);
        }

        List<Long> feedIds = bookmarkPage.stream().map(FeedBookmark::getFeedId).toList();
        Map<Long, TechFeed> feedMap = feedRepository.findAllById(feedIds).stream()
                .collect(Collectors.toMap(TechFeed::getId, f -> f));

        List<Long> userIds = feedMap.values().stream()
                .map(TechFeed::getAuthorUserId)
                .distinct()
                .toList();
        Map<Long, String> nicknameMap = buildNicknameMap(userIds);

        Set<Long> myLikedIds = feedLikeRepository.findLikedFeedIds(feedIds, userId);

        return bookmarkPage.map(b -> {
            TechFeed feed = feedMap.get(b.getFeedId());
            if (feed == null) {
                return null;
            }
            return FeedResponse.of(
                    feed,
                    nicknameMap.get(feed.getAuthorUserId()),
                    myLikedIds.contains(feed.getId()),
                    true
            );
        });
    }

    @Transactional
    public FeedCommentResponse createComment(Long feedId, Long userId, FeedCommentCreateRequest request) {
        TechFeed feed = findFeedOrThrow(feedId);

        FeedComment comment = new FeedComment();
        comment.setFeedId(feedId);
        comment.setAuthorUserId(userId);
        comment.setBody(request.body());
        FeedComment saved = feedCommentRepository.save(comment);

        feedRepository.updateCommentCount(feedId, 1);
        eventPublisher.publishEvent(new FeedCommentedEvent(userId, feed.getAuthorUserId(), feedId));

        String nickname = getUserNickname(userId);
        return FeedCommentResponse.of(saved, nickname);
    }

    public Page<FeedCommentResponse> getComments(Long feedId, Pageable pageable) {
        Page<FeedComment> commentPage = feedCommentRepository.findAllByFeedIdOrderByCreatedAtAsc(feedId, pageable);

        if (commentPage.isEmpty()) {
            return commentPage.map(c -> FeedCommentResponse.of(c, null));
        }

        List<Long> userIds = commentPage.stream()
                .map(FeedComment::getAuthorUserId)
                .distinct()
                .toList();
        Map<Long, String> nicknameMap = buildNicknameMap(userIds);

        return commentPage.map(c -> FeedCommentResponse.of(c, nicknameMap.get(c.getAuthorUserId())));
    }

    @Transactional
    public void deleteComment(Long feedId, Long commentId, Long userId) {
        FeedComment comment = feedCommentRepository.findById(commentId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.FEED_COMMENT_NOT_FOUND));

        if (!comment.getFeedId().equals(feedId)) {
            throw new BugBuddyException(ErrorCode.FEED_COMMENT_NOT_FOUND);
        }

        if (!comment.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.FEED_COMMENT_FORBIDDEN);
        }

        comment.softDelete();
        feedRepository.updateCommentCount(feedId, -1);
    }

    // ── Private helpers ──

    private TechFeed findFeedOrThrow(Long feedId) {
        return feedRepository.findById(feedId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.FEED_NOT_FOUND));
    }

    private String getUserNickname(Long userId) {
        return userRepository.findById(userId)
                .map(UserEntity::getNickname)
                .orElse(null);
    }

    private Map<Long, String> buildNicknameMap(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getNickname));
    }

    private Page<TechFeed> fetchFeedPage(FeedCategory category, String sort, Pageable pageable) {
        boolean sortByLikes = "likeCount".equals(sort);

        if (category == null) {
            return sortByLikes
                    ? feedRepository.findAllByHiddenFalseOrderByLikeCountDescCreatedAtDesc(pageable)
                    : feedRepository.findAllByHiddenFalseOrderByCreatedAtDesc(pageable);
        }
        return sortByLikes
                ? feedRepository.findAllByHiddenFalseAndCategoryOrderByLikeCountDescCreatedAtDesc(category, pageable)
                : feedRepository.findAllByHiddenFalseAndCategoryOrderByCreatedAtDesc(category, pageable);
    }

    // ── Admin operations ──

    public Page<AdminFeedResponse> findAllForAdmin(Pageable pageable) {
        return feedRepository.findAllForAdmin(pageable)
                .map(this::mapToAdminFeedResponse);
    }

    @Transactional
    public void adminHide(Long feedId) {
        feedRepository.updateHidden(feedId, true);
    }

    @Transactional
    public void adminRestore(Long feedId) {
        feedRepository.restoreById(feedId);
    }

    @Transactional
    public void adminDelete(Long feedId) {
        feedRepository.softDeleteById(feedId);
    }

    private AdminFeedResponse mapToAdminFeedResponse(Object[] row) {
        return new AdminFeedResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (String) row[2],
                (String) row[3],
                (String) row[4],
                (String) row[5],
                ((Number) row[6]).intValue(),
                ((Number) row[7]).intValue(),
                ((Number) row[8]).intValue() == 1,
                row[9] != null ? ((Timestamp) row[9]).toInstant() : null,
                row[10] != null ? ((Timestamp) row[10]).toInstant() : null,
                ((Number) row[11]).longValue(),
                (String) row[12]
        );
    }
}
