'use client';

import FeedList from '@/components/feed/FeedList';
import layoutStyles from '@/components/common/Layout.module.css';

export default function FeedsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain}>
        <FeedList />
      </main>
    </div>
  );
}
