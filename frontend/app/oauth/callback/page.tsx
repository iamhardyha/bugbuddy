'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { saveTokens } from '@/lib/auth';

const { Text } = Typography;

function LoadingState() {
  return (
    <div className="page-root">
      <Flex vertical align="center" justify="center" gap={14} style={{ height: '100%', minHeight: '100vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
        <Text type="secondary" style={{ fontSize: '13.5px' }}>로그인 처리 중...</Text>
      </Flex>
    </div>
  );
}

function OAuthCallbackContent() {
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
      <OAuthCallbackContent />
    </Suspense>
  );
}
