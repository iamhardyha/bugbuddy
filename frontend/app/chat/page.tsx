'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Spin, Typography } from 'antd';
import { LoadingOutlined, MessageOutlined } from '@ant-design/icons';
import { getChatRooms } from '@/lib/chat';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useUserChatEvents, type ChatRoomEvent } from '@/hooks/useUserChatEvents';
import ChatSidebar from '@/components/chat/ChatSidebar';
import type { ChatRoom } from '@/types/chat';
import type { UserProfile } from '@/types/user';
import styles from '@/components/chat/ChatLayout.module.css';

const { Text } = Typography;

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
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'OPEN' as const } : r));
  }

  // 유저 이벤트 구독 — 채팅 목록 실시간 업데이트
  const handleChatEvent = useCallback((event: ChatRoomEvent) => {
    if (event.type === 'ROOM_CLOSED') {
      setRooms(prev => prev.map(r => r.id === event.roomId ? { ...r, status: 'CLOSED' as const } : r));
    } else if (event.type === 'NEW_MESSAGE' && event.lastMessageContent) {
      setRooms(prev => prev.map(r =>
        r.id === event.roomId
          ? { ...r, lastMessageContent: event.lastMessageContent, lastMessageAt: event.lastMessageAt, unreadCount: r.unreadCount + 1 }
          : r,
      ));
    } else if (event.type === 'ROOM_ACCEPTED') {
      setRooms(prev => prev.map(r => r.id === event.roomId ? { ...r, status: 'OPEN' as const } : r));
    }
  }, []);

  useUserChatEvents(currentUser?.id, handleChatEvent);

  if (loading) {
    return (
      <div className={styles.layout}>
        <Flex align="center" justify="center" style={{ width: '100%' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Left panel: room list (전체 너비 on mobile, 320px on desktop) */}
      <div className={styles.panelLeft}>
        <ChatSidebar
          rooms={rooms}
          currentUserId={currentUser?.id ?? 0}
          onAccepted={handleAccepted}
          onGoHome={() => router.push('/')}
        />
      </div>

      {/* Right panel: empty state (desktop only) */}
      <div className={`${styles.panelRight} ${styles.panelRightDesktopOnly}`}>
        <Flex vertical align="center" justify="center" gap={16} style={{ height: '100%' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageOutlined style={{ fontSize: 26, color: 'var(--text-tertiary)' }} />
          </div>
          <Flex vertical align="center" gap={6}>
            <Text strong style={{ fontSize: 14, color: 'var(--text-secondary)' }}>대화를 선택해주세요</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>왼쪽 목록에서 채팅을 선택하세요.</Text>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}
