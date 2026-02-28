'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@/lib/auth';

function LoadingState() {
  return (
    <div
      className="page-root"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px' }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: '13.5px', color: 'var(--text-tertiary)' }}>로그인 처리 중...</p>
    </div>
  );
}

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      router.replace('/?error=auth_failed');
      return;
    }

    saveTokens(accessToken, refreshToken);
    router.replace('/');
  }, [router, searchParams]);

  return <LoadingState />;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
