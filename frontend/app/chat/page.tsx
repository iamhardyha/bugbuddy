'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Spin, Typography, Button } from 'antd';
import { LoadingOutlined, MessageOutlined } from '@ant-design/icons';
import { getChatRooms } from '@/lib/chat';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import ChatRoomCard from '@/components/chat/ChatRoomCard';
import type { ChatRoom } from '@/types/chat';
import type { UserProfile } from '@/types/user';

const { Title, Text } = Typography;

function Section({
  title,
  badge,
  rooms,
  currentUserId,
  onAccepted,
  emptyText,
}: {
  title: string;
  badge?: string;
  rooms: ChatRoom[];
  currentUserId: number;
  onAccepted: (roomId: number) => void;
  emptyText?: string;
}) {
  if (rooms.length === 0 && !emptyText) return null;

  return (
    <section style={{ marginBottom: 8 }}>
      <Flex align="center" gap={8} style={{ padding: '12px 16px 8px' }}>
        <Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </Text>
        {badge && (
          <div className="dm-section-badge">{badge}</div>
        )}
      </Flex>
      {rooms.length === 0 ? (
        <div style={{ padding: '8px 16px 12px' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>{emptyText}</Text>
        </div>
      ) : (
        <div>
          {rooms.map(room => (
            <ChatRoomCard
              key={room.id}
              room={room}
              currentUserId={currentUserId}
              onAccepted={onAccepted}
            />
          ))}
        </div>
      )}
    </section>
  );
}

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

  function handleAccepted(roomId: number) {
    setRooms(prev =>
      prev.map(r => r.id === roomId ? { ...r, status: 'OPEN' as const } : r)
    );
  }

  if (loading) {
    return (
      <div className="page-root">
        <Flex align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
      </div>
    );
  }

  const uid = currentUser?.id ?? 0;
  const pending = rooms.filter(r => r.status === 'PENDING');
  const open = rooms.filter(r => r.status === 'OPEN');
  const closed = rooms.filter(r => r.status === 'CLOSED');
  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0);
  const isEmpty = rooms.length === 0;

  return (
    <div className="page-root">
      <header className="page-header">
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--text-primary)' }}>채팅</Title>
          {totalUnread > 0 && (
            <div className="dm-unread-badge" style={{ position: 'static' }}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </div>
          )}
        </div>
      </header>

      {/* 목록 */}
      <main style={{ maxWidth: 640, margin: '0 auto' }}>
        {isEmpty ? (
          <Flex vertical align="center" justify="center" gap={16} style={{ minHeight: '50vh' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageOutlined style={{ fontSize: 28, color: 'var(--accent)' }} />
            </div>
            <Flex vertical align="center" gap={6}>
              <Text strong style={{ fontSize: 15 }}>채팅이 없어요</Text>
              <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                질문에 멘토링을 제안하거나<br />제안이 오면 여기서 확인할 수 있어요.
              </Text>
            </Flex>
            <Button onClick={() => router.push('/')}>질문 목록 보러가기</Button>
          </Flex>
        ) : (
          <>
            <Section
              title="대기중인 채팅"
              badge={pending.length > 0 ? String(pending.length) : undefined}
              rooms={pending}
              currentUserId={uid}
              onAccepted={handleAccepted}
            />
            <Section
              title="진행중인 채팅"
              rooms={open}
              currentUserId={uid}
              onAccepted={handleAccepted}
              emptyText={pending.length > 0 || closed.length > 0 ? '진행 중인 채팅이 없어요.' : undefined}
            />
            <Section
              title="종료된 채팅"
              rooms={closed}
              currentUserId={uid}
              onAccepted={handleAccepted}
            />
          </>
        )}
      </main>
    </div>
  );
}
