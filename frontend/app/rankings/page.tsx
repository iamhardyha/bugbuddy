'use client';

import { Suspense } from 'react';
import { Typography, Skeleton } from 'antd';
import RankingList from '@/components/ranking/RankingList';
import layoutStyles from '@/components/common/Layout.module.css';

export default function RankingsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain}>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          랭킹
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          매주/매달 가장 활발한 유저를 확인해 보세요.
        </Typography.Paragraph>
        <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
          <RankingList />
        </Suspense>
      </main>
    </div>
  );
}
