'use client';

import { useState, useEffect, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Tag, Alert } from 'antd';
import { getAccessToken } from '@/lib/auth';
import { createQuestion } from '@/lib/questions';
import { CATEGORY_META, QUESTION_TYPE_META } from '@/lib/questionMeta';
import type { QuestionCategory, QuestionType } from '@/types/question';
import MarkdownEditor from '@/components/editor/MarkdownEditor';
import layoutStyles from '@/components/common/Layout.module.css';
import formStyles from '@/components/question/QuestionForm.module.css';

export default function NewQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<QuestionCategory | undefined>(undefined);
  const [questionType, setQuestionType] = useState<QuestionType | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadIds, setUploadIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
    }
  }, [router]);

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
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!body.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await createQuestion({
      title,
      body,
      category,
      questionType,
      tags,
      uploadIds,
    });

    if (res.success && res.data) {
      router.push(`/questions/${res.data.id}`);
    } else {
      setError(res.error?.message ?? '질문 등록에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div className={layoutStyles.pageRoot}>
      <header className={layoutStyles.pageHeader}>
        <div style={{ margin: '0 auto', maxWidth: '720px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button type="link" onClick={() => router.back()} style={{ padding: 0, height: 'auto', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            ← 돌아가기
          </Button>
          <span style={{ color: 'var(--border)', fontSize: '16px' }}>|</span>
          <h1 className={layoutStyles.pageTitle}>새 질문 작성</h1>
        </div>
      </header>

      <main className={layoutStyles.formPageMain}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 제목 */}
          <div className={formStyles.formField}>
            <label className={formStyles.formLabel}>
              제목 <span className={formStyles.formLabelRequired}>*</span>
            </label>
            <Input
              maxLength={120}
              showCount
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="질문을 한 줄로 요약해주세요"
            />
          </div>

          {/* 카테고리 + 질문 유형 */}
          <div className={layoutStyles.formGrid2}>
            <div className={formStyles.formField}>
              <label className={formStyles.formLabel}>
                카테고리 <span className={formStyles.formLabelRequired}>*</span>
              </label>
              <Select<QuestionCategory>
                value={category}
                onChange={v => setCategory(v)}
                placeholder="선택하세요"
                style={{ width: '100%' }}
                options={Object.entries(CATEGORY_META).map(([k, v]) => ({
                  label: `${v.emoji} ${v.label}`,
                  value: k,
                }))}
              />
            </div>

            <div className={formStyles.formField}>
              <label className={formStyles.formLabel}>
                질문 유형 <span className={formStyles.formLabelRequired}>*</span>
              </label>
              <Select<QuestionType>
                value={questionType}
                onChange={v => setQuestionType(v)}
                placeholder="선택하세요"
                style={{ width: '100%' }}
                options={Object.entries(QUESTION_TYPE_META).map(([k, v]) => ({
                  label: `${v.emoji} ${v.label}`,
                  value: k,
                }))}
              />
            </div>
          </div>

          {/* 내용 */}
          <div className={formStyles.formField}>
            <label className={formStyles.formLabel}>
              내용 <span className={formStyles.formLabelRequired}>*</span>
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              onUpload={id => setUploadIds(prev => [...prev, id])}
              placeholder="문제 상황, 시도한 것, 에러 메시지 등을 상세히 적어주세요&#10;&#10;이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로 첨부할 수 있어요"
              minRows={12}
              required
            />
          </div>

          {/* 태그 */}
          <div className={formStyles.formField}>
            <label className={formStyles.formLabel}>
              태그{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>
                (최대 5개 · Enter 또는 쉼표로 추가)
              </span>
            </label>
            <div className={formStyles.tagInputContainer}>
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => setTags(tags.filter(t => t !== tag))}
                  style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)', border: 'none', borderRadius: 999, fontSize: '12px' }}
                >
                  #{tag}
                </Tag>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  placeholder={tags.length === 0 ? '태그 입력...' : ''}
                  className={formStyles.tagInput}
                />
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <Alert type="error" message={error} showIcon />}

          {/* 버튼 */}
          <div className={layoutStyles.formActions}>
            <Button onClick={() => router.back()}>
              취소
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              질문 등록
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
