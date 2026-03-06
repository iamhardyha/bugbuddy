'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Avatar, Button, Flex, Progress, Spin, Tabs, Tag, Typography,
} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import QuestionCard from '@/components/question/QuestionCard';
import { getPublicProfile, getUserQuestions, getUserAnswers, getUserStats } from '@/lib/users';
import { getLevelMeta, getXpProgress } from '@/lib/userMeta';
import { relativeTime } from '@/lib/questionMeta';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import type { PublicProfile, UserStats, UserAnswerSummary, UserProfile } from '@/types/user';
import type { QuestionSummary } from '@/types/question';

const { Title, Text } = Typography;

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(params.id);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [questionsPage, setQuestionsPage] = useState(0);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [answers, setAnswers] = useState<UserAnswerSummary[]>([]);
  const [answersPage, setAnswersPage] = useState(0);
  const [answersTotal, setAnswersTotal] = useState(0);
  const [answersLoading, setAnswersLoading] = useState(false);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    async function load() {
      const [profileRes, userRes] = await Promise.all([
        getPublicProfile(userId),
        getAccessToken() ? apiFetch<UserProfile>('/api/auth/me') : Promise.resolve({ success: false, data: null }),
      ]);
      if (profileRes.success && profileRes.data) setProfile(profileRes.data);
      if (userRes.success && userRes.data) setCurrentUser(userRes.data as UserProfile);
      setLoading(false);
    }
    load();
  }, [userId]);

  useEffect(() => {
    if (!profile) return;
    async function init() {
      setQuestionsLoading(true);
      const res = await getUserQuestions(profile!.id, 0);
      if (res.success && res.data) {
        setQuestions(res.data.content);
        setQuestionsTotal(res.data.totalElements);
        setQuestionsPage(0);
      }
      setQuestionsLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function loadQuestions(page: number) {
    setQuestionsLoading(true);
    const res = await getUserQuestions(userId, page);
    if (res.success && res.data) {
      if (page === 0) setQuestions(res.data.content);
      else setQuestions(prev => [...prev, ...res.data!.content]);
      setQuestionsTotal(res.data.totalElements);
      setQuestionsPage(page);
    }
    setQuestionsLoading(false);
  }

  async function loadAnswers(page: number) {
    setAnswersLoading(true);
    const res = await getUserAnswers(userId, page);
    if (res.success && res.data) {
      if (page === 0) setAnswers(res.data.content);
      else setAnswers(prev => [...prev, ...res.data!.content]);
      setAnswersTotal(res.data.totalElements);
      setAnswersPage(page);
    }
    setAnswersLoading(false);
  }

  async function loadStats() {
    if (stats) return;
    const res = await getUserStats(userId);
    if (res.success && res.data) setStats(res.data);
  }

  function handleTabChange(key: string) {
    setActiveTab(key);
    if (key === 'answers' && answers.length === 0) loadAnswers(0);
    if (key === 'stats') loadStats();
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

  if (!profile) {
    return (
      <div className="page-root">
        <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: '60vh' }}>
          <Text style={{ fontSize: '3rem', lineHeight: 1 }}>🔍</Text>
          <Text type="secondary" style={{ fontSize: 14 }}>사용자를 찾을 수 없어요.</Text>
          <Button type="link" onClick={() => router.replace('/')}>홈으로 돌아가기</Button>
        </Flex>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const levelMeta = getLevelMeta(profile.level);
  const xpProgress = getXpProgress(profile.xp, profile.level);

  return (
    <div className="page-root">
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {/* Profile Card */}
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--border-faint)',
            background: 'var(--bg-surface)',
            padding: '32px 28px',
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Flex align="flex-start" gap={24} wrap>
            {/* Avatar */}
            <Avatar
              size={72}
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                border: '2px solid var(--accent-ring)',
                fontSize: 28,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {profile.nickname.charAt(0).toUpperCase()}
            </Avatar>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Flex align="center" gap={8} wrap style={{ marginBottom: 6 }}>
                <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 20 }}>
                  {profile.nickname}
                </Title>

                {/* Level badge */}
                <span className="badge badge-accent" style={{ fontSize: 12 }}>
                  {levelMeta.emoji} Lv.{profile.level} {levelMeta.name}
                </span>

                {/* Mentor badge */}
                {profile.isMentor && (
                  <span className="badge badge-success" style={{ fontSize: 12 }}>
                    🎓 인증 멘토
                  </span>
                )}
              </Flex>

              {/* Bio */}
              <Text
                style={{
                  display: 'block',
                  color: profile.bio ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                  fontSize: 13.5,
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                {profile.bio ?? '자기소개가 없습니다.'}
              </Text>

              {/* XP Progress */}
              <div style={{ marginBottom: 14 }}>
                <Flex justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                    경험치 {profile.xp.toLocaleString()} XP
                  </Text>
                  {xpProgress.percent < 100 && (
                    <Text style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                      다음 레벨까지 {(xpProgress.next - xpProgress.current).toLocaleString()} XP
                    </Text>
                  )}
                </Flex>
                <Progress
                  percent={xpProgress.percent}
                  showInfo={false}
                  strokeColor="var(--accent)"
                  trailColor="var(--bg-elevated)"
                  size={{ height: 5 }}
                />
              </div>

              {/* Stats row */}
              <Flex align="center" gap={16} wrap>
                <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile.questionCount}</span> 질문
                </Text>
                <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile.answerCount}</span> 답변
                </Text>
                {profile.isMentor && profile.mentorAvgRating != null && (
                  <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    ⭐ 멘토{' '}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {Number(profile.mentorAvgRating).toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {' '}({profile.mentorRatingCount}개)
                    </span>
                  </Text>
                )}
                {profile.menteeAvgRating != null && (
                  <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    ⭐ 멘티{' '}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {Number(profile.menteeAvgRating).toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {' '}({profile.menteeRatingCount}개)
                    </span>
                  </Text>
                )}

                {isOwnProfile && (
                  <Button
                    type="default"
                    size="small"
                    onClick={() => router.push('/settings/profile')}
                    style={{ marginLeft: 'auto', fontSize: 12 }}
                  >
                    프로필 수정
                  </Button>
                )}
              </Flex>
            </div>
          </Flex>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'questions',
              label: `질문 ${profile.questionCount}`,
              children: (
                <QuestionsTab
                  questions={questions}
                  total={questionsTotal}
                  loading={questionsLoading}
                  onLoadMore={() => loadQuestions(questionsPage + 1)}
                />
              ),
            },
            {
              key: 'answers',
              label: `답변 ${profile.answerCount}`,
              children: (
                <AnswersTab
                  answers={answers}
                  total={answersTotal}
                  loading={answersLoading}
                  onLoadMore={() => loadAnswers(answersPage + 1)}
                />
              ),
            },
            {
              key: 'stats',
              label: '통계',
              children: <StatsTab stats={stats} />,
            },
          ]}
        />
      </main>
    </div>
  );
}

