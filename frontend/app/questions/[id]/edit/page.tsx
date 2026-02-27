'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';
import { getQuestion, updateQuestion } from '@/lib/questions';
import { CATEGORY_META, QUESTION_TYPE_META } from '@/lib/questionMeta';
import type { QuestionCategory, QuestionType } from '@/types/question';

export default function EditQuestionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<QuestionCategory | ''>('');
  const [questionType, setQuestionType] = useState<QuestionType | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allowOneToOne, setAllowOneToOne] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    getQuestion(Number(id)).then(res => {
      if (res.success && res.data) {
        const q = res.data;
        if (q.status === 'CLOSED') {
          router.replace(`/questions/${id}`);
          return;
        }
        setTitle(q.title);
        setBody(q.body);
        setCategory(q.category);
        setQuestionType(q.questionType);
        setTags(q.tags);
        setAllowOneToOne(q.allowOneToOne);
      } else {
        router.replace('/');
      }
      setLoading(false);
    });
  }, [id, router]);

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (!trimmed || tags.includes(trimmed) || tags.length >= 5) return;
    setTags([...tags, trimmed]);
    setTagInput('');
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !questionType) {
      setError('카테고리와 질문 유형을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await updateQuestion(Number(id), {
      title,
      body,
      category,
      questionType,
      allowOneToOne,
      tags,
    });

    if (res.success && res.data) {
      router.push(`/questions/${id}`);
    } else {
      setError(res.error?.message ?? '수정에 실패했습니다.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← 돌아가기
          </button>
          <h1 className="text-lg font-semibold text-gray-900">질문 수정</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{title.length}/120</p>
          </div>

          {/* 카테고리 + 질문 유형 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value as QuestionCategory)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">선택하세요</option>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.emoji} {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                질문 유형 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">선택하세요</option>
                {Object.entries(QUESTION_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.emoji} {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              태그{' '}
              <span className="text-gray-400 font-normal">
                (최대 5개 · Enter 또는 쉼표로 추가)
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[44px] items-center">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="hover:text-blue-900 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  placeholder={tags.length === 0 ? '태그 입력...' : ''}
                  className="flex-1 min-w-24 text-sm outline-none bg-transparent"
                />
              )}
            </div>
          </div>

          {/* 1:1 멘토링 허용 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllowOneToOne(!allowOneToOne)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                allowOneToOne ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label="1:1 멘토링 허용 토글"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  allowOneToOne ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">1:1 멘토링 허용</span>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
