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
  { value: ALL, label: '전체', emoji: '🔍' },
  ...Object.entries(CATEGORY_META).map(([k, v]) => ({
    value: k as QuestionCategory,
    label: v.label,
    emoji: v.emoji,
  })),
];

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
      size: 10,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(res.data.content);
        setHasMore(!res.data.last);
      }
      setLoading(false);
    });
  }, [category, questionType, status]);

  function handleLoadMore() {
    const next = page + 1;
    setLoadingMore(true);
    getQuestions({
      category: category === ALL ? undefined : category,
      questionType: questionType || undefined,
      status: status || undefined,
      page: next,
      size: 10,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(prev => [...prev, ...res.data!.content]);
        setHasMore(!res.data.last);
        setPage(next);
      }
      setLoadingMore(false);
    });
  }

  return (
    <div className="space-y-4">
      {/* 카테고리 탭 */}
      <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              category === c.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={questionType}
          onChange={e => setQuestionType(e.target.value as QuestionType | '')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">유형 전체</option>
          {Object.entries(QUESTION_TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.emoji} {v.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={e => setStatus(e.target.value as QuestionStatus | '')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">상태 전체</option>
          <option value="OPEN">🟢 답변 받는 중</option>
          <option value="SOLVED">🔵 해결됨</option>
          <option value="CLOSED">⚫ 마감</option>
        </select>

        <div className="flex-1" />

        {isLoggedIn && (
          <button
            onClick={() => router.push('/questions/new')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            ✏️ 질문하기
          </button>
        )}
      </div>

      {/* 질문 목록 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">아직 질문이 없어요.</p>
          {isLoggedIn && (
            <button
              onClick={() => router.push('/questions/new')}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              첫 질문을 작성해보세요 →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {questions.map(q => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
