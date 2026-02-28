'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';
import { getQuestion, updateQuestion } from '@/lib/questions';
import { CATEGORY_META, QUESTION_TYPE_META } from '@/lib/questionMeta';
import type { QuestionCategory, QuestionType } from '@/types/question';
import MarkdownEditor from '@/components/editor/MarkdownEditor';

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
  const [uploadIds, setUploadIds] = useState<number[]>([]);
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
      uploadIds,
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
      <div className="page-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page-root">
      <header className="page-header">
        <div style={{ margin: '0 auto', maxWidth: '720px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="page-back-btn" onClick={() => router.back()}>
            ← 돌아가기
          </button>
          <span style={{ color: 'var(--border)', fontSize: '16px' }}>|</span>
          <h1 className="page-title">질문 수정</h1>
        </div>
      </header>

      <main style={{ margin: '0 auto', maxWidth: '720px', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 제목 */}
          <div className="form-field">
            <label className="form-label">
              제목 <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
            />
            <span className="form-char-count">{title.length}/120</span>
          </div>

          {/* 카테고리 + 질문 유형 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-field">
              <label className="form-label">
                카테고리 <span className="form-label-required">*</span>
              </label>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value as QuestionCategory)}
                className="form-select"
              >
                <option value="">선택하세요</option>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.emoji} {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                질문 유형 <span className="form-label-required">*</span>
              </label>
              <select
                required
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                className="form-select"
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
          <div className="form-field">
            <label className="form-label">
              내용 <span className="form-label-required">*</span>
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              onUpload={id => setUploadIds(prev => [...prev, id])}
              minRows={12}
              required
            />
          </div>

          {/* 태그 */}
          <div className="form-field">
            <label className="form-label">
              태그{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>
                (최대 5개 · Enter 또는 쉼표로 추가)
              </span>
            </label>
            <div className="tag-input-container">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <button
                    type="button"
                    className="tag-chip-remove"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
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
                  className="tag-input"
                />
              )}
            </div>
          </div>

          {/* 1:1 멘토링 허용 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setAllowOneToOne(!allowOneToOne)}
              className={`toggle-track ${allowOneToOne ? 'toggle-on' : 'toggle-off'}`}
              aria-label="1:1 멘토링 허용 토글"
            >
              <span className="toggle-thumb" />
            </button>
            <span style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
              1:1 멘토링 허용
            </span>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="error-banner">{error}</p>}

          {/* 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="ghost-btn"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="accent-btn"
              style={{ padding: '9px 22px', fontSize: '13.5px', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
