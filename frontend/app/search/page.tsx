'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import QuestionCard from '@/components/question/QuestionCard';
import { getQuestions } from '@/lib/questions';
import { getAccessToken } from '@/lib/auth';
import type { QuestionSummary, QuestionCategory, QuestionStatus } from '@/types/question';
import layoutStyles from '@/components/common/Layout.module.css';

const { Title, Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = QuestionCategory | typeof ALL;

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: ALL, label: '전체' },
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'MOBILE', label: '모바일' },
  { value: 'AI_DATA', label: 'AI / 데이터' },
  { value: 'CS_ALGO', label: 'CS / 알고리즘' },
  { value: 'CAREER', label: '커리어' },
  { value: 'FUTURE', label: '미래 고민' },
  { value: 'ETC', label: '기타' },
];

type StatusTab = 'all' | 'open' | 'solved' | 'closed';
const STATUS_TABS: { value: StatusTab; label: string; status?: QuestionStatus }[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '진행중', status: 'OPEN' },
  { value: 'solved', label: '해결됨', status: 'SOLVED' },
  { value: 'closed', label: '마감됨', status: 'CLOSED' },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }} />}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = (searchParams.get('q') ?? '').trim();

  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  useEffect(() => {
    if (!keyword) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setPage(0);
    const status = STATUS_TABS.find(t => t.value === statusTab)?.status;
    getQuestions({
      keyword,
      category: category === ALL ? undefined : category,
      status,
      page: 0,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(res.data.content);
        setTotal(res.data.totalElements);
        setHasMore(!res.data.last);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [keyword, category, statusTab, router]);

  function handleLoadMore() {
    const next = page + 1;
    const status = STATUS_TABS.find(t => t.value === statusTab)?.status;
    setLoadingMore(true);
    getQuestions({
      keyword,
      category: category === ALL ? undefined : category,
      status,
      page: next,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(prev => [...prev, ...res.data!.content]);
        setHasMore(!res.data.last);
        setPage(next);
      }
      setLoadingMore(false);
    }).catch(() => setLoadingMore(false));
  }

  if (!keyword) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain} style={{ padding: '24px 0' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 16px' }}>
          <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
            검색 결과 · <span style={{ color: 'var(--accent)' }}>{keyword}</span>
          </Title>
          <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {loading ? '검색 중…' : `${total.toLocaleString()}건`}
          </Text>

          <Flex gap={6} wrap style={{ margin: '16px 0 8px' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  border: '1px solid var(--border-faint)',
                  background: category === c.value ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  color: category === c.value ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {c.label}
              </button>
            ))}
          </Flex>

          <Flex gap={6} style={{ margin: '0 0 16px' }}>
            {STATUS_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setStatusTab(t.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  border: 'none',
                  background: statusTab === t.value ? 'var(--bg-elevated)' : 'transparent',
                  color: statusTab === t.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.label}
              </button>
            ))}
          </Flex>

          {loading ? (
            <Flex vertical gap={8}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  active
                  paragraph={{ rows: 2 }}
                  style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-surface)' }}
                />
              ))}
            </Flex>
          ) : questions.length === 0 ? (
            <Flex vertical align="center" gap={10} style={{ padding: '80px 0' }}>
              <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                &quot;{keyword}&quot;에 해당하는 질문이 없어요.
              </Text>
              {isLoggedIn && (
                <Button type="link" icon={<EditOutlined />} onClick={() => router.push('/questions/new')}>
                  질문하기
                </Button>
              )}
            </Flex>
          ) : (
            <>
              <Flex vertical gap={8}>
                {questions.map(q => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </Flex>
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
