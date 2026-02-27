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
      .then(res => {
        if (res.success && res.data) setUser(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{user.nickname}</span>님 환영해요! 👋
        </span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return <LoginButton />;
}
