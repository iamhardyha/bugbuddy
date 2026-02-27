'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuestion, deleteQuestion, closeQuestion } from '@/lib/questions';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { CATEGORY_META, QUESTION_TYPE_META, STATUS_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionDetail } from '@/types/question';
import type { UserProfile } from '@/types/user';

export default function QuestionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    async function load() {
      const qRes = await getQuestion(Number(id));
      if (qRes.success && qRes.data) {
        setQuestion(qRes.data);
      }

      if (getAccessToken()) {
        const uRes = await apiFetch<UserProfile>('/api/auth/me');
        if (uRes.success && uRes.data) {
          setCurrentUser(uRes.data);
        }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!confirm('질문을 삭제할까요?')) return;
    setDeleting(true);
    const res = await deleteQuestion(Number(id));
    if (res.success) {
      router.replace('/');
    } else {
      setDeleting(false);
    }
  }

  async function handleClose() {
    if (!confirm('질문을 마감할까요? 마감 후에는 수정할 수 없습니다.')) return;
    setClosing(true);
    const res = await closeQuestion(Number(id));
    if (res.success && res.data) {
      setQuestion(res.data);
    }
    setClosing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-5xl">🔍</p>
        <p className="text-gray-500 text-sm">질문을 찾을 수 없어요.</p>
        <button
          onClick={() => router.replace('/')}
          className="text-sm text-blue-600 hover:underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const isAuthor = currentUser?.id === question.authorUserId;
  const status = STATUS_META[question.status];
  const category = CATEGORY_META[question.category];
  const type = QUESTION_TYPE_META[question.questionType];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← 목록으로
          </button>

          {isAuthor && (
            <div className="flex items-center gap-2">
              {question.status !== 'CLOSED' && (
                <>
                  <button
                    onClick={() => router.push(`/questions/${id}/edit`)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={closing}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {closing ? '마감 중...' : '마감'}
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <article className="rounded-xl border border-gray-200 bg-white p-6 md:p-8">
          {/* 배지 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.color}`}
            >
              {status.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 ring-1 ring-inset ring-purple-600/20">
              {category.emoji} {category.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-50 ring-1 ring-inset ring-orange-600/20">
              {type.emoji} {type.label}
            </span>
            {question.allowOneToOne && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 ring-1 ring-inset ring-teal-600/20">
                💬 1:1 가능
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">
            {question.title}
          </h1>

          {/* 태그 */}
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {question.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메타 */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100">
            <span>👁 {question.viewCount.toLocaleString()} 조회</span>
            <span>·</span>
            <span>{relativeTime(question.createdAt)}</span>
            {question.updatedAt !== question.createdAt && (
              <>
                <span>·</span>
                <span>수정됨 {relativeTime(question.updatedAt)}</span>
              </>
            )}
          </div>

          {/* 본문 */}
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">
            {question.body}
          </div>
        </article>
      </main>
    </div>
  );
}
