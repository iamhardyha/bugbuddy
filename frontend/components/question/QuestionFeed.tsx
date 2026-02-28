'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, Button, Flex, Skeleton, Typography } from 'antd';
import QuestionCard from './QuestionCard';
import { getQuestions } from '@/lib/questions';
import { getAccessToken } from '@/lib/auth';
import { QUESTION_TYPE_META } from '@/lib/questionMeta';
import type { QuestionSummary, QuestionCategory, QuestionType, QuestionStatus } from '@/types/question';

const { Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = QuestionCategory | typeof ALL;

const CATEGORIES: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: ALL,         label: '전체',         emoji: '◎' },
  { value: 'BACKEND',   label: '백엔드',       emoji: '🧩' },
  { value: 'FRONTEND',  label: '프론트엔드',   emoji: '🎨' },
  { value: 'DEVOPS',    label: 'DevOps',       emoji: '🛠' },
  { value: 'MOBILE',    label: '모바일',       emoji: '📱' },
  { value: 'AI_DATA',   label: 'AI / 데이터',  emoji: '🤖' },
  { value: 'CS_ALGO',   label: 'CS / 알고리즘', emoji: '🧪' },
  { value: 'CAREER',    label: '커리어',       emoji: '🚀' },
  { value: 'FUTURE',    label: '미래 고민',    emoji: '🌱' },
  { value: 'ETC',       label: '기타',         emoji: '🐞' },
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
      size: 15,
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
      size: 15,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(prev => [...prev, ...res.data!.content]);
        setHasMore(!res.data.last);
        setPage(next);
      }
      setLoadingMore(false);
    }).catch(() => setLoadingMore(false));
  }

  return (
    <Flex className="feed-root">
      {/* ── Left Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:block feed-sidebar">
        <div style={{ position: 'sticky', top: 72 }}>
          <Text
            style={{
              display: 'block',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.1em',
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
                <span style={{ fontSize: 14, lineHeight: 1 }}>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            );
          })}

          <div style={{ margin: '16px 12px', height: 1, background: 'var(--border-faint)' }} />

          {isLoggedIn && (
            <Button
              type="primary"
              onClick={() => router.push('/questions/new')}
              style={{ width: 'calc(100% - 24px)', margin: '0 12px' }}
            >
              + 질문하기
            </Button>
          )}
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Mobile category bar */}
        <div className="mobile-cat-bar lg:hidden">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`mobile-cat-btn${category === c.value ? ' active' : ''}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <Flex align="center" gap={8} wrap style={{ marginBottom: 14 }}>
          <Select<QuestionType | ''>
            value={questionType}
            onChange={v => setQuestionType(v)}
            style={{ width: 130 }}
            size="small"
            options={[
              { label: '유형 전체', value: '' },
              ...Object.entries(QUESTION_TYPE_META).map(([k, v]) => ({ label: v.label, value: k })),
            ]}
          />

          <Select<QuestionStatus | ''>
            value={status}
            onChange={v => setStatus(v)}
            style={{ width: 130 }}
            size="small"
            options={[
              { label: '상태 전체', value: '' },
              { label: '답변 받는 중', value: 'OPEN' },
              { label: '해결됨', value: 'SOLVED' },
              { label: '마감', value: 'CLOSED' },
            ]}
          />

          <div style={{ flex: 1 }} />

          {/* Mobile ask button */}
          {isLoggedIn && (
            <Button
              type="primary"
              size="small"
              onClick={() => router.push('/questions/new')}
              className="lg:hidden"
            >
              + 질문하기
            </Button>
          )}

          {/* Question count hint */}
          {!loading && (
            <Text
              style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-jetbrains-mono)',
              }}
            >
              {questions.length}개
            </Text>
          )}
        </Flex>

        {/* List */}
        {loading ? (
          <Flex vertical gap={7}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} active paragraph={{ rows: 2 }} style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg-surface)' }} />
            ))}
          </Flex>
        ) : questions.length === 0 ? (
          <Flex
            vertical
            align="center"
            justify="center"
            gap={10}
            style={{ padding: '80px 0' }}
          >
            <Text style={{ fontSize: 36, lineHeight: 1, display: 'block' }}>◎</Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              아직 질문이 없어요.
            </Text>
            {isLoggedIn && (
              <Button type="link" onClick={() => router.push('/questions/new')} style={{ fontSize: 13 }}>
                첫 질문을 작성해보세요 →
              </Button>
            )}
          </Flex>
        ) : (
          <>
            <Flex vertical gap={7}>
              {questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </Flex>

            {hasMore && (
              <Flex justify="center" style={{ padding: '20px 0 8px' }}>
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
                  padding: '20px 0 8px',
                  fontSize: 12,
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
              >
                — 모든 질문을 봤어요 —
              </Text>
            )}
          </>
        )}

        <div style={{ height: 48 }} />
      </div>
    </Flex>
  );
}
