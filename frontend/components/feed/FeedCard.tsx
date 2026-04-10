'use client';

import { Avatar, Flex, Tag, Typography } from 'antd';
import { HeartOutlined, MessageOutlined } from '@ant-design/icons';
import { relativeTime } from '@/lib/questionMeta';
import type { Feed, FeedCategory } from '@/types/feed';
import styles from './Feed.module.css';

const { Text } = Typography;

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
  const initial = feed.authorNickname?.charAt(0).toUpperCase() ?? '?';

  return (
    <article className={styles.instaCard} onClick={onClick}>
      {/* Author header */}
      <Flex align="center" gap={10} className={styles.instaHeader}>
        <Avatar
          size={32}
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initial}
        </Avatar>
        <Flex vertical style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {feed.authorNickname}
          </Text>
        </Flex>
        <Text style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {relativeTime(feed.createdAt)}
        </Text>
      </Flex>

      {/* Image */}
      {feed.ogImageUrl ? (
        <img
          src={feed.ogImageUrl}
          alt={feed.title ?? ''}
          className={styles.instaImage}
          loading="lazy"
        />
      ) : (
        <div
          className={styles.instaImageFallback}
          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)` }}
        >
          {meta.label}
        </div>
      )}

      {/* Action / meta bar */}
      <div className={styles.instaBody}>
        <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
          <Flex align="center" gap={14}>
            <Flex align="center" gap={4}>
              <HeartOutlined style={{ fontSize: 15, color: 'var(--text-secondary)' }} />
              <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {feed.likeCount}
              </Text>
            </Flex>
            <Flex align="center" gap={4}>
              <MessageOutlined style={{ fontSize: 14, color: 'var(--text-secondary)' }} />
              <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {feed.commentCount}
              </Text>
            </Flex>
          </Flex>
          <Tag
            style={{
              background: meta.bg,
              color: meta.color,
              border: 'none',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {meta.label}
          </Tag>
        </Flex>

        {/* Title */}
        <Text
          strong
          className={styles.instaTitle}
        >
          {feed.title ?? feed.url}
        </Text>

        {/* Comment / description */}
        {feed.comment && (
          <Text className={styles.instaComment}>
            {feed.comment}
          </Text>
        )}

        {/* Domain link */}
        <Text className={styles.instaDomain}>
          {feed.domain}
        </Text>
      </div>
    </article>
  );
}
