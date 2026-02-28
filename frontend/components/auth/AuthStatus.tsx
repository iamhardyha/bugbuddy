import { useEffect, useState } from 'react';
import { Button, Flex, Avatar, Skeleton, Typography } from 'antd';
import LoginButton from './LoginButton';
import { apiFetch } from '@/lib/api';
import { getAccessToken, clearTokens } from '@/lib/auth';
import type { UserProfile } from '@/types/user';

const { Text } = Typography;

export default function AuthStatus() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    window.location.reload();
  }

  if (loading) {
    return <Skeleton.Button active style={{ width: 120, height: 32, borderRadius: 8 }} />;
  }

  if (user) {
    return (
      <Flex align="center" gap={8}>
        <Avatar
          size={30}
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1.5px solid var(--accent-ring)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}
        >
          {user.nickname.charAt(0).toUpperCase()}
        </Avatar>

        <Text
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
        </Text>

        <Button
          type="text"
          size="small"
          onClick={handleLogout}
          style={{ fontSize: 11.5, color: 'var(--text-tertiary)', padding: '0 6px' }}
        >
          로그아웃
        </Button>
      </Flex>
    );
  }

  return <LoginButton />;
}
