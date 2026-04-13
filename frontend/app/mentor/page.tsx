'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Flex, Segmented, Skeleton, Typography, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MentorCard from '@/components/mentor/MentorCard';
import { getMentors } from '@/lib/mentor';
import type { MentorCard as MentorCardType, MentorSort } from '@/types/mentor';
import layoutStyles from '@/components/common/Layout.module.css';

const { Title, Text } = Typography;

const SORT_OPTIONS: { label: string; value: MentorSort }[] = [
  { label: '평점순', value: 'RATING' },
  { label: '최신순', value: 'RECENT' },
  { label: '레벨순', value: 'LEVEL' },
];

export default function MentorExplorePage() {
  const [keyword, setKeyword] = useState('');
  const [committedKeyword, setCommittedKeyword] = useState('');
  const [sort, setSort] = useState<MentorSort>('RATING');
  const [mentors, setMentors] = useState<MentorCardType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    getMentors({
      keyword: committedKeyword || undefined,
      sort,
      page: 0,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setMentors(res.data.content);
        setTotal(res.data.totalElements);
        setHasMore(!res.data.last);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [committedKeyword, sort]);

  function handleLoadMore() {
    const next = page + 1;
    setLoadingMore(true);
    getMentors({
      keyword: committedKeyword || undefined,
      sort,
      page: next,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setMentors(prev => [...prev, ...res.data!.content]);
        setHasMore(!res.data.last);
        setPage(next);
      }
      setLoadingMore(false);
    }).catch(() => setLoadingMore(false));
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain} style={{ padding: '24px 0 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
          {/* Header */}
          <Flex align="center" justify="space-between" wrap gap={12} style={{ marginBottom: 8 }}>
            <div>
              <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                멘토 탐색
              </Title>
              <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                인증된 멘토들과 연결되어 성장하세요
              </Text>
            </div>
            <Link href="/mentor/apply">
              <Button type="primary">멘토 신청</Button>
            </Link>
          </Flex>

          {/* Controls */}
          <Flex align="center" justify="space-between" wrap gap={12} style={{ margin: '20px 0 16px' }}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
              placeholder="닉네임 또는 자기소개로 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => setCommittedKeyword(keyword.trim())}
              onBlur={() => setCommittedKeyword(keyword.trim())}
              allowClear
              maxLength={80}
              style={{ maxWidth: 360, flex: 1 }}
            />
            <Segmented
              options={SORT_OPTIONS}
              value={sort}
              onChange={(v) => setSort(v as MentorSort)}
            />
          </Flex>

          <Text style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 12 }}>
            {loading ? '불러오는 중…' : `${total.toLocaleString()}명의 멘토`}
          </Text>

          {/* List */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  active
                  paragraph={{ rows: 2 }}
                  style={{ padding: 16, borderRadius: 12, background: 'var(--bg-surface)' }}
                />
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <Flex vertical align="center" gap={10} style={{ padding: '80px 0' }}>
              <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                조건에 맞는 멘토가 없어요.
              </Text>
            </Flex>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {mentors.map(m => (
                  <MentorCard key={m.id} mentor={m} />
                ))}
              </div>
              {hasMore && (
                <Flex justify="center" style={{ padding: '24px 0 8px' }}>
                  <Button onClick={handleLoadMore} loading={loadingMore}>
                    더 보기
                  </Button>
                </Flex>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
