'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginButton from './LoginButton';
import { apiFetch } from '@/lib/api';
import { getAccessToken, clearTokens } from '@/lib/auth';
import type { UserProfile } from '@/types/user';

export default function AuthStatus() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    apiFetch<UserProfile>('/api/auth/me')
      .then(res => { if (res.success && res.data) setUser(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.refresh();
  }

  if (loading) {
    return (
      <div
        style={{
          width: 120,
          height: 32,
          borderRadius: 8,
          background: 'var(--bg-elevated)',
          animation: 'skeleton-wave 1.6s ease-in-out infinite',
        }}
      />
    );
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--accent-subtle)',
            border: '1.5px solid var(--accent-ring)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent)',
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {user.nickname.charAt(0).toUpperCase()}
        </div>

        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.nickname}
        </span>

        <button
          onClick={handleLogout}
          style={{
            fontSize: 11.5,
            color: 'var(--text-tertiary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '4px 6px',
            borderRadius: 5,
            transition: 'color 0.12s ease',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return <LoginButton />;
}
