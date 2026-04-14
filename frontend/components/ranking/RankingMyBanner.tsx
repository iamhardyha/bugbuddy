'use client';

import { Card, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { MyRank } from '@/lib/rankings';

interface Props {
  myRank: MyRank | null;
  showPeriodXp: boolean;
}

export default function RankingMyBanner({ myRank, showPeriodXp }: Props) {
  if (!myRank) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          이 기간에는 아직 활동 기록이 없어요.
        </Typography.Text>
      </Card>
    );
  }

  const xpLabel = showPeriodXp && myRank.periodXp !== null
    ? `${myRank.periodXp.toLocaleString()} XP`
    : `${myRank.xp.toLocaleString()} XP`;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: 'var(--rank-row-highlight)',
        borderColor: 'var(--rank-gold)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TrophyOutlined style={{ fontSize: 20, color: 'var(--rank-gold)' }} aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <Typography.Text strong>
            내 순위 {myRank.rank.toLocaleString()}위 · {xpLabel}
          </Typography.Text>
          {!myRank.inTop100 && myRank.xpToTop100 > 0 && (
            <Typography.Paragraph
              type="secondary"
              style={{ margin: 0, fontSize: '0.85rem' }}
            >
              Top 100 진입까지 {myRank.xpToTop100.toLocaleString()} XP
            </Typography.Paragraph>
          )}
          {myRank.inTop100 && (
            <Typography.Paragraph
              type="secondary"
              style={{ margin: 0, fontSize: '0.85rem' }}
            >
              Top 100에 진입했어요!
            </Typography.Paragraph>
          )}
        </div>
      </div>
    </Card>
  );
}
