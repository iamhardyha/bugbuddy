import Link from 'next/link';
import { CATEGORY_META, QUESTION_TYPE_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionSummary } from '@/types/question';

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
      <div
        style={{
          width: 60,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 6px',
          borderRight: '1px solid var(--border-faint)',
          background: 'var(--bg-subtle)',
          gap: 6,
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
        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            lineHeight: 1,
          }}
        >
          {views}
        </span>
        <span
          style={{
            fontSize: 9.5,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          views
        </span>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 16px 11px' }}>
        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
            marginBottom: 7,
          }}
        >
          {/* Status badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 7px',
              borderRadius: 20,
              background: status.bg,
              color: status.color,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.01em',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: status.color,
                flexShrink: 0,
              }}
            />
            {status.label}
          </span>

          {/* Category */}
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 5,
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: 10.5,
              fontWeight: 500,
            }}
          >
            {category.emoji} {category.label}
          </span>

          {/* Type */}
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 5,
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: 10.5,
              fontWeight: 500,
            }}
          >
            {type.label}
          </span>

          {/* 1:1 badge */}
          {question.allowOneToOne && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 5,
                background: 'var(--status-open-bg)',
                color: 'var(--status-open)',
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              1:1 가능
            </span>
          )}

          {/* Time — pushed to right */}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-jetbrains-mono)',
              flexShrink: 0,
            }}
          >
            {relativeTime(question.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.48,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {question.title}
        </h3>

        {/* Tags */}
        {question.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
              marginTop: 9,
            }}
          >
            {question.tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                style={{
                  padding: '1.5px 6px',
                  borderRadius: 4,
                  background: 'var(--tag-bg)',
                  color: 'var(--tag-text)',
                  fontSize: 11,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontWeight: 500,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
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
