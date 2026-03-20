'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EditOutlined } from '@ant-design/icons';
import QuestionFeed from '@/components/question/QuestionFeed';
import FeedList from '@/components/feed/FeedList';
import layoutStyles from '@/components/common/Layout.module.css';
import feedStyles from '@/components/feed/Feed.module.css';
import qfStyles from '@/components/question/QuestionFeed.module.css';
import { getAccessToken } from '@/lib/auth';

type HomeTab = 'qa' | 'feed';

export default function Home() {
  const router = useRouter();
  const [activeHomeTab, setActiveHomeTab] = useState<HomeTab>('qa');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain}>
        <div className={feedStyles.homeTab}>
          <button
            className={`${feedStyles.homeTabBtn}${activeHomeTab === 'qa' ? ` ${feedStyles.active}` : ''}`}
            onClick={() => setActiveHomeTab('qa')}
          >
            Q&A
          </button>
          <button
            className={`${feedStyles.homeTabBtn}${activeHomeTab === 'feed' ? ` ${feedStyles.active}` : ''}`}
            onClick={() => setActiveHomeTab('feed')}
          >
            테크피드
          </button>
        </div>
        {activeHomeTab === 'qa' ? <QuestionFeed /> : <FeedList />}
      </main>

      {/* FAB for feed tab */}
      {isLoggedIn && activeHomeTab === 'feed' && (
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
