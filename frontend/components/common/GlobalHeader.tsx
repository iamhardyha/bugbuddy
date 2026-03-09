'use client';

import Link from 'next/link';
import AuthStatus from '@/components/auth/AuthStatus';
import ThemeToggle from '@/components/common/ThemeToggle';
import NotificationBell from '@/components/common/NotificationBell';

export default function GlobalHeader() {
  return (
    <header className="global-header">
      <div className="global-header-inner">
        {/* Wordmark */}
        <Link href="/" className="bugbuddy-wordmark">
          <span className="bugbuddy-wordmark-bug">Bug</span>
          <span className="bugbuddy-wordmark-buddy">Buddy</span>
        </Link>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotificationBell />
          <ThemeToggle />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
