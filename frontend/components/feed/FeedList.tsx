'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Pagination, Skeleton, Typography } from 'antd';
import {
  AppstoreOutlined,
  LayoutOutlined,
  ApiOutlined,
  CloudServerOutlined,
  MobileOutlined,
  RobotOutlined,
  GithubOutlined,
  RiseOutlined,
  ToolOutlined,
  BookOutlined,
  TeamOutlined,
  EllipsisOutlined,
  HomeOutlined,
  HeartOutlined,
  BookFilled,
} from '@ant-design/icons';
import FeedCard, { FEED_CATEGORY_META } from './FeedCard';
import styles from './Feed.module.css';
import { getFeeds, getLikedFeeds, getBookmarks } from '@/lib/feeds';
import type { Feed, FeedCategory } from '@/types/feed';
import type { ReactNode } from 'react';

const { Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = FeedCategory | typeof ALL;
type ViewMode = 'all' | 'liked' | 'bookmarked';

const VIEW_MODES: { value: ViewMode; label: string; icon: ReactNode }[] = [
  { value: 'all',        label: '전체 피드', icon: <HomeOutlined /> },
  { value: 'liked',      label: '내 추천',   icon: <HeartOutlined /> },
  { value: 'bookmarked', label: '내 북마크', icon: <BookFilled /> },
];

const CATEGORIES: { value: CategoryFilter; label: string; icon: ReactNode }[] = [
  { value: ALL,          label: '전체',        icon: <AppstoreOutlined /> },
  { value: 'FRONTEND',   label: 'Frontend',   icon: <LayoutOutlined /> },
  { value: 'BACKEND',    label: 'Backend',    icon: <ApiOutlined /> },
  { value: 'DEVOPS',     label: 'DevOps',     icon: <CloudServerOutlined /> },
  { value: 'MOBILE',     label: 'Mobile',     icon: <MobileOutlined /> },
  { value: 'AI',         label: 'AI',         icon: <RobotOutlined /> },
  { value: 'OPEN_SOURCE',label: 'Open Source', icon: <GithubOutlined /> },
  { value: 'TREND',      label: 'Trend',      icon: <RiseOutlined /> },
  { value: 'TOOLS',      label: 'Tools',      icon: <ToolOutlined /> },
  { value: 'TUTORIAL',   label: 'Tutorial',   icon: <BookOutlined /> },
  { value: 'CAREER',     label: 'Career',     icon: <TeamOutlined /> },
  { value: 'ETC',        label: '기타',        icon: <EllipsisOutlined /> },
];

const CATEGORY_ACCENT: Partial<Record<CategoryFilter, string>> = {
  FRONTEND:    '#5548e0',
  BACKEND:     '#2563eb',
  DEVOPS:      '#d97706',
  MOBILE:      '#0891b2',
  AI:          '#7c3aed',
  OPEN_SOURCE: '#16a34a',
  TREND:       '#dc2626',
  TOOLS:       '#0d9488',
  TUTORIAL:    '#2563eb',
  CAREER:      '#9333ea',
  ETC:         '#6b7280',
  ALL:         'var(--accent)',
};

type SortOption = 'createdAt' | 'likeCount';

export default function FeedList() {
  const router = useRouter();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [sort, setSort] = useState<SortOption>('createdAt');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeeds = useCallback((targetPage: number) => {
    setLoading(true);
    let promise;

    if (viewMode === 'liked') {
      promise = getLikedFeeds(targetPage, 20);
    } else if (viewMode === 'bookmarked') {
      promise = getBookmarks(targetPage, 20);
    } else {
      promise = getFeeds({
        category: category === ALL ? undefined : category,
        sort,
        page: targetPage,
        size: 20,
      });
    }

    promise.then(res => {
      if (res.success && res.data) {
        setFeeds(res.data.content);
        setTotalElements(res.data.totalElements);
        setPage(targetPage);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [viewMode, category, sort]);

  useEffect(() => {
    fetchFeeds(0);
  }, [fetchFeeds]);

  function handlePageChange(newPage: number) {
    fetchFeeds(newPage - 1);
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    setPage(0);
    if (mode !== 'all') {
      setCategory(ALL);
    }
  }

  const showCategoryFilter = viewMode === 'all';

  return (
    <Flex className={styles.feedRoot}>

      {/* Left Sidebar — desktop only */}
      <aside className={`hidden lg:block ${styles.feedSidebarLeft}`}>
        <div style={{ position: 'sticky', top: 'calc(var(--global-header-height) + 24px)', padding: '20px 0' }}>
          {/* View Mode Nav */}
          <Text
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              padding: '0 16px',
              marginBottom: 4,
            }}
          >
            Feeds
          </Text>

          {VIEW_MODES.map(v => {
            const isActive = viewMode === v.value;
            return (
              <button
                key={v.value}
                onClick={() => handleViewModeChange(v.value)}
                className={`${styles.feedNavBtn}${isActive ? ` ${styles.feedNavBtnActive}` : ''}`}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 18,
                      borderRadius: '0 3px 3px 0',
                      background: 'var(--accent)',
                    }}
                  />
                )}
                <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                  {v.icon}
                </span>
                <span>{v.label}</span>
              </button>
            );
          })}

          {/* Category Nav */}
          {showCategoryFilter && (
            <>
              <div style={{ height: 12 }} />
              <Text
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  padding: '0 16px',
                  marginBottom: 4,
                }}
              >
                Categories
              </Text>

              {CATEGORIES.map(c => {
                const isActive = category === c.value;
                const accent = CATEGORY_ACCENT[c.value] ?? 'var(--accent)';
                return (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`${styles.feedNavBtn}${isActive ? ` ${styles.feedNavBtnActive}` : ''}`}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: 18,
                          borderRadius: '0 3px 3px 0',
                          background: accent,
                        }}
                      />
                    )}
                    <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                      {c.icon}
                    </span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.feedMainContent} style={{ flex: 1, minWidth: 0 }}>

        {/* Mobile: viewMode pills */}
        <div className={`${styles.feedMobileViewBar} lg:hidden`}>
          {VIEW_MODES.map(v => (
            <button
              key={v.value}
              onClick={() => handleViewModeChange(v.value)}
              className={`${styles.feedMobileCatBtn}${viewMode === v.value ? ` ${styles.feedMobileCatBtnActive}` : ''}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Mobile: category pills */}
        {showCategoryFilter && (
          <div className={`${styles.feedMobileCatBar} lg:hidden`}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`${styles.feedMobileCatBtn}${category === c.value ? ` ${styles.feedMobileCatBtnActive}` : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Sort toggle */}
        {viewMode === 'all' && (
          <Flex align="center" justify="flex-end" style={{ marginBottom: 16 }}>
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
          </Flex>
        )}

        {/* Feed list */}
        {loading ? (
          <div className={styles.feedStream}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                active
                avatar
                paragraph={{ rows: 4 }}
                style={{ padding: '20px', borderRadius: 12, background: 'var(--bg-surface)' }}
              />
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <Flex vertical align="center" justify="center" gap={10} style={{ padding: '80px 0' }}>
            <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {viewMode === 'liked'
                ? '추천한 TechFeed가 없습니다'
                : viewMode === 'bookmarked'
                  ? '북마크한 TechFeed가 없습니다'
                  : '공유된 TechFeed가 없습니다'}
            </Text>
          </Flex>
        ) : (
          <>
            <div className={styles.feedStream}>
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
    </Flex>
  );
}
