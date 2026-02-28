import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Flex, Tag, Typography, Spin, Divider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getQuestion, deleteQuestion, closeQuestion } from '@/lib/questions';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { CATEGORY_META, QUESTION_TYPE_META, STATUS_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionDetail } from '@/types/question';
import type { UserProfile } from '@/types/user';
import MarkdownRenderer from '@/components/editor/MarkdownRenderer';
import AnswerList from '@/components/answer/AnswerList';
import { useModal } from '@/components/common/ModalProvider';

const { Title, Text } = Typography;

export default function QuestionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const { confirm } = useModal();

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
    const ok = await confirm({
      title: '질문을 삭제할까요?',
      message: '삭제 후에는 복구할 수 없습니다.',
      variant: 'danger',
      confirmLabel: '삭제',
    });
    if (!ok) return;
    setDeleting(true);
    const res = await deleteQuestion(Number(id));
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setDeleting(false);
    }
  }

  async function handleClose() {
    const ok = await confirm({
      title: '질문을 마감할까요?',
      message: '마감 후에는 수정할 수 없습니다.',
      variant: 'warning',
      confirmLabel: '마감',
    });
    if (!ok) return;
    setClosing(true);
    const res = await closeQuestion(Number(id));
    if (res.success && res.data) {
      setQuestion(res.data);
    }
    setClosing(false);
  }

  if (loading) {
    return (
      <div className="page-root">
        <Flex align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="page-root">
        <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: '60vh' }}>
          <Text style={{ fontSize: '3rem', lineHeight: 1 }}>🔍</Text>
          <Text type="secondary" style={{ fontSize: 14 }}>질문을 찾을 수 없어요.</Text>
          <Button type="link" onClick={() => navigate('/', { replace: true })} style={{ fontSize: 13 }}>
            홈으로 돌아가기
          </Button>
        </Flex>
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
        <Flex
          align="center"
          justify="space-between"
          style={{ margin: '0 auto', maxWidth: '760px' }}
        >
          <Button
            type="link"
            onClick={() => navigate(-1)}
            style={{ padding: 0, height: 'auto', fontSize: '13px', color: 'var(--text-tertiary)' }}
          >
            ← 목록으로
          </Button>

          {isAuthor && (
            <Flex align="center" gap={8}>
              {question.status !== 'CLOSED' && (
                <>
                  <Button
                    size="small"
                    onClick={() => navigate(`/questions/${id}/edit`)}
                  >
                    수정
                  </Button>
                  <Button
                    size="small"
                    onClick={handleClose}
                    loading={closing}
                    style={{ borderColor: 'var(--warning-text)', color: 'var(--warning-text)' }}
                  >
                    마감
                  </Button>
                </>
              )}
              <Button
                size="small"
                danger
                onClick={handleDelete}
                loading={deleting}
              >
                삭제
              </Button>
            </Flex>
          )}
        </Flex>
      </header>

      <main className="detail-page-main">
        <article className="question-article">
          {/* 배지 영역 */}
          <Flex wrap align="center" gap={8} style={{ marginBottom: 18 }}>
            <Tag
              style={{
                ...status.style,
                borderRadius: 999,
                border: 'none',
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              {status.label}
            </Tag>
            <Tag
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                borderRadius: 999,
                border: 'none',
                fontSize: 11,
              }}
            >
              {category.emoji} {category.label}
            </Tag>
            <Tag
              style={{
                background: 'var(--warning-bg)',
                color: 'var(--warning-text)',
                borderRadius: 999,
                border: 'none',
                fontSize: 11,
              }}
            >
              {type.emoji} {type.label}
            </Tag>
            {question.allowOneToOne && (
              <Tag
                style={{
                  background: 'var(--status-open-bg)',
                  color: 'var(--status-open)',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 11,
                }}
              >
                💬 1:1 가능
              </Tag>
            )}
          </Flex>

          {/* 제목 */}
          <Title
            level={3}
            style={{ color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 14 }}
          >
            {question.title}
          </Title>

          {/* 태그 */}
          {question.tags.length > 0 && (
            <Flex wrap gap={6} style={{ marginBottom: 18 }}>
              {question.tags.map(tag => (
                <Tag
                  key={tag}
                  style={{
                    background: 'var(--tag-bg)',
                    color: 'var(--tag-text)',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  #{tag}
                </Tag>
              ))}
            </Flex>
          )}

          {/* 메타 */}
          <Flex
            align="center"
            gap={6}
            wrap
            className="question-meta"
            style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-faint)' }}
          >
            <Text strong className="question-meta-author">{question.authorNickname}</Text>
            <Text type="secondary">·</Text>
            <Text type="secondary">👁 {question.viewCount.toLocaleString()} 조회</Text>
            <Text type="secondary">·</Text>
            <Text type="secondary">{relativeTime(question.createdAt)}</Text>
            {question.updatedAt !== question.createdAt && (
              <>
                <Text type="secondary">·</Text>
                <Text type="secondary">수정됨 {relativeTime(question.updatedAt)}</Text>
              </>
            )}
          </Flex>

          {/* 본문 */}
          <MarkdownRenderer content={question.body} />
        </article>

        {/* 답변 섹션 */}
        <div style={{ marginTop: 32 }}>
          <AnswerList
            questionId={question.id}
            questionStatus={question.status}
            questionAuthorId={question.authorUserId}
            currentUserId={currentUser?.id ?? null}
            onAccepted={() => setQuestion(prev => prev ? { ...prev, status: 'SOLVED' } : prev)}
          />
        </div>
      </main>
    </div>
  );
}
