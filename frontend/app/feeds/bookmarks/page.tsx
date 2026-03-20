'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Pagination, Skeleton, Typography } from 'antd';
import FeedCard from '@/components/feed/FeedCard';
import { getBookmarks } from '@/lib/feeds';
import { getAccessToken } from '@/lib/auth';
import layoutStyles from '@/components/common/Layout.module.css';
import type { Feed } from '@/types/feed';

const { Text } = Typography;

export default function BookmarksPage() {
  const router = useRouter();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    loadBookmarks(0);
  }, [router]);

  function loadBookmarks(targetPage: number) {
    setLoading(true);
    getBookmarks(targetPage, 20).then(res => {
      if (res.success && res.data) {
        setFeeds(res.data.content);
        setTotalElements(res.data.totalElements);
        setPage(targetPage);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  return (
    <div className={layoutStyles.pageRoot}>
      <header className={layoutStyles.pageHeader}>
        <div style={{ margin: '0 auto', maxWidth: '720px' }}>
          <h1 className={layoutStyles.pageTitle}>내 북마크</h1>
        </div>
      </header>

      <main className={layoutStyles.formPageMain}>
        {loading ? (
          <Flex vertical gap={8}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                active
                paragraph={{ rows: 2 }}
                style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-surface)' }}
              />
            ))}
          </Flex>
        ) : feeds.length === 0 ? (
          <Flex vertical align="center" justify="center" gap={10} style={{ padding: '80px 0' }}>
            <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              북마크한 피드가 없습니다.
            </Text>
          </Flex>
        ) : (
          <>
            <Flex vertical gap={8}>
              {feeds.map(feed => (
                <FeedCard
                  key={feed.id}
                  feed={feed}
                  onClick={() => router.push(`/feeds/${feed.id}`)}
                />
              ))}
            </Flex>

            {totalElements > 20 && (
              <Flex justify="center" style={{ padding: '24px 0 8px' }}>
                <Pagination
                  current={page + 1}
                  total={totalElements}
                  pageSize={20}
                  onChange={(p) => loadBookmarks(p - 1)}
                  showSizeChanger={false}
                />
              </Flex>
            )}
          </>
        )}
      </main>
    </div>
  );
}
