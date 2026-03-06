'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Spin, Typography, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getChatRooms } from '@/lib/chat';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import ChatRoomCard from '@/components/chat/ChatRoomCard';
import type { ChatRoom } from '@/types/chat';
import type { UserProfile } from '@/types/user';

const { Title, Text } = Typography;

export default function ChatListPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }

    async function load() {
      const [roomsRes, userRes] = await Promise.all([
        getChatRooms(),
        apiFetch<UserProfile>('/api/auth/me'),
      ]);
      if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data);
      if (userRes.success && userRes.data) setCurrentUser(userRes.data);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="page-root">
        <Flex align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
      </div>
    );
  }

  return (
    <div className="page-root">
      <header className="page-header">
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="link"
            onClick={() => router.back()}
            style={{ padding: 0, height: 'auto', fontSize: 13, color: 'var(--text-tertiary)' }}
          >
            ← 돌아가기
          </Button>
          <Title level={5} style={{ margin: 0, color: 'var(--text-primary)' }}>
            채팅
          </Title>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {rooms.length === 0 ? (
          <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: '40vh' }}>
            <Text style={{ fontSize: '2.5rem', lineHeight: 1 }}>💬</Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              아직 채팅 내역이 없어요.
            </Text>
            <Button type="link" onClick={() => router.push('/')} style={{ fontSize: 13 }}>
              질문 목록 보기
            </Button>
          </Flex>
        ) : (
          <Flex vertical gap={8}>
            {rooms.map(room => (
              <ChatRoomCard
                key={room.id}
                room={room}
                currentUserId={currentUser?.id ?? 0}
              />
            ))}
          </Flex>
        )}
      </main>
    </div>
  );
}
