'use client';

import { relativeTime } from '@/lib/questionMeta';
import type { Feed, FeedCategory } from '@/types/feed';
import styles from './Feed.module.css';

export const FEED_CATEGORY_META: Record<FeedCategory, { label: string; color: string; bg: string }> = {
  FRONTEND:    { label: 'Frontend',    color: '#5548e0', bg: 'rgba(85,72,224,0.15)' },
  BACKEND:     { label: 'Backend',     color: '#2563eb', bg: 'rgba(37,99,235,0.15)' },
  DEVOPS:      { label: 'DevOps',      color: '#d97706', bg: 'rgba(217,119,6,0.15)' },
  MOBILE:      { label: 'Mobile',      color: '#0891b2', bg: 'rgba(8,145,178,0.15)' },
  AI:          { label: 'AI',          color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
  OPEN_SOURCE: { label: 'Open Source', color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
  TREND:       { label: 'Trend',       color: '#dc2626', bg: 'rgba(220,38,38,0.15)' },
  TOOLS:       { label: 'Tools',       color: '#0d9488', bg: 'rgba(13,148,136,0.15)' },
  TUTORIAL:    { label: 'Tutorial',    color: '#2563eb', bg: 'rgba(37,99,235,0.15)' },
  CAREER:      { label: 'Career',      color: '#9333ea', bg: 'rgba(147,51,234,0.15)' },
  ETC:         { label: '기타',        color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

interface Props {
  feed: Feed;
  onClick: () => void;
}

export default function FeedCard({ feed, onClick }: Props) {
  const meta = FEED_CATEGORY_META[feed.category] ?? FEED_CATEGORY_META.ETC;

  return (
    <article className={styles.feedCard} onClick={onClick}>
      {/* Image */}
      {feed.ogImageUrl ? (
        <img
          src={feed.ogImageUrl}
          alt={feed.title ?? ''}
          className={styles.cardImage}
          loading="lazy"
        />
      ) : (
        <div
          className={styles.cardImageFallback}
          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)` }}
        >
          {meta.label}
        </div>
      )}

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span
            className={styles.categoryTag}
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
          <span>·</span>
          <span>{feed.domain}</span>
        </div>

        <h3 className={styles.cardTitle}>
          {feed.title ?? feed.url}
        </h3>

        <p className={styles.cardComment}>
          {feed.comment}
        </p>

        <div className={styles.cardFooter}>
          <span className={styles.cardAuthor}>
            {feed.authorNickname} · {relativeTime(feed.createdAt)}
          </span>
          <span className={styles.cardStats}>
            <span>👍 {feed.likeCount}</span>
            <span>💬 {feed.commentCount}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
