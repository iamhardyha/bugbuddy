'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Avatar, Tag } from 'antd';
import { CheckCircleOutlined, MessageOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { RankingRow as RankingRowData } from '@/lib/rankings';
import styles from './RankingList.module.css';

function rankClass(rank: number): string {
  if (rank === 1) return `${styles.rankNumber} ${styles.rankGold}`;
  if (rank === 2) return `${styles.rankNumber} ${styles.rankSilver}`;
  if (rank === 3) return `${styles.rankNumber} ${styles.rankBronze}`;
  return styles.rankNumber;
}

function rowClass(rank: number): string {
  if (rank === 1) return `${styles.row} ${styles.rowTop1}`;
  if (rank === 2) return `${styles.row} ${styles.rowTop2}`;
  if (rank === 3) return `${styles.row} ${styles.rowTop3}`;
  return styles.row;
}

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇 1';
  if (rank === 2) return '🥈 2';
  if (rank === 3) return '🥉 3';
  return String(rank);
}

interface Props {
  row: RankingRowData;
  showPeriodXp: boolean;
}

function RankingRow({ row, showPeriodXp }: Props) {
  const xpValue = showPeriodXp && row.periodXp !== null ? row.periodXp : row.xp;
  const aria = `${row.rank}위, ${row.nickname}, 레벨 ${row.level}, ${xpValue.toLocaleString()} XP, 답변 채택 ${row.acceptedAnswerCount}, 답변 ${row.answerCount}, 질문 ${row.questionCount}`;

  return (
    <Link
      href={`/users/${row.userId}`}
      className={rowClass(row.rank)}
      aria-label={aria}
    >
      <span className={rankClass(row.rank)} aria-hidden="true">
        {rankLabel(row.rank)}
      </span>
      <Avatar size={40} aria-hidden="true">
        {row.nickname.charAt(0).toUpperCase()}
      </Avatar>
      <div className={styles.main}>
        <div className={styles.nameRow}>
          <span className={styles.nickname}>{row.nickname}</span>
          {row.mentorStatus === 'APPROVED' && (
            <Tag color="gold" aria-hidden="true">멘토</Tag>
          )}
          <span className={styles.levelBadge}>Lv.{row.level}</span>
        </div>
        {row.bio && <span className={styles.bio}>{row.bio}</span>}
      </div>
      <div className={styles.right}>
        <span className={styles.xp}>{xpValue.toLocaleString()} XP</span>
        <span className={styles.activity}>
          <span><CheckCircleOutlined aria-hidden="true" /> {row.acceptedAnswerCount}</span>
          <span><MessageOutlined aria-hidden="true" /> {row.answerCount}</span>
          <span><QuestionCircleOutlined aria-hidden="true" /> {row.questionCount}</span>
        </span>
      </div>
    </Link>
  );
}

export default memo(RankingRow);
