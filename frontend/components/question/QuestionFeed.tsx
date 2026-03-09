'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Skeleton, Typography, Progress } from 'antd';
import {
  AppstoreOutlined,
  ApiOutlined,
  LayoutOutlined,
  CloudOutlined,
  MobileOutlined,
  RobotOutlined,
  BranchesOutlined,
  RiseOutlined,
  CompassOutlined,
  EllipsisOutlined,
  HomeOutlined,
  FireOutlined,
  TeamOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import QuestionCard from './QuestionCard';
import { getQuestions } from '@/lib/questions';
import { getAccessToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { getLevelMeta, getXpProgress } from '@/lib/userMeta';
import type { QuestionSummary, QuestionCategory, QuestionStatus } from '@/types/question';
import type { UserProfile } from '@/types/user';
import type { ReactNode } from 'react';

const { Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = QuestionCategory | typeof ALL;

const CATEGORIES: { value: CategoryFilter; label: string; icon: ReactNode }[] = [
  { value: ALL,         label: '전체',          icon: <AppstoreOutlined /> },
  { value: 'BACKEND',   label: '백엔드',        icon: <ApiOutlined /> },
  { value: 'FRONTEND',  label: '프론트엔드',    icon: <LayoutOutlined /> },
  { value: 'DEVOPS',    label: 'DevOps',        icon: <CloudOutlined /> },
  { value: 'MOBILE',    label: '모바일',        icon: <MobileOutlined /> },
  { value: 'AI_DATA',   label: 'AI / 데이터',   icon: <RobotOutlined /> },
  { value: 'CS_ALGO',   label: 'CS / 알고리즘', icon: <BranchesOutlined /> },
  { value: 'CAREER',    label: '커리어',        icon: <RiseOutlined /> },
  { value: 'FUTURE',    label: '미래 고민',     icon: <CompassOutlined /> },
  { value: 'ETC',       label: '기타',          icon: <EllipsisOutlined /> },
];

const CATEGORY_ACCENT: Partial<Record<CategoryFilter, string>> = {
  BACKEND:  '#7c65f6',
  FRONTEND: '#4ea8de',
  DEVOPS:   '#f5a623',
  MOBILE:   '#34c784',
  AI_DATA:  '#e85d5d',
  CS_ALGO:  '#a78bfa',
  CAREER:   '#60a5fa',
  FUTURE:   '#4ade80',
  ETC:      '#8888a8',
  ALL:      'var(--accent)',
};

type FeedTab = 'all' | 'open' | 'solved' | 'closed';

const FEED_TABS: { value: FeedTab; label: string; status?: QuestionStatus }[] = [
  { value: 'all',    label: '전체' },
  { value: 'open',   label: '진행중',  status: 'OPEN' },
  { value: 'solved', label: '해결됨',  status: 'SOLVED' },
  { value: 'closed', label: '마감됨',  status: 'CLOSED' },
];

export default function QuestionFeed() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showFab, setShowFab] = useState(false);
  const inlineBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const loggedIn = !!getAccessToken();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      apiFetch<UserProfile>('/api/auth/me')
        .then(res => { if (res.success && res.data) setCurrentUser(res.data); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const el = inlineBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoggedIn]);

  const currentStatus = FEED_TABS.find(t => t.value === activeTab)?.status;

  useEffect(() => {
    setLoading(true);
    setPage(0);
    getQuestions({
      category: category === ALL ? undefined : category,
      status: currentStatus,
      page: 0,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(res.data.content);
        setHasMore(!res.data.last);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, activeTab, currentStatus]);

  function handleLoadMore() {
    const next = page + 1;
    setLoadingMore(true);
    getQuestions({
      category: category === ALL ? undefined : category,
      status: currentStatus,
      page: next,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(prev => [...prev, ...res.data!.content]);
        setHasMore(!res.data.last);
        setPage(next);
      }
      setLoadingMore(false);
    }).catch(() => setLoadingMore(false));
  }

  const xpProgress = currentUser ? getXpProgress(currentUser.xp, currentUser.level) : null;
  const levelMeta = currentUser ? getLevelMeta(currentUser.level) : null;

  return (
    <>
    <Flex className="feed-root">

      {/* ── Left Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:block feed-sidebar-left">
        <div style={{ position: 'sticky', top: `calc(var(--global-header-height) + 24px)`, padding: '20px 0' }}>

          {/* FEEDS section */}
          <Text
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              padding: '0 16px',
              marginBottom: 4,
            }}
          >
            Feeds
          </Text>
          <button
            className="nav-btn active"
            onClick={() => { setCategory(ALL); setActiveTab('all'); }}
          >
            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
              <HomeOutlined />
            </span>
            <span>홈</span>
          </button>
          <button
            className="nav-btn"
            onClick={() => setActiveTab('solved')}
          >
            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
              <FireOutlined />
            </span>
            <span>인기</span>
          </button>

          <div style={{ height: 1, background: 'var(--border-faint)', margin: '12px 16px' }} />

          {/* CATEGORIES section */}
          <Text
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              padding: '0 16px',
              marginBottom: 4,
            }}
          >
            Categories
          </Text>

          {CATEGORIES.map(c => {
            const isActive = category === c.value;
            const accent = CATEGORY_ACCENT[c.value] ?? 'var(--accent)';
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 18,
                      borderRadius: '0 3px 3px 0',
                      background: accent,
                    }}
                  />
                )}
                <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                  {c.icon}
                </span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main Feed ──────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 24, paddingBottom: 64, paddingLeft: 24, paddingRight: 24 }}>

        {/* Mobile: Category pills */}
        <div className="mobile-cat-bar lg:hidden">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`mobile-cat-btn${category === c.value ? ' active' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Filter tabs + Ask button */}
        <Flex align="center" justify="space-between" style={{ marginBottom: 16 }} wrap gap={8}>
          <Flex align="center" gap={6}>
            {FEED_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`feed-filter-tab${activeTab === tab.value ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </Flex>
          {isLoggedIn && (
            <button
              ref={inlineBtnRef}
              className="ask-btn-inline"
              onClick={() => router.push('/questions/new')}
            >
              <EditOutlined />
              질문하기
            </button>
          )}
        </Flex>

        {/* Question list */}
        {loading ? (
          <Flex vertical gap={8}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                active
                paragraph={{ rows: 2 }}
                style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-surface)' }}
              />
            ))}
          </Flex>
        ) : questions.length === 0 ? (
          <Flex vertical align="center" justify="center" gap={10} style={{ padding: '80px 0' }}>
            <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              조건에 맞는 질문이 없어요.
            </Text>
            {isLoggedIn && (
              <Button type="link" onClick={() => router.push('/questions/new')} style={{ fontSize: 13 }}>
                첫 질문을 작성해보세요 →
              </Button>
            )}
          </Flex>
        ) : (
          <>
            <Flex vertical gap={8}>
              {questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </Flex>

            {hasMore && (
              <Flex justify="center" style={{ padding: '24px 0 8px' }}>
                <Button onClick={handleLoadMore} loading={loadingMore}>
                  더 보기
                </Button>
              </Flex>
            )}

            {!hasMore && questions.length > 5 && (
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '24px 0 8px',
                  fontSize: 11,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  letterSpacing: '0.05em',
                }}
              >
                — end —
              </Text>
            )}
          </>
        )}
      </div>

      {/* ── Right Sidebar ────────────────────────────────── */}
      <aside className="hidden xl:block feed-sidebar-right">
        <div style={{ position: 'sticky', top: `calc(var(--global-header-height) + 24px)` }}>

          {/* User mini profile card */}
          {currentUser && xpProgress && levelMeta ? (
            <div className="feed-sidebar-card" style={{ marginBottom: 16 }}>
              <Flex align="center" gap={12} style={{ marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, flexShrink: 0,
                  border: '2px solid var(--accent-ring)',
                }}>
                  {currentUser.nickname.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>
                    {currentUser.nickname}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {levelMeta.emoji} Lv.{currentUser.level} {levelMeta.name}
                  </Text>
                </div>
              </Flex>

              <div style={{ marginBottom: 6 }}>
                <Flex justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Level {currentUser.level}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                    {currentUser.xp.toLocaleString()} XP
                  </Text>
                </Flex>
                <Progress
                  percent={xpProgress.percent}
                  showInfo={false}
                  strokeColor="var(--accent)"
                  trailColor="var(--bg-elevated)"
                  size={{ height: 5 }}
                />
              </div>
            </div>
          ) : !isLoggedIn ? (
            <div className="feed-sidebar-card" style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                Logos에 오신 것을 환영해요!
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                로그인하면 질문하기, 멘토링 요청 등 다양한 기능을 사용할 수 있어요.
              </Text>
            </div>
          ) : null}

          {/* Community Pulse */}
          <div className="feed-sidebar-card" style={{ marginBottom: 16 }}>
            <Flex align="center" gap={6} style={{ marginBottom: 12 }}>
              <TeamOutlined style={{ fontSize: 13, color: 'var(--text-secondary)' }} />
              <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                Community Pulse
              </Text>
            </Flex>
            <Flex vertical gap={8}>
              {[
                { label: '진행중인 질문', value: questions.filter(q => q.status === 'OPEN').length },
                { label: '해결된 질문', value: questions.filter(q => q.status === 'SOLVED').length },
                { label: '1:1 멘토링 가능', value: questions.filter(q => q.allowOneToOne).length },
              ].map(item => (
                <Flex key={item.label} align="center" justify="space-between">
                  <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</Text>
                  <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {item.value}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </div>

          {/* Post a Question CTA */}
          {isLoggedIn && (
            <button
              className="ask-btn-inline"
              onClick={() => router.push('/questions/new')}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}
            >
              <EditOutlined />
              질문하기
            </button>
          )}

          {/* Verified Mentor CTA */}
          {isLoggedIn && currentUser?.mentorStatus !== 'APPROVED' && (
            <div
              className="feed-sidebar-card"
              style={{
                marginTop: 12,
                background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                border: 'none',
              }}
            >
              <Flex align="center" gap={6} style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                <Text strong style={{ fontSize: 13, color: '#ffffff' }}>
                  멘토 신청
                </Text>
              </Flex>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, display: 'block', marginBottom: 10 }}>
                멘토가 되어 개발자들을 도우며 XP와 보상을 받아보세요.
              </Text>
              <button
                onClick={() => router.push('/settings/profile')}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                멘토 신청하기
              </button>
            </div>
          )}
        </div>
      </aside>

    </Flex>

    {isLoggedIn && (
      <button
        className={`fab-ask${showFab ? '' : ' hidden'}`}
        onClick={() => router.push('/questions/new')}
      >
        <EditOutlined />
        질문하기
      </button>
    )}
    </>
  );
}
