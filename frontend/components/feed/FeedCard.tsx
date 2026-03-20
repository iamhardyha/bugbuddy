'use client';

import { relativeTime } from '@/lib/questionMeta';
import type { Feed, FeedCategory } from '@/types/feed';
import styles from './Feed.module.css';

export const FEED_CATEGORY_META: Record<FeedCategory, { label: string; color: string; bg: string }> = {
  FRONTEND:    { label: 'Frontend',    color: '#5548e0', bg: 'rgba(85,72,224,0.1)' },
  BACKEND:     { label: 'Backend',     color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  DEVOPS:      { label: 'DevOps',      color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  MOBILE:      { label: 'Mobile',      color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
  AI:          { label: 'AI',          color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  OPEN_SOURCE: { label: 'Open Source', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  TREND:       { label: 'Trend',       color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  TOOLS:       { label: 'Tools',       color: '#0d9488', bg: 'rgba(13,148,136,0.1)' },
  TUTORIAL:    { label: 'Tutorial',    color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  CAREER:      { label: 'Career',      color: '#9333ea', bg: 'rgba(147,51,234,0.1)' },
  ETC:         { label: '기타',        color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

interface FeedCardProps {
  feed: Feed;
  onClick: () => void;
}

export default function FeedCard({ feed, onClick }: FeedCardProps) {
  const catMeta = FEED_CATEGORY_META[feed.category] ?? FEED_CATEGORY_META.ETC;
  const domainInitial = feed.domain ? feed.domain.charAt(0).toUpperCase() : catMeta.label.charAt(0);

  return (
    <div className={styles.feedCard} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onClick(); }}>
      {/* Thumbnail */}
      {feed.ogImageUrl ? (
        <img
          className={styles.thumbnail}
          src={feed.ogImageUrl}
          alt={feed.title ?? ''}
          loading="lazy"
        />
      ) : (
        <div
          className={styles.thumbnailFallback}
          style={{ background: catMeta.color }}
        >
          {domainInitial}
        </div>
      )}

      {/* Content */}
      <div className={styles.cardContent}>
        {/* Category + Domain */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span
            className={styles.categoryTag}
            style={{ color: catMeta.color, background: catMeta.bg }}
          >
            {catMeta.label}
          </span>
          {feed.domain && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {feed.domain}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: 4,
        }}>
          {feed.title ?? feed.url}
        </div>

        {/* Comment excerpt */}
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: 6,
        }}>
          {feed.comment}
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          <span>{feed.authorNickname}</span>
          <span>{relativeTime(feed.createdAt)}</span>
          <span>👍 {feed.likeCount}</span>
          <span>💬 {feed.commentCount}</span>
        </div>
      </div>
    </div>
  );
}
