'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuestion, deleteQuestion, closeQuestion } from '@/lib/questions';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { CATEGORY_META, QUESTION_TYPE_META, STATUS_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionDetail } from '@/types/question';
import type { UserProfile } from '@/types/user';
import MarkdownRenderer from '@/components/editor/MarkdownRenderer';
import AnswerList from '@/components/answer/AnswerList';

export default function QuestionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [answerKey, setAnswerKey] = useState(0);

  useEffect(() => {
    async function load() {
      const [qRes, uRes] = await Promise.all([
        getQuestion(Number(id)),
        getAccessToken() ? apiFetch<UserProfile>('/api/auth/me') : Promise.resolve({ success: false, data: null }),
      ]);

      if (qRes.success && qRes.data) setQuestion(qRes.data);
      if (uRes.success && uRes.data) setCurrentUser(uRes.data as UserProfile);

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
      <div className="page-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>불러오는 중...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="page-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <p style={{ fontSize: '3rem' }}>🔍</p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>질문을 찾을 수 없어요.</p>
        <button
          onClick={() => router.replace('/')}
          style={{ fontSize: '13px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
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
    <div className="page-root">
      <header className="page-header">
        <div style={{ margin: '0 auto', maxWidth: '760px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="page-back-btn" onClick={() => router.back()}>
            ← 목록으로
          </button>

          {isAuthor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {question.status !== 'CLOSED' && (
                <>
                  <button
                    onClick={() => router.push(`/questions/${id}/edit`)}
                    className="answer-action-btn"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={closing}
                    className="answer-action-btn answer-action-btn-warning"
                    style={{ opacity: closing ? 0.6 : 1 }}
                  >
                    {closing ? '마감 중...' : '마감'}
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="answer-action-btn answer-action-btn-danger"
                style={{ opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ margin: '0 auto', maxWidth: '760px', padding: '28px 24px' }}>
        <article className="question-article">
          {/* 배지 영역 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span
              className="badge"
              style={status.style}
            >
              {status.label}
            </span>
            <span
              className="badge"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {category.emoji} {category.label}
            </span>
            <span
              className="badge"
              style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              {type.emoji} {type.label}
            </span>
            {question.allowOneToOne && (
              <span
                className="badge"
                style={{ background: 'var(--status-open-bg)', color: 'var(--status-open)' }}
              >
                💬 1:1 가능
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: '14px',
          }}>
            {question.title}
          </h1>

          {/* 태그 */}
          {question.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {question.tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메타 */}
          <div
            className="question-meta"
            style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-faint)' }}
          >
            <span className="question-meta-author">{question.authorNickname}</span>
            <span>·</span>
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
          <MarkdownRenderer content={question.body} />
        </article>

        {/* 답변 섹션 */}
        <div style={{ marginTop: '32px' }}>
          <AnswerList
            key={answerKey}
            questionId={question.id}
            questionStatus={question.status}
            questionAuthorId={question.authorUserId}
            currentUserId={currentUser?.id ?? null}
            onAccepted={() => {
              setQuestion(prev => prev ? { ...prev, status: 'SOLVED' } : prev);
              setAnswerKey(k => k + 1);
            }}
          />
        </div>
      </main>
    </div>
  );
}
