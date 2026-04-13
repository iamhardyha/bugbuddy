'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import AuthStatus from '@/components/auth/AuthStatus';
import ThemeToggle from '@/components/common/ThemeToggle';
import NotificationBell from '@/components/common/NotificationBell';
import styles from './GlobalHeader.module.css';

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (pathname === '/search' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSearchValue(params.get('q') ?? '');
    } else {
      setSearchValue('');
    }
  }, [pathname]);

  // Admin pages use their own layout
  if (pathname.startsWith('/admin')) return null;

  function handleSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Wordmark */}
        <Link href="/" className={styles.wordmark}>
          <span className={styles.wordmarkBug}>Log</span>
          <span className={styles.wordmarkBuddy}>os</span>
        </Link>

        {/* Navigation */}
        <nav className={styles.nav}>
          <Link
            href="/"
            className={`${styles.navLink}${pathname === '/' || pathname.startsWith('/questions') ? ` ${styles.navLinkActive}` : ''}`}
          >
            Q&A
          </Link>
          <Link
            href="/feeds"
            className={`${styles.navLink}${pathname.startsWith('/feeds') ? ` ${styles.navLinkActive}` : ''}`}
          >
            TechFeed
          </Link>
          <Link
            href="/mentor"
            className={`${styles.navLink}${pathname.startsWith('/mentor') ? ` ${styles.navLinkActive}` : ''}`}
          >
            Mentors
          </Link>
        </nav>

        <div className={styles.searchBox}>
          <Input.Search
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            placeholder="질문 검색..."
            allowClear
            maxLength={100}
            enterButton={<SearchOutlined />}
            size="middle"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={styles.hideOnMobile}><NotificationBell /></span>
          <ThemeToggle />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
