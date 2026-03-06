'use client';

import Link from 'next/link';
import AuthStatus from '@/components/auth/AuthStatus';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function GlobalHeader() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-faint)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        background: 'var(--header-bg)',
      }}
    >
      <div className="home-header-inner">
        <Link href="/" className="wordmark-link">
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flexShrink: 0,
              boxShadow: '0 2px 8px var(--accent-ring)',
            }}
          >
            🐞
          </div>
          <span
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: 17,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            버그버디
          </span>
        </Link>

        <div style={{ flex: 1 }} />

        <ThemeToggle />
        <AuthStatus />
      </div>
    </header>
  );
}
