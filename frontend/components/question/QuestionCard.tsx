'use client';

import Link from 'next/link';
import { Flex, Tag, Typography } from 'antd';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { CATEGORY_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionSummary } from '@/types/question';
import styles from './QuestionCard.module.css';

const { Text } = Typography;

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

const AVATAR_COLORS: [string, string][] = [
  ['#e8e0ff', '#5548e0'],
  ['#d4f5e9', '#1a9c5e'],
  ['#dbeafe', '#2878e8'],
  ['#fde8d8', '#a0522d'],
  ['#fce7f3', '#be185d'],
];

function AuthorAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const [bg, fg] = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

interface Props {
  question: QuestionSummary;
}

export default function QuestionCard({ question }: Props) {
  const category = CATEGORY_META[question.category];
  const accent = CAT_ACCENT[question.category] ?? '#8080a0';

  const score =
    question.viewCount >= 10000
      ? `${Math.round(question.viewCount / 1000)}k`
      : String(question.viewCount);

  return (
    <Link href={`/questions/${question.id}`} className={styles.cardLink}>
      {/* Left: Vote column */}
      <Flex
        vertical
        align="center"
        justify="center"
        gap={4}
        style={{
          width: 60,
          flexShrink: 0,
          padding: '16px 8px',
          borderRight: '1px solid var(--border-faint)',
          background: 'var(--bg-subtle)',
        }}
      >
        <CaretUpOutlined style={{ fontSize: 14, color: 'var(--text-tertiary)' }} />
        <Text
          style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            lineHeight: 1,
          }}
        >
          {score}
        </Text>
        <CaretDownOutlined style={{ fontSize: 14, color: 'var(--text-tertiary)' }} />
      </Flex>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 18px 13px' }}>
        {/* Meta row */}
        <Flex align="center" gap={6} style={{ marginBottom: 8 }} wrap>
          <AuthorAvatar name={question.authorNickname} />
          <Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {question.authorNickname}
          </Text>
          <Text style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
            · {relativeTime(question.createdAt)}
          </Text>
          <div style={{ flex: 1 }} />
          <Tag
            style={{
              borderRadius: 4,
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              fontSize: 10.5,
              fontWeight: 500,
              border: 'none',
              flexShrink: 0,
            }}
          >
            {category.label}
          </Tag>
        </Flex>

        {/* Title */}
        <Text
          style={{
            display: '-webkit-box',
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.45,
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {question.title}
        </Text>

        {/* Tags */}
        {question.tags.length > 0 && (
          <Flex wrap gap={5} style={{ marginTop: 10 }}>
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
                {tag}
              </Tag>
            ))}
          </Flex>
        )}
      </div>

      {/* Right: category color accent */}
      <div
        style={{
          width: 3,
          flexShrink: 0,
          background: `linear-gradient(to bottom, ${accent}66, transparent)`,
        }}
      />
    </Link>
  );
}
