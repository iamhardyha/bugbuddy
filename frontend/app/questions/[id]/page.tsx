'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Flex, Tag, Typography, Spin } from 'antd';
import { LoadingOutlined, EyeOutlined } from '@ant-design/icons';
import { getQuestion, deleteQuestion, closeQuestion, getQuestions } from '@/lib/questions';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { CATEGORY_META, QUESTION_TYPE_META, STATUS_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionDetail, QuestionSummary } from '@/types/question';
import type { UserProfile } from '@/types/user';
import MarkdownRenderer from '@/components/editor/MarkdownRenderer';
import AnswerList from '@/components/answer/AnswerList';
import { useModal } from '@/components/common/ModalProvider';
import styles from '@/components/question/QuestionDetail.module.css';
import layoutStyles from '@/components/profile/DetailLayout.module.css';

const { Title, Text } = Typography;

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<QuestionSummary[]>([]);
  const { confirm } = useModal();

  useEffect(() => {
    async function load() {
      const isLoggedIn = !!getAccessToken();
      const [qRes, uRes] = await Promise.all([
        getQuestion(Number(id)),
        isLoggedIn ? apiFetch<UserProfile>('/api/auth/me') : Promise.resolve({ success: false, data: null }),
      ]);

      if (qRes.success && qRes.data) {
        setQuestion(qRes.data);
        // 같은 카테고리의 유사 질문 로드
        const simRes = await getQuestions({ category: qRes.data.category, size: 4 });
        if (simRes.success && simRes.data) {
          // 현재 질문 제외
          setSimilarQuestions(simRes.data.content.filter(q => q.id !== qRes.data!.id).slice(0, 3));
        }
      }
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
      router.replace('/');
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
          <Button type="link" onClick={() => router.replace('/')} style={{ fontSize: 13 }}>
            홈으로 돌아가기
          </Button>
        </Flex>
      </div>
    );
  }

  const isLoggedIn = !!getAccessToken();
  const isAuthor = currentUser?.id === question.authorUserId;

  const status = STATUS_META[question.status];
  const category = CATEGORY_META[question.category];
  const type = QUESTION_TYPE_META[question.questionType];

  return (
    <div className="page-root">
      {/* 브레드크럼 헤더 */}
      <header className="page-header">
        <Flex
          align="center"
          justify="space-between"
          style={{ margin: '0 auto', maxWidth: '1080px' }}
        >
          {/* 브레드크럼 */}
          <Flex align="center" gap={6} style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            <Link href="/" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/questions" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Questions</Link>
            <span>›</span>
            <span style={{ color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {question.title}
            </span>
          </Flex>
        </Flex>
      </header>

      {/* 2컬럼 레이아웃 */}
      <div className={layoutStyles.root}>
        {/* 왼쪽: 질문 + 답변 */}
        <div>
          <article className={styles.article}>
            {/* 배지 + 마감 버튼 영역 */}
            <Flex wrap align="center" justify="space-between" gap={8} style={{ marginBottom: 18 }}>
              <Flex wrap align="center" gap={8}>
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
                  {category.label}
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
                  {type.label}
                </Tag>
              </Flex>
              {isAuthor && question.status !== 'CLOSED' && (
                <Button
                  size="small"
                  onClick={handleClose}
                  loading={closing}
                  style={{ borderColor: 'var(--warning-text)', color: 'var(--warning-text)' }}
                >
                  마감
                </Button>
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
              className={styles.meta}
              style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-faint)' }}
            >
              <Text strong className={styles.metaAuthor}>{question.authorNickname}</Text>
              <Text type="secondary">·</Text>
              <Text type="secondary"><EyeOutlined style={{ marginRight: 4 }} />{question.viewCount.toLocaleString()} 조회</Text>
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

            {/* 수정/삭제 액션 바 */}
            {isAuthor && (
              <Flex
                align="center"
                justify="space-between"
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-faint)',
                }}
              >
                {question.status !== 'CLOSED' ? (
                  <Button
                    size="small"
                    onClick={() => router.push(`/questions/${id}/edit`)}
                  >
                    수정
                  </Button>
                ) : (
                  <span />
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
        </div>

        {/* 오른쪽: 사이드바 */}
        <aside style={{ position: 'sticky', top: 'calc(var(--global-header-height) + 24px)' }}>
          {/* Question Author 카드 */}
          <div className={layoutStyles.sidebarCard} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 12 }}>
              Question Author
            </Text>
            <Flex align="center" gap={10} style={{ marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {question.authorNickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>
                  @{question.authorNickname}
                </Text>
              </div>
            </Flex>
            <Button type="default" block size="small" onClick={() => router.push(`/users/${question.authorUserId}`)}>
              View Full Portfolio
            </Button>
          </div>

          {/* Similar Questions 카드 */}
          {similarQuestions.length > 0 && (
            <div className={layoutStyles.sidebarCard} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 12 }}>
                Similar Questions
              </Text>
              <Flex vertical gap={10}>
                {similarQuestions.map(q => (
                  <Link key={q.id} href={`/questions/${q.id}`} style={{ textDecoration: 'none' }}>
                    <Text style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                      {q.title}
                    </Text>
                  </Link>
                ))}
              </Flex>
            </div>
          )}

          {/* Join the Elite 카드 */}
          {isLoggedIn && currentUser?.mentorStatus !== 'APPROVED' && (
            <div className={layoutStyles.sidebarCard} style={{ background: '#2563eb', border: 'none' }}>
              <Text strong style={{ fontSize: 14, color: '#ffffff', display: 'block', marginBottom: 6 }}>
                Join the Elite
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, display: 'block', marginBottom: 12 }}>
                Become a Verified Mentor and help others grow while earning exclusive rewards and XP.
              </Text>
              <button
                onClick={() => router.push('/settings/profile')}
                style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Apply for Mentorship
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
