'use client';

import { useParams } from 'next/navigation';
import FeedDetail from '@/components/feed/FeedDetail';
import layoutStyles from '@/components/common/Layout.module.css';

export default function FeedDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div className={layoutStyles.pageRoot}>
      <main className={layoutStyles.formPageMain} style={{ maxWidth: 720 }}>
        <FeedDetail feedId={Number(params.id)} />
      </main>
    </div>
  );
}
