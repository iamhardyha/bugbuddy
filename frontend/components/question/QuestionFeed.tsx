'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from './QuestionCard';
import { getQuestions } from '@/lib/questions';
import { getAccessToken } from '@/lib/auth';
import { CATEGORY_META, QUESTION_TYPE_META } from '@/lib/questionMeta';
import type { QuestionSummary, QuestionCategory, QuestionType, QuestionStatus } from '@/types/question';

const ALL = 'ALL' as const;
type CategoryFilter = QuestionCategory | typeof ALL;

const CATEGORIES: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: ALL,         label: '전체',       emoji: '◎' },
  { value: 'BACKEND',   label: '백엔드',     emoji: '🧩' },
  { value: 'FRONTEND',  label: '프론트엔드', emoji: '🎨' },
  { value: 'DEVOPS',    label: 'DevOps',     emoji: '🛠' },
  { value: 'MOBILE',    label: '모바일',     emoji: '📱' },
  { value: 'AI_DATA',   label: 'AI / 데이터', emoji: '🤖' },
  { value: 'CS_ALGO',   label: 'CS / 알고리즘', emoji: '🧪' },
  { value: 'CAREER',    label: '커리어',     emoji: '🚀' },
  { value: 'FUTURE',    label: '미래 고민',  emoji: '🌱' },
  { value: 'ETC',       label: '기타',       emoji: '🐞' },
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
    <div className="flex gap-0 pt-6 lg:gap-6">
      {/* ── Left Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:block" style={{ width: 210, flexShrink: 0 }}>
        <div style={{ position: 'sticky', top: 72 }}>
          <p
            style={{
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
          </p>

          {CATEGORIES.map(c => {
            const isActive = category === c.value;
            const accent = CATEGORY_ACCENT[c.value] ?? 'var(--accent)';
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
              >
                {/* Active indicator bar */}
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

          {/* Divider */}
          <div
            style={{
              margin: '16px 12px',
              height: 1,
              background: 'var(--border-faint)',
            }}
          />

          {isLoggedIn && (
            <button
              onClick={() => router.push('/questions/new')}
              className="accent-btn"
              style={{ width: 'calc(100% - 24px)', margin: '0 12px', justifyContent: 'center' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              질문하기
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Mobile category scroll */}
        <div
          className="flex lg:hidden overflow-x-auto pb-1"
          style={{ gap: 6, marginBottom: 12 }}
        >
          {CATEGORIES.map(c => {
            const isActive = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  flexShrink: 0,
                  padding: '5px 14px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease',
                }}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <select
            value={questionType}
            onChange={e => setQuestionType(e.target.value as QuestionType | '')}
            className="theme-select"
          >
            <option value="">유형 전체</option>
            {Object.entries(QUESTION_TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value as QuestionStatus | '')}
            className="theme-select"
          >
            <option value="">상태 전체</option>
            <option value="OPEN">답변 받는 중</option>
            <option value="SOLVED">해결됨</option>
            <option value="CLOSED">마감</option>
          </select>

          <div style={{ flex: 1 }} />

          {/* Mobile ask button */}
          {isLoggedIn && (
            <button
              onClick={() => router.push('/questions/new')}
              className="accent-btn lg:hidden"
            >
              + 질문하기
            </button>
          )}

          {/* Question count hint */}
          {!loading && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-jetbrains-mono)',
              }}
            >
              {questions.length}개
            </span>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 90 }} />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 36, lineHeight: 1 }}>◎</span>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>
              아직 질문이 없어요.
            </p>
            {isLoggedIn && (
              <button
                onClick={() => router.push('/questions/new')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                첫 질문을 작성해보세요 →
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="ghost-btn"
                >
                  {loadingMore ? '불러오는 중…' : '더 보기'}
                </button>
              </div>
            )}

            {!hasMore && questions.length > 5 && (
              <p
                style={{
                  textAlign: 'center',
                  padding: '20px 0 8px',
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
              >
                — 모든 질문을 봤어요 —
              </p>
            )}
          </>
        )}

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}
