'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeOutlined, HomeFilled,
  MessageOutlined, MessageFilled,
  BellOutlined, BellFilled,
  UserOutlined,
} from '@ant-design/icons';
import { getAccessToken } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notifications';
import styles from './BottomNav.module.css';

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
    label: '홈',
    path: '/',
    icon: <HomeOutlined />,
    activeIcon: <HomeFilled />,
    matchPaths: ['/', '/questions'],
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
    activeIcon: <UserOutlined />,
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
    if (tab.key === 'home') return pathname === '/';
    return tab.matchPaths.some(p => pathname.startsWith(p));
  }

  function handleClick(tab: Tab) {
    if (!getAccessToken() && tab.key !== 'home') {
      // Not logged in — could redirect to login or just go home
      router.push('/');
      return;
    }
    router.push(tab.path);
  }

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
