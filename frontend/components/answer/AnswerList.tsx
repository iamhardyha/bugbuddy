'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import {
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  addHelpful,
  removeHelpful,
} from '@/lib/answers';
import { relativeTime } from '@/lib/questionMeta';
import type { Answer } from '@/types/answer';
import type { QuestionStatus } from '@/types/question';
import MarkdownRenderer from '@/components/editor/MarkdownRenderer';
import MarkdownEditor from '@/components/editor/MarkdownEditor';
import { useModal } from '@/components/common/ModalProvider';

interface Props {
  questionId: number;
  questionStatus: QuestionStatus;
  questionAuthorId: number;
  currentUserId: number | null;
  onAccepted: () => void;
}

export default function AnswerList({
  questionId,
  questionStatus,
  questionAuthorId,
  currentUserId,
  onAccepted,
}: Props) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  const [writeBody, setWriteBody] = useState('');
  const [writeUploadIds, setWriteUploadIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editUploadIds, setEditUploadIds] = useState<number[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [reacted, setReacted] = useState<Set<number>>(new Set());

  const { confirm } = useModal();
  const isLoggedIn = !!getAccessToken();
  const canWrite = isLoggedIn && questionStatus !== 'CLOSED';
  const isQuestionAuthor = currentUserId === questionAuthorId;

  useEffect(() => {
    getAnswers(questionId).then(res => {
      if (res.success && res.data) {
        setAnswers(res.data.content);
      }
      setLoading(false);
    });
  }, [questionId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!writeBody.trim()) return;
    setSubmitting(true);
    const res = await createAnswer(questionId, { body: writeBody, uploadIds: writeUploadIds });
    if (res.success && res.data) {
      setAnswers(prev => [...prev, res.data!]);
      setWriteBody('');
      setWriteUploadIds([]);
    }
    setSubmitting(false);
  }

  function startEdit(answer: Answer) {
    setEditingId(answer.id);
    setEditBody(answer.body);
    setEditUploadIds([]);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody('');
    setEditUploadIds([]);
  }

  async function handleUpdate(answerId: number) {
    if (!editBody.trim()) return;
    setEditSubmitting(true);
    const res = await updateAnswer(questionId, answerId, { body: editBody, uploadIds: editUploadIds });
    if (res.success && res.data) {
      setAnswers(prev => prev.map(a => (a.id === answerId ? res.data! : a)));
      setEditingId(null);
      setEditUploadIds([]);
    }
    setEditSubmitting(false);
  }

  async function handleDelete(answerId: number) {
    const ok = await confirm({
      title: '답변을 삭제할까요?',
      message: '삭제 후에는 복구할 수 없습니다.',
      variant: 'danger',
      confirmLabel: '삭제',
    });
    if (!ok) return;
    const res = await deleteAnswer(questionId, answerId);
    if (res.success) {
      setAnswers(prev => prev.filter(a => a.id !== answerId));
    }
  }

  async function handleAccept(answerId: number) {
    const ok = await confirm({
      title: '이 답변을 채택할까요?',
      message: '채택 후에는 변경할 수 없습니다.',
      variant: 'success',
      confirmLabel: '채택',
    });
    if (!ok) return;
    const res = await acceptAnswer(questionId, answerId);
    if (res.success && res.data) {
      setAnswers(prev => prev.map(a => (a.id === answerId ? res.data! : a)));
      onAccepted();
    }
  }

  async function handleHelpful(answer: Answer) {
    const alreadyReacted = reacted.has(answer.id);
    if (alreadyReacted) {
      const res = await removeHelpful(questionId, answer.id);
      if (res.success && res.data) {
        setAnswers(prev => prev.map(a => (a.id === answer.id ? res.data! : a)));
        setReacted(prev => {
          const next = new Set(prev);
          next.delete(answer.id);
          return next;
        });
      }
    } else {
      const res = await addHelpful(questionId, answer.id);
      if (res.success && res.data) {
        setAnswers(prev => prev.map(a => (a.id === answer.id ? res.data! : a)));
        setReacted(prev => new Set(prev).add(answer.id));
      }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        답변 불러오는 중...
      </div>
    );
  }

  const sorted = [...answers].sort((a, b) => {
    if (a.accepted && !b.accepted) return -1;
    if (!a.accepted && b.accepted) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 답변 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>답변</h2>
        <span
          className="badge badge-neutral"
          style={{ fontSize: '11.5px', padding: '2px 8px' }}
        >
          {answers.length}
        </span>
      </div>

      {/* 답변 목록 */}
      {sorted.length === 0 ? (
        <div
          style={{
            borderRadius: '12px',
            border: '1px dashed var(--border)',
            background: 'var(--bg-subtle)',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            아직 답변이 없어요. 첫 번째 답변을 남겨보세요!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sorted.map(answer => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              currentUserId={currentUserId}
              isQuestionAuthor={isQuestionAuthor}
              questionStatus={questionStatus}
              isReacted={reacted.has(answer.id)}
              isEditing={editingId === answer.id}
              editBody={editBody}
              editSubmitting={editSubmitting}
              onEditBodyChange={setEditBody}
              onEditUpload={id => setEditUploadIds(prev => [...prev, id])}
              onStartEdit={() => startEdit(answer)}
              onCancelEdit={cancelEdit}
              onUpdate={() => handleUpdate(answer.id)}
              onDelete={() => handleDelete(answer.id)}
              onAccept={() => handleAccept(answer.id)}
              onHelpful={() => handleHelpful(answer)}
            />
          ))}
        </div>
      )}

      {/* 답변 작성 폼 */}
      {canWrite ? (
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid var(--border-faint)',
            background: 'var(--bg-surface)',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            답변 작성
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <MarkdownEditor
              value={writeBody}
              onChange={setWriteBody}
              onUpload={id => setWriteUploadIds(prev => [...prev, id])}
              placeholder="답변을 마크다운으로 작성하세요&#10;이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로 첨부할 수 있어요"
              minRows={8}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting || !writeBody.trim()}
                className="accent-btn"
                style={{ padding: '9px 20px', fontSize: '13px', opacity: (submitting || !writeBody.trim()) ? 0.5 : 1 }}
              >
                {submitting ? '등록 중...' : '답변 등록'}
              </button>
            </div>
          </form>
        </div>
      ) : !isLoggedIn ? (
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid var(--border-faint)',
            background: 'var(--bg-subtle)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            답변을 작성하려면{' '}
            <a
              href="http://localhost:8080/oauth2/authorization/github"
              style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              로그인
            </a>
            이 필요해요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ── 개별 답변 카드 ──────────────────────────────────────────────────────────

interface AnswerCardProps {
  answer: Answer;
  currentUserId: number | null;
  isQuestionAuthor: boolean;
  questionStatus: QuestionStatus;
  isReacted: boolean;
  isEditing: boolean;
  editBody: string;
  editSubmitting: boolean;
  onEditBodyChange: (v: string) => void;
  onEditUpload: (uploadId: number) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onAccept: () => void;
  onHelpful: () => void;
}

function AnswerCard({
  answer,
  currentUserId,
  isQuestionAuthor,
  questionStatus,
  isReacted,
  isEditing,
  editBody,
  editSubmitting,
  onEditBodyChange,
  onEditUpload,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onAccept,
  onHelpful,
}: AnswerCardProps) {
  const isOwn = currentUserId === answer.authorUserId;
  const canAccept = isQuestionAuthor && questionStatus === 'OPEN' && !answer.accepted;
  const canReact = currentUserId !== null && !isOwn;

  return (
    <article
      className={`answer-card ${answer.accepted ? 'answer-card-accepted' : ''}`}
    >
      {/* 채택 배지 */}
      {answer.accepted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: 'var(--status-open)' }}>
          <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>채택된 답변</span>
        </div>
      )}

      {/* 메타 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {answer.authorSnapshotRole === 'MENTOR' && (
          <span
            className="badge"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: '11px' }}
          >
            🎓 멘토
          </span>
        )}
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {answer.authorNickname}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>·</span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {relativeTime(answer.createdAt)}
        </span>
        {answer.updatedAt !== answer.createdAt && (
          <>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              수정됨 {relativeTime(answer.updatedAt)}
            </span>
          </>
        )}
      </div>

      {/* 본문 or 수정 폼 */}
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <MarkdownEditor
            value={editBody}
            onChange={onEditBodyChange}
            onUpload={onEditUpload}
            minRows={6}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onCancelEdit}
              className="ghost-btn"
              style={{ padding: '6px 16px', fontSize: '12px' }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={onUpdate}
              disabled={editSubmitting || !editBody.trim()}
              className="accent-btn"
              style={{ padding: '6px 16px', fontSize: '12px', opacity: (editSubmitting || !editBody.trim()) ? 0.5 : 1 }}
            >
              {editSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <MarkdownRenderer content={answer.body} />
      )}

      {/* 액션 바 */}
      {!isEditing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-faint)',
          }}
        >
          {/* 도움됐어요 */}
          <button
            type="button"
            onClick={canReact ? onHelpful : undefined}
            disabled={!canReact}
            className={`helpful-btn ${isReacted ? 'reacted' : ''}`}
            title={!canReact && currentUserId !== null ? '본인 답변에는 반응할 수 없어요' : undefined}
          >
            <svg
              style={{ width: '14px', height: '14px' }}
              fill={isReacted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            도움됐어요
            {answer.helpfulCount > 0 && (
              <span style={{ fontWeight: 700 }}>{answer.helpfulCount}</span>
            )}
          </button>

          {/* 채택 + 수정/삭제 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {canAccept && (
              <button
                type="button"
                onClick={onAccept}
                className="answer-action-btn answer-action-btn-success"
              >
                ✓ 채택
              </button>
            )}
            {isOwn && (
              <>
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="answer-action-btn"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="answer-action-btn answer-action-btn-danger"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
