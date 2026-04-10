'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spin, Typography, Flex, Input, Select, Popconfirm, message } from 'antd';
import { LinkOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { FEED_CATEGORY_META } from './FeedCard';
import FeedCommentSection from './FeedCommentSection';
import styles from './Feed.module.css';
import { getFeed, likeFeed, unlikeFeed, bookmarkFeed, removeBookmark, deleteFeed, updateFeed } from '@/lib/feeds';
import { getAccessToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { relativeTime } from '@/lib/questionMeta';
import type { Feed, FeedCategory } from '@/types/feed';
import type { UserProfile } from '@/types/user';

const { Text } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = Object.entries(FEED_CATEGORY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

interface FeedDetailProps {
  feedId: number;
}

export default function FeedDetail({ feedId }: FeedDetailProps) {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editCategory, setEditCategory] = useState<FeedCategory>('ETC');
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

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
    setFeed({
      ...feed,
      myLiked: !wasLiked,
      likeCount: wasLiked ? feed.likeCount - 1 : feed.likeCount + 1,
    });
    const res = wasLiked ? await unlikeFeed(feedId) : await likeFeed(feedId);
    if (!res.success) {
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
    setFeed({
      ...feed,
      myBookmarked: !wasBookmarked,
      bookmarkCount: wasBookmarked ? feed.bookmarkCount - 1 : feed.bookmarkCount + 1,
    });
    const res = wasBookmarked ? await removeBookmark(feedId) : await bookmarkFeed(feedId);
    if (!res.success) {
      setFeed(prev => prev ? {
        ...prev,
        myBookmarked: wasBookmarked,
        bookmarkCount: wasBookmarked ? prev.bookmarkCount + 1 : prev.bookmarkCount - 1,
      } : prev);
    }
  }

  function handleStartEdit() {
    if (!feed) return;
    setEditCategory(feed.category);
    setEditComment(feed.comment);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
  }

  async function handleSaveEdit() {
    if (!feed) return;
    const trimmed = editComment.trim();
    if (!trimmed) return;
    setSaving(true);
    const res = await updateFeed(feedId, { category: editCategory, comment: trimmed });
    if (res.success && res.data) {
      setFeed(res.data);
      setEditing(false);
      message.success('피드가 수정되었습니다.');
    } else {
      message.error('수정에 실패했습니다.');
    }
    setSaving(false);
  }

  async function handleDelete() {
    const res = await deleteFeed(feedId);
    if (res.success) {
      message.success('피드가 삭제되었습니다.');
      router.push('/feeds');
    } else {
      message.error('삭제에 실패했습니다.');
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
  const isOwner = currentUser !== null && currentUser.id === feed.authorUserId;

  return (
    <div>
      {/* OG Card */}
      <div className={styles.detailOgCard} style={{ marginBottom: 20 }}>
        {feed.ogImageUrl ? (
          <img
            className={styles.detailImage}
            src={feed.ogImageUrl}
            alt={feed.title ?? ''}
          />
        ) : (
          <div
            className={styles.detailImageFallback}
            style={{ background: `linear-gradient(135deg, ${catMeta.color}40, ${catMeta.color}15)` }}
          >
            {catMeta.label}
          </div>
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
        {editing ? (
          <Select
            value={editCategory}
            onChange={(val) => setEditCategory(val as FeedCategory)}
            options={CATEGORY_OPTIONS}
            style={{ minWidth: 120 }}
            size="small"
          />
        ) : (
          <span
            className={styles.categoryTag}
            style={{ color: catMeta.color, background: catMeta.bg }}
          >
            {catMeta.label}
          </span>
        )}
        <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {feed.authorNickname} · {relativeTime(feed.createdAt)}
        </Text>
      </Flex>

      {/* Comment (recommendation reason) */}
      {editing ? (
        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <TextArea
            value={editComment}
            onChange={e => setEditComment(e.target.value)}
            maxLength={2000}
            showCount
            rows={4}
            style={{ marginBottom: 12 }}
          />
          <Flex gap={8} justify="flex-end">
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSaveEdit}
              loading={saving}
              disabled={!editComment.trim()}
            >
              저장
            </Button>
          </Flex>
        </div>
      ) : (
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
      )}

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

        {isOwner && !editing && (
          <Flex gap={8} style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={handleStartEdit}
            >
              수정
            </Button>
            <Popconfirm
              title="피드를 삭제하시겠습니까?"
              description="삭제된 피드는 복구할 수 없습니다."
              onConfirm={handleDelete}
              okText="삭제"
              cancelText="취소"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                삭제
              </Button>
            </Popconfirm>
          </Flex>
        )}
      </div>

      {/* Comments */}
      <FeedCommentSection
        feedId={feedId}
        currentUserId={currentUser?.id ?? null}
      />
    </div>
  );
}