/* ── Sub-components ───────────────────────── */

function QuestionsTab({
  questions, total, loading, onLoadMore,
}: {
  questions: QuestionSummary[];
  total: number;
  loading: boolean;
  onLoadMore: () => void;
}) {
  if (loading && questions.length === 0) {
    return (
      <Flex justify="center" style={{ padding: '40px 0' }}>
        <Spin indicator={<LoadingOutlined spin />} />
      </Flex>
    );
  }
  if (questions.length === 0) {
    return (
      <Flex vertical align="center" gap={8} style={{ padding: '48px 0', color: 'var(--text-tertiary)' }}>
        <span style={{ fontSize: 32 }}>📭</span>
        <Text style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>아직 작성한 질문이 없어요.</Text>
      </Flex>
    );
  }
  const hasMore = questions.length < total;
  return (
    <Flex vertical gap={8}>
      {questions.map(q => <QuestionCard key={q.id} question={q} />)}
      {hasMore && (
        <Flex justify="center" style={{ paddingTop: 8 }}>
          <Button onClick={onLoadMore} loading={loading} style={{ fontSize: 13 }}>
            더 보기
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

function AnswersTab({
  answers, total, loading, onLoadMore,
}: {
  answers: UserAnswerSummary[];
  total: number;
  loading: boolean;
  onLoadMore: () => void;
}) {
  if (loading && answers.length === 0) {
    return (
      <Flex justify="center" style={{ padding: '40px 0' }}>
        <Spin indicator={<LoadingOutlined spin />} />
      </Flex>
    );
  }
  if (answers.length === 0) {
    return (
      <Flex vertical align="center" gap={8} style={{ padding: '48px 0' }}>
        <span style={{ fontSize: 32 }}>📭</span>
        <Text style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>아직 작성한 답변이 없어요.</Text>
      </Flex>
    );
  }
  const hasMore = answers.length < total;
  return (
    <Flex vertical gap={8}>
      {answers.map(a => (
        <Link
          key={a.id}
          href={`/questions/${a.questionId}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="answer-card"
            style={{ cursor: 'pointer', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-faint)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            <Flex align="flex-start" gap={12}>
              <Flex vertical gap={10} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={8} wrap>
                  {a.accepted && (
                    <Tag
                      style={{
                        borderRadius: 20, background: 'var(--status-open-bg)',
                        color: 'var(--status-open)', border: 'none', fontSize: 11, fontWeight: 600,
                      }}
                    >
                      ✓ 채택됨
                    </Tag>
                  )}
                  {a.authorSnapshotRole === 'MENTOR' && (
                    <Tag
                      style={{
                        borderRadius: 20, background: 'var(--accent-subtle)',
                        color: 'var(--accent)', border: 'none', fontSize: 11,
                      }}
                    >
                      🎓 멘토
                    </Tag>
                  )}
                  <Text style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {relativeTime(a.createdAt)}
                  </Text>
                </Flex>

                <Text
                  style={{
                    fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65,
                    display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                  }}
                >
                  {a.body}
                </Text>

                <Text style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  👍 도움됐어요 {a.helpfulCount}
                </Text>
              </Flex>
            </Flex>
          </div>
        </Link>
      ))}
      {hasMore && (
        <Flex justify="center" style={{ paddingTop: 8 }}>
          <Button onClick={onLoadMore} loading={loading} style={{ fontSize: 13 }}>
            더 보기
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

function StatsTab({ stats }: { stats: UserStats | null }) {
  if (!stats) {
    return (
      <Flex justify="center" style={{ padding: '40px 0' }}>
        <Spin indicator={<LoadingOutlined spin />} />
      </Flex>
    );
  }

  const items = [
    { label: '질문한 글', value: stats.questionCount, emoji: '❓' },
    { label: '답변한 글', value: stats.answerCount, emoji: '💬' },
    { label: '도움됐어요 받음', value: stats.helpfulReceivedCount, emoji: '👍' },
    { label: '채택된 답변', value: stats.acceptedAnswerCount, emoji: '✅' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        padding: '4px 0',
      }}
    >
      {items.map(item => (
        <div
          key={item.label}
          style={{
            borderRadius: 12,
            border: '1px solid var(--border-faint)',
            background: 'var(--bg-surface)',
            padding: '20px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Text style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{item.emoji}</Text>
          <Text
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'block',
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {item.value.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
            {item.label}
          </Text>
        </div>
      ))}
    </div>
  );
}
