'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthStatus from '@/components/auth/AuthStatus';
import ThemeToggle from '@/components/common/ThemeToggle';
import NotificationBell from '@/components/common/NotificationBell';
import styles from './GlobalHeader.module.css';

export default function GlobalHeader() {
  const pathname = usePathname();

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
            테크피드
          </Link>
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={styles.hideOnMobile}><NotificationBell /></span>
          <ThemeToggle />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
