'use client';

import { useState, useEffect } from 'react';
import { Button, Spin, Typography, Flex } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { FEED_CATEGORY_META } from './FeedCard';
import FeedCommentSection from './FeedCommentSection';
import styles from './Feed.module.css';
import { getFeed, likeFeed, unlikeFeed, bookmarkFeed, removeBookmark } from '@/lib/feeds';
import { getAccessToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { relativeTime } from '@/lib/questionMeta';
import type { Feed } from '@/types/feed';
import type { UserProfile } from '@/types/user';

const { Text } = Typography;

interface FeedDetailProps {
  feedId: number;
}

export default function FeedDetail({ feedId }: FeedDetailProps) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setLoading(true);
    getFeed(feedId).then(res => {
      if (res.success && res.data) {
        setFeed(res.data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    if (getAccessToken()) {
      apiFetch<UserProfile>('/api/auth/me')
        .then(res => { if (res.success && res.data) setCurrentUser(res.data); })
        .catch(() => {});
    }
  }, [feedId]);

  async function handleToggleLike() {
    if (!feed || !getAccessToken()) return;
    const wasLiked = feed.myLiked;
    // Optimistic update
    setFeed({
      ...feed,
      myLiked: !wasLiked,
      likeCount: wasLiked ? feed.likeCount - 1 : feed.likeCount + 1,
    });
    const res = wasLiked ? await unlikeFeed(feedId) : await likeFeed(feedId);
    if (!res.success) {
      // Revert on failure
      setFeed(prev => prev ? {
        ...prev,
        myLiked: wasLiked,
        likeCount: wasLiked ? prev.likeCount + 1 : prev.likeCount - 1,
      } : prev);
    }
  }

  async function handleToggleBookmark() {
    if (!feed || !getAccessToken()) return;
    const wasBookmarked = feed.myBookmarked;
    // Optimistic update
    setFeed({
      ...feed,
      myBookmarked: !wasBookmarked,
      bookmarkCount: wasBookmarked ? feed.bookmarkCount - 1 : feed.bookmarkCount + 1,
    });
    const res = wasBookmarked ? await removeBookmark(feedId) : await bookmarkFeed(feedId);
    if (!res.success) {
      // Revert on failure
      setFeed(prev => prev ? {
        ...prev,
        myBookmarked: wasBookmarked,
        bookmarkCount: wasBookmarked ? prev.bookmarkCount + 1 : prev.bookmarkCount - 1,
      } : prev);
    }
  }

  if (loading) {
    return (
      <Flex justify="center" style={{ padding: '80px 0' }}>
        <Spin />
      </Flex>
    );
  }

  if (!feed) {
    return (
      <Flex justify="center" style={{ padding: '80px 0' }}>
        <Text style={{ color: 'var(--text-tertiary)' }}>피드를 찾을 수 없습니다.</Text>
      </Flex>
    );
  }

  const catMeta = FEED_CATEGORY_META[feed.category] ?? FEED_CATEGORY_META.ETC;

  return (
    <div>
      {/* OG Card */}
      <div className={styles.detailOgCard} style={{ marginBottom: 20 }}>
        {feed.ogImageUrl && (
          <img
            className={styles.detailImage}
            src={feed.ogImageUrl}
            alt={feed.title ?? ''}
          />
        )}
        <div style={{ padding: 16 }}>
          <Text
            strong
            style={{
              fontSize: 18,
              color: 'var(--text-primary)',
              display: 'block',
              marginBottom: 6,
              lineHeight: 1.4,
            }}
          >
            {feed.title ?? feed.url}
          </Text>
          {feed.description && (
            <Text
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              {feed.description}
            </Text>
          )}
          <Flex align="center" justify="space-between">
            {feed.domain && (
              <Text style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {feed.domain}
              </Text>
            )}
            <Button
              type="link"
              href={feed.url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<LinkOutlined />}
              style={{ fontSize: 13, padding: 0, height: 'auto' }}
            >
              원문 보기
            </Button>
          </Flex>
        </div>
      </div>

      {/* Author info */}
      <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
        <span
          className={styles.categoryTag}
          style={{ color: catMeta.color, background: catMeta.bg }}
        >
          {catMeta.label}
        </span>
        <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {feed.authorNickname} · {relativeTime(feed.createdAt)}
        </Text>
      </Flex>

      {/* Comment (recommendation reason) */}
      <div style={{
        padding: 16,
        borderRadius: 10,
        background: 'var(--bg-hover)',
        marginTop: 12,
        marginBottom: 4,
        fontSize: 14,
        color: 'var(--text-primary)',
        lineHeight: 1.6,
      }}>
        {feed.comment}
      </div>

      {/* Action bar */}
      <div className={styles.actionBar}>
        <button
          className={`${styles.actionBtn}${feed.myLiked ? ` ${styles.active}` : ''}`}
          onClick={handleToggleLike}
        >
          👍 추천 {feed.likeCount > 0 && feed.likeCount}
        </button>
        <button
          className={`${styles.actionBtn}${feed.myBookmarked ? ` ${styles.active}` : ''}`}
          onClick={handleToggleBookmark}
        >
          🔖 북마크 {feed.bookmarkCount > 0 && feed.bookmarkCount}
        </button>
      </div>

      {/* Comments */}
      <FeedCommentSection
        feedId={feedId}
        currentUserId={currentUser?.id ?? null}
      />
    </div>
  );
}
