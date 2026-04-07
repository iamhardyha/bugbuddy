'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeOutlined, HomeFilled,
  ReadOutlined, ReadFilled,
  MessageOutlined, MessageFilled,
  BellOutlined, BellFilled,
  UserOutlined, UserSwitchOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { getAccessToken } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notifications';
import styles from './BottomNav.module.css';

const AUTH_FREE_TABS = new Set(['home', 'feeds']);

interface Tab {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  matchPaths: string[];
}

const TABS: Tab[] = [
  {
    key: 'home',
    label: 'Q&A',
    path: '/',
    icon: <HomeOutlined />,
    activeIcon: <HomeFilled />,
    matchPaths: ['/', '/questions'],
  },
  {
    key: 'feeds',
    label: 'TechFeed',
    path: '/feeds',
    icon: <ReadOutlined />,
    activeIcon: <ReadFilled />,
    matchPaths: ['/feeds'],
  },
  {
    key: 'chat',
    label: '채팅',
    path: '/chat',
    icon: <MessageOutlined />,
    activeIcon: <MessageFilled />,
    matchPaths: ['/chat'],
  },
  {
    key: 'notifications',
    label: '알림',
    path: '/notifications',
    icon: <BellOutlined />,
    activeIcon: <BellFilled />,
    matchPaths: ['/notifications'],
  },
  {
    key: 'my',
    label: 'MY',
    path: '/settings/profile',
    icon: <UserOutlined />,
    activeIcon: <UserSwitchOutlined />,
    matchPaths: ['/settings', '/users'],
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) return;
    getUnreadCount().then(res => {
      if (res.success && res.data != null) setUnreadCount(res.data);
    }).catch(() => {});
  }, [pathname]); // refetch on navigation

  function isActive(tab: Tab): boolean {
    if (tab.key === 'home') return pathname === '/' || pathname.startsWith('/questions');
    return tab.matchPaths.some(p => pathname.startsWith(p));
  }

  function handleClick(tab: Tab) {
    if (!getAccessToken() && !AUTH_FREE_TABS.has(tab.key)) {
      message.info('로그인이 필요합니다.');
      return;
    }
    router.push(tab.path);
  }

  // Admin pages use their own layout
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className={styles.bottomNav}>
      {TABS.map(tab => {
        const active = isActive(tab);
        return (
          <button
            key={tab.key}
            className={`${styles.tab}${active ? ` ${styles.active}` : ''}`}
            onClick={() => handleClick(tab)}
          >
            <span className={styles.tabIcon}>
              {active ? tab.activeIcon : tab.icon}
            </span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.key === 'notifications' && unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
