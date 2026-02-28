'use client';

import { useEffect, useState } from 'react';
import { Button, Flex, Typography, Tag, Divider } from 'antd';
import {
  CheckCircleFilled,
  LikeFilled,
  LikeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  MessageOutlined,
} from '@ant-design/icons';
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

const { Title, Text } = Typography;

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
        const content = res.data.content;
        setAnswers(content);
        setReacted(new Set(content.filter(a => a.myHelpful).map(a => a.id)));
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
      <Flex justify="center" style={{ padding: '32px 0' }}>
        <Text type="secondary" style={{ fontSize: '13px' }}>답변 불러오는 중...</Text>
      </Flex>
    );
  }

  const sorted = [...answers].sort((a, b) => {
    if (a.accepted && !b.accepted) return -1;
    if (!a.accepted && b.accepted) return 1;
    return 0;
  });

  return (
    <Flex vertical gap={24}>
      {/* 답변 헤더 */}
      <Flex align="center" gap={10}>
        <Title level={5} style={{ margin: 0, color: 'var(--text-primary)' }}>답변</Title>
        <Tag style={{ fontSize: '11.5px', padding: '2px 8px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'none', borderRadius: 999 }}>
          {answers.length}
        </Tag>
      </Flex>

      {/* 답변 목록 */}
      {sorted.length === 0 ? (
        <Flex
          vertical
          align="center"
          justify="center"
          style={{
            borderRadius: '12px',
            border: '1px dashed var(--border)',
            background: 'var(--bg-subtle)',
            padding: '48px 24px',
          }}
        >
          <Text style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }}>
            <MessageOutlined />
          </Text>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            아직 답변이 없어요. 첫 번째 답변을 남겨보세요!
          </Text>
        </Flex>
      ) : (
        <Flex vertical gap={16}>
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
        </Flex>
      )}

      {/* 답변 작성 폼 */}
      {canWrite ? (
        <div className="answer-write-card">
          <Title level={5} style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
            답변 작성
          </Title>
          <form onSubmit={handleCreate}>
            <Flex vertical gap={14}>
              <MarkdownEditor
                value={writeBody}
                onChange={setWriteBody}
                onUpload={id => setWriteUploadIds(prev => [...prev, id])}
                placeholder="답변을 마크다운으로 작성하세요&#10;이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로 첨부할 수 있어요"
                minRows={8}
                required
              />
              <Flex justify="flex-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  disabled={!writeBody.trim()}
                >
                  답변 등록
                </Button>
              </Flex>
            </Flex>
          </form>
        </div>
      ) : !isLoggedIn ? (
        <div className="answer-login-card">
          <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
          </Text>
        </div>
      ) : null}
    </Flex>
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
    <article className={`answer-card ${answer.accepted ? 'answer-card-accepted' : ''}`}>
      {/* 채택 배지 */}
      {answer.accepted && (
        <Flex align="center" gap={6} style={{ marginBottom: '16px', color: 'var(--status-open)' }}>
          <CheckCircleFilled style={{ fontSize: '16px' }} />
          <Text style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-open)' }}>채택된 답변</Text>
        </Flex>
      )}

      {/* 메타 */}
      <Flex align="center" gap={8} wrap style={{ marginBottom: '16px' }}>
        {answer.authorSnapshotRole === 'MENTOR' && (
          <Tag
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: '11px', border: 'none' }}
          >
            🎓 멘토
          </Tag>
        )}
        <Text strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {answer.authorNickname}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>·</Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {relativeTime(answer.createdAt)}
        </Text>
        {answer.updatedAt !== answer.createdAt && (
          <>
            <Text type="secondary" style={{ fontSize: '12px' }}>·</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              수정됨 {relativeTime(answer.updatedAt)}
            </Text>
          </>
        )}
      </Flex>

      {/* 본문 or 수정 폼 */}
      {isEditing ? (
        <Flex vertical gap={12}>
          <MarkdownEditor
            value={editBody}
            onChange={onEditBodyChange}
            onUpload={onEditUpload}
            minRows={6}
            required
          />
          <Flex justify="flex-end" gap={8}>
            <Button onClick={onCancelEdit} size="small">
              취소
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={onUpdate}
              loading={editSubmitting}
              disabled={!editBody.trim()}
            >
              저장
            </Button>
          </Flex>
        </Flex>
      ) : (
        <MarkdownRenderer content={answer.body} />
      )}

      {/* 액션 바 */}
      {!isEditing && (
        <>
          <Divider style={{ margin: '14px 0 10px', borderColor: 'var(--border-faint)' }} />
          <Flex align="center" justify="space-between" wrap gap={8}>
            {/* 도움됐어요 */}
            <Button
              variant="outlined"
              size="small"
              icon={isReacted ? <LikeFilled /> : <LikeOutlined />}
              onClick={canReact ? onHelpful : undefined}
              disabled={!canReact}
              title={!canReact && currentUserId !== null ? '본인 답변에는 반응할 수 없어요' : undefined}
              style={isReacted ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
            >
              도움됐어요
              {answer.helpfulCount > 0 && (
                <Text strong style={{ marginLeft: 4, fontSize: '12px', color: 'inherit' }}>
                  {answer.helpfulCount}
                </Text>
              )}
            </Button>

            {/* 채택 + 수정/삭제 */}
            <Flex gap={8}>
              {canAccept && (
                <Button
                  variant="outlined"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={onAccept}
                  style={{ color: 'var(--status-open)', borderColor: 'var(--status-open)' }}
                >
                  채택
                </Button>
              )}
              {isOwn && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={onStartEdit}
                  >
                    수정
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onDelete}
                  >
                    삭제
                  </Button>
                </>
              )}
            </Flex>
          </Flex>
        </>
      )}
    </article>
  );
}
