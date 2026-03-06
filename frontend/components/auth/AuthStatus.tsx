'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Flex, Avatar, Skeleton, Typography, Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import LoginButton from './LoginButton';
import { apiFetch } from '@/lib/api';
import { getChatRooms } from '@/lib/chat';
import { getAccessToken, clearTokens } from '@/lib/auth';
import type { UserProfile } from '@/types/user';

const { Text } = Typography;

export default function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    apiFetch<UserProfile>('/api/auth/me')
      .then(res => { if (res.success && res.data) setUser(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    getChatRooms()
      .then(res => {
        if (res.success && res.data) {
          const unread = res.data.reduce((sum, r) => sum + r.unreadCount, 0);
          setTotalUnread(unread);
        }
      })
      .catch(() => {});
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
        <Badge count={totalUnread} size="small" offset={[-2, 2]}>
          <button
            className="theme-btn"
            onClick={() => router.push('/chat')}
            style={{ width: 32, height: 32 }}
            title="채팅"
          >
            <MessageOutlined style={{ fontSize: 15 }} />
          </button>
        </Badge>

        <Link href={`/users/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
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
              cursor: 'pointer',
            }}
          >
            {user.nickname.charAt(0).toUpperCase()}
          </Avatar>

          <Text
            className="auth-nickname"
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
        </Link>

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
