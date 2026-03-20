'use client';

import Link from 'next/link';
import AuthStatus from '@/components/auth/AuthStatus';
import ThemeToggle from '@/components/common/ThemeToggle';
import NotificationBell from '@/components/common/NotificationBell';
import styles from './GlobalHeader.module.css';

export default function GlobalHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Wordmark */}
        <Link href="/" className={styles.wordmark}>
          <span className={styles.wordmarkBug}>Log</span>
          <span className={styles.wordmarkBuddy}>os</span>
        </Link>

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
