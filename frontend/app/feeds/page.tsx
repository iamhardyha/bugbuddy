'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EditOutlined } from '@ant-design/icons';
import FeedList from '@/components/feed/FeedList';
import layoutStyles from '@/components/common/Layout.module.css';
import qfStyles from '@/components/question/QuestionFeed.module.css';
import { getAccessToken } from '@/lib/auth';

export default function FeedsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain}>
        <FeedList />
      </main>

      {isLoggedIn && (
        <button
          className={qfStyles.fabAsk}
          onClick={() => router.push('/feeds/new')}
        >
          <EditOutlined />
          피드 등록
        </button>
      )}
    </div>
  );
}
