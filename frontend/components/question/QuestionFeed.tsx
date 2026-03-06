'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, Button, Flex, Skeleton, Typography, Tag, Divider } from 'antd';
import {
  AppstoreOutlined,
  ApiOutlined,
  LayoutOutlined,
  CloudOutlined,
  MobileOutlined,
  RobotOutlined,
  BranchesOutlined,
  RiseOutlined,
  CompassOutlined,
  EllipsisOutlined,
  TagsOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import QuestionCard from './QuestionCard';
import { getQuestions } from '@/lib/questions';
import { getAccessToken } from '@/lib/auth';
import { QUESTION_TYPE_META } from '@/lib/questionMeta';
import type { QuestionSummary, QuestionCategory, QuestionType, QuestionStatus } from '@/types/question';
import type { ReactNode } from 'react';

const { Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = QuestionCategory | typeof ALL;

const CATEGORIES: { value: CategoryFilter; label: string; icon: ReactNode }[] = [
  { value: ALL,         label: '전체',          icon: <AppstoreOutlined /> },
  { value: 'BACKEND',   label: '백엔드',        icon: <ApiOutlined /> },
  { value: 'FRONTEND',  label: '프론트엔드',    icon: <LayoutOutlined /> },
  { value: 'DEVOPS',    label: 'DevOps',        icon: <CloudOutlined /> },
  { value: 'MOBILE',    label: '모바일',        icon: <MobileOutlined /> },
  { value: 'AI_DATA',   label: 'AI / 데이터',   icon: <RobotOutlined /> },
  { value: 'CS_ALGO',   label: 'CS / 알고리즘', icon: <BranchesOutlined /> },
  { value: 'CAREER',    label: '커리어',        icon: <RiseOutlined /> },
  { value: 'FUTURE',    label: '미래 고민',     icon: <CompassOutlined /> },
  { value: 'ETC',       label: '기타',          icon: <EllipsisOutlined /> },
];

const CATEGORY_ACCENT: Partial<Record<CategoryFilter, string>> = {
  BACKEND:  '#7c65f6',
  FRONTEND: '#4ea8de',
  DEVOPS:   '#f5a623',
  MOBILE:   '#34c784',
  AI_DATA:  '#e85d5d',
  CS_ALGO:  '#a78bfa',
  CAREER:   '#60a5fa',
  FUTURE:   '#4ade80',
  ETC:      '#8888a8',
  ALL:      'var(--accent)',
};

function getPopularTags(questions: QuestionSummary[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  questions.forEach(q => {
    q.tags.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([tag, count]) => ({ tag, count }));
}

export default function QuestionFeed() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [questionType, setQuestionType] = useState<QuestionType | ''>('');
  const [status, setStatus] = useState<QuestionStatus | ''>('');
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    getQuestions({
      category: category === ALL ? undefined : category,
      questionType: questionType || undefined,
      status: status || undefined,
      page: 0,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(res.data.content);
        setHasMore(!res.data.last);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, questionType, status]);

  function handleLoadMore() {
    const next = page + 1;
    setLoadingMore(true);
    getQuestions({
      category: category === ALL ? undefined : category,
      questionType: questionType || undefined,
      status: status || undefined,
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

  const popularTags = getPopularTags(questions);

  return (
    <Flex className="feed-root">

      {/* ── Left Sidebar: Category Nav ─────────────────── */}
      <aside className="hidden lg:block feed-sidebar-left">
        <div style={{ position: 'sticky', top: `calc(var(--global-header-height) + 24px)` }}>
          <Text
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              padding: '0 12px',
              marginBottom: 6,
            }}
          >
            카테고리
          </Text>

          {CATEGORIES.map(c => {
            const isActive = category === c.value;
            const accent = CATEGORY_ACCENT[c.value] ?? 'var(--accent)';
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
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

          {isLoggedIn && (
            <>
              <Divider style={{ margin: '12px 0', borderColor: 'var(--border-faint)' }} />
              <div style={{ padding: '0 12px' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => router.push('/questions/new')}
                  style={{ width: '100%' }}
                >
                  질문하기
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ── Main Feed ──────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 24, paddingBottom: 64, paddingLeft: 28, paddingRight: 28 }}>

        {/* Mobile: Category pills */}
        <div className="mobile-cat-bar lg:hidden">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`mobile-cat-btn${category === c.value ? ' active' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <Flex align="center" gap={8} wrap style={{ marginBottom: 16 }}>
          <Select<QuestionType | ''>
            value={questionType}
            onChange={v => setQuestionType(v)}
            style={{ width: 128 }}
            size="small"
            options={[
              { label: '유형 전체', value: '' },
              ...Object.entries(QUESTION_TYPE_META).map(([k, v]) => ({ label: v.label, value: k })),
            ]}
          />
          <Select<QuestionStatus | ''>
            value={status}
            onChange={v => setStatus(v)}
            style={{ width: 128 }}
            size="small"
            options={[
              { label: '상태 전체', value: '' },
              { label: '답변 받는 중', value: 'OPEN' },
              { label: '해결됨', value: 'SOLVED' },
              { label: '마감', value: 'CLOSED' },
            ]}
          />
          <div style={{ flex: 1 }} />
          {isLoggedIn && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => router.push('/questions/new')}
              className="lg:hidden"
            >
              질문하기
            </Button>
          )}
        </Flex>

        {/* Question list */}
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
          <Flex vertical align="center" justify="center" gap={10} style={{ padding: '80px 0' }}>
            <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              조건에 맞는 질문이 없어요.
            </Text>
            {isLoggedIn && (
              <Button type="link" onClick={() => router.push('/questions/new')} style={{ fontSize: 13 }}>
                첫 질문을 작성해보세요 →
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

            {!hasMore && questions.length > 5 && (
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '24px 0 8px',
                  fontSize: 11,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  letterSpacing: '0.05em',
                }}
              >
                — end —
              </Text>
            )}
          </>
        )}
      </div>

      {/* ── Right Sidebar: Popular Tags ────────────────── */}
      <aside className="hidden xl:block feed-sidebar-right">
        <div style={{ position: 'sticky', top: `calc(var(--global-header-height) + 24px)` }}>
          <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
            <TagsOutlined style={{ fontSize: 13, color: 'var(--text-tertiary)' }} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              인기 태그
            </Text>
          </Flex>

          {popularTags.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              태그 데이터가 없어요.
            </Text>
          ) : (
            <Flex wrap gap={6}>
              {popularTags.map(({ tag, count }) => (
                <Tag
                  key={tag}
                  style={{
                    borderRadius: 4,
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-faint)',
                    fontSize: 11,
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontWeight: 500,
                    cursor: 'default',
                    padding: '2px 8px',
                  }}
                >
                  #{tag}
                  <Text
                    style={{
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                      marginLeft: 5,
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}
                  >
                    {count}
                  </Text>
                </Tag>
              ))}
            </Flex>
          )}
        </div>
      </aside>

    </Flex>
  );
}
