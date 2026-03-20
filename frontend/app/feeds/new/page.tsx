'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import FeedCreateForm from '@/components/feed/FeedCreateForm';
import layoutStyles from '@/components/common/Layout.module.css';

export default function NewFeedPage() {
  const router = useRouter();

  return (
    <div className={layoutStyles.pageRoot}>
      <header className={layoutStyles.pageHeader}>
        <div style={{ margin: '0 auto', maxWidth: '720px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button type="link" onClick={() => router.back()} style={{ padding: 0, height: 'auto', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            ← 돌아가기
          </Button>
          <span style={{ color: 'var(--border)', fontSize: '16px' }}>|</span>
          <h1 className={layoutStyles.pageTitle}>피드 등록</h1>
        </div>
      </header>

      <main className={layoutStyles.formPageMain}>
        <FeedCreateForm />
      </main>
    </div>
  );
}
