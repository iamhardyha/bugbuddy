'use client';

import Link from 'next/link';
import { Flex, Tag, Typography } from 'antd';
import { CATEGORY_META, QUESTION_TYPE_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionSummary } from '@/types/question';

const { Text } = Typography;

/* Status config with CSS variable references */
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:   { label: '답변 받는 중', color: 'var(--status-open)',   bg: 'var(--status-open-bg)'   },
  SOLVED: { label: '해결됨',       color: 'var(--status-solved)', bg: 'var(--status-solved-bg)' },
  CLOSED: { label: '마감',         color: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
};

/* Category accent colors */
const CAT_ACCENT: Record<string, string> = {
  BACKEND:  '#7c65f6',
  FRONTEND: '#4ea8de',
  DEVOPS:   '#f5a623',
  MOBILE:   '#34c784',
  AI_DATA:  '#e85d5d',
  CS_ALGO:  '#a78bfa',
  CAREER:   '#60a5fa',
  FUTURE:   '#4ade80',
  ETC:      '#8888a8',
};

interface Props {
  question: QuestionSummary;
}

export default function QuestionCard({ question }: Props) {
  const status   = STATUS[question.status] ?? STATUS.CLOSED;
  const category = CATEGORY_META[question.category];
  const type     = QUESTION_TYPE_META[question.questionType];
  const accent   = CAT_ACCENT[question.category] ?? '#8080a0';

  const views =
    question.viewCount >= 100000
      ? `${Math.round(question.viewCount / 1000)}k`
      : question.viewCount >= 1000
      ? `${(question.viewCount / 1000).toFixed(1)}k`
      : String(question.viewCount);

  return (
    <Link href={`/questions/${question.id}`} className="card-link">
      {/* ── Left metric column (Reddit-style) ── */}
      <Flex
        vertical
        align="center"
        justify="center"
        style={{
          width: 64,
          flexShrink: 0,
          padding: '16px 8px',
          borderRight: '1px solid var(--border-faint)',
          background: 'var(--bg-subtle)',
          gap: 8,
        }}
      >
        {/* Category color stripe */}
        <div
          style={{
            width: 3,
            height: 32,
            borderRadius: 2,
            background: accent,
            opacity: 0.55,
          }}
        />
        {/* View count */}
        <Text
          style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            lineHeight: 1,
          }}
        >
          {views}
        </Text>
        <Text
          style={{
            fontSize: 9.5,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          views
        </Text>
      </Flex>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 20px 13px' }}>
        {/* Meta row */}
        <Flex align="center" gap={6} wrap style={{ marginBottom: 9 }}>
          {/* Status badge */}
          <Tag
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              borderRadius: 20,
              background: status.bg,
              color: status.color,
              fontSize: 10.5,
              fontWeight: 600,
              border: 'none',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: status.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {status.label}
          </Tag>

          {/* Category */}
          <Tag
            style={{
              borderRadius: 5,
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: 10.5,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {category.emoji} {category.label}
          </Tag>

          {/* Type */}
          <Tag
            style={{
              borderRadius: 5,
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: 10.5,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {type.label}
          </Tag>

          {/* 1:1 badge */}
          {question.allowOneToOne && (
            <Tag
              style={{
                borderRadius: 5,
                background: 'var(--status-open-bg)',
                color: 'var(--status-open)',
                fontSize: 10.5,
                fontWeight: 600,
                border: 'none',
              }}
            >
              1:1 가능
            </Tag>
          )}

          {/* Author nickname */}
          <Text
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'var(--text-secondary)',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {question.authorNickname}
          </Text>

          {/* Time */}
          <Text
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-jetbrains-mono)',
              flexShrink: 0,
            }}
          >
            {relativeTime(question.createdAt)}
          </Text>
        </Flex>

        {/* Title */}
        <Text
          style={{
            display: '-webkit-box',
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.48,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {question.title}
        </Text>

        {/* Tags */}
        {question.tags.length > 0 && (
          <Flex wrap gap={5} style={{ marginTop: 11 }}>
            {question.tags.slice(0, 5).map(tag => (
              <Tag
                key={tag}
                style={{
                  borderRadius: 4,
                  background: 'var(--tag-bg)',
                  color: 'var(--tag-text)',
                  fontSize: 11,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontWeight: 500,
                  border: 'none',
                }}
              >
                #{tag}
              </Tag>
            ))}
          </Flex>
        )}
      </div>

      {/* ── Right accent bar (category color) ── */}
      <div
        style={{
          width: 3,
          flexShrink: 0,
          background: `linear-gradient(to bottom, ${accent}55, transparent)`,
        }}
      />
    </Link>
  );
}
