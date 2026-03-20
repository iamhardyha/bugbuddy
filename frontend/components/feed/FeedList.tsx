'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Pagination, Skeleton, Typography } from 'antd';
import FeedCard, { FEED_CATEGORY_META } from './FeedCard';
import styles from './Feed.module.css';
import { getFeeds } from '@/lib/feeds';
import type { Feed, FeedCategory } from '@/types/feed';

const { Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = FeedCategory | typeof ALL;

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: ALL, label: '전체' },
  ...Object.entries(FEED_CATEGORY_META).map(([key, meta]) => ({
    value: key as FeedCategory,
    label: meta.label,
  })),
];

type SortOption = 'createdAt' | 'likeCount';

export default function FeedList() {
  const router = useRouter();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [sort, setSort] = useState<SortOption>('createdAt');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    getFeeds({
      category: category === ALL ? undefined : category,
      sort,
      page: 0,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setFeeds(res.data.content);
        setTotalElements(res.data.totalElements);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, sort]);

  function handlePageChange(newPage: number) {
    const zeroIndexed = newPage - 1;
    setLoading(true);
    getFeeds({
      category: category === ALL ? undefined : category,
      sort,
      page: zeroIndexed,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setFeeds(res.data.content);
        setTotalElements(res.data.totalElements);
        setPage(zeroIndexed);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  return (
    <div>
      {/* Filter bar: category text links + sort toggle */}
      <div className={styles.filterBar}>
        <nav className={styles.categoryNav}>
          {CATEGORY_OPTIONS.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`${styles.catLink}${category === c.value ? ` ${styles.catActive}` : ''}`}
            >
              {c.label}
            </button>
          ))}
        </nav>
        <div className={styles.sortToggle}>
          <button
            onClick={() => setSort('createdAt')}
            className={`${styles.sortBtn}${sort === 'createdAt' ? ` ${styles.sortActive}` : ''}`}
          >
            최신
          </button>
          <button
            onClick={() => setSort('likeCount')}
            className={`${styles.sortBtn}${sort === 'likeCount' ? ` ${styles.sortActive}` : ''}`}
          >
            추천
          </button>
        </div>
      </div>

      {/* Feed grid */}
      {loading ? (
        <div className={styles.feedGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              active
              paragraph={{ rows: 3 }}
              style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-surface)' }}
            />
          ))}
        </div>
      ) : feeds.length === 0 ? (
        <Flex vertical align="center" justify="center" gap={10} style={{ padding: '80px 0' }}>
          <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            공유된 TechFeed가 없습니다
          </Text>
        </Flex>
      ) : (
        <>
          <div className={styles.feedGrid}>
            {feeds.map(feed => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onClick={() => router.push(`/feeds/${feed.id}`)}
              />
            ))}
          </div>

          {totalElements > 20 && (
            <Flex justify="center" style={{ padding: '24px 0 8px' }}>
              <Pagination
                current={page + 1}
                total={totalElements}
                pageSize={20}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </Flex>
          )}
        </>
      )}
    </div>
  );
}
