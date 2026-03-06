'use client';

import { Flex, Spin, Typography, Button } from 'antd';
import { LoadingOutlined, MessageOutlined } from '@ant-design/icons';
import ChatRoomCard from './ChatRoomCard';
import type { ChatRoom } from '@/types/chat';

const { Text } = Typography;

interface SectionProps {
  title: string;
  badge?: string;
  rooms: ChatRoom[];
  currentUserId: number;
  activeRoomId?: number;
  onAccepted: (roomId: number) => void;
  emptyText?: string;
}

function Section({ title, badge, rooms, currentUserId, activeRoomId, onAccepted, emptyText }: SectionProps) {
  if (rooms.length === 0 && !emptyText) return null;
  return (
    <section>
      <Flex align="center" gap={6} style={{ padding: '10px 16px 6px' }}>
        <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          {title}
        </Text>
        {badge && <div className="dm-section-badge">{badge}</div>}
      </Flex>
      {rooms.length === 0 ? (
        <div style={{ padding: '4px 16px 10px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{emptyText}</Text>
        </div>
      ) : (
        rooms.map(room => (
          <ChatRoomCard
            key={room.id}
            room={room}
            currentUserId={currentUserId}
            onAccepted={onAccepted}
            isActive={room.id === activeRoomId}
          />
        ))
      )}
    </section>
  );
}

interface Props {
  rooms: ChatRoom[];
  currentUserId: number;
  activeRoomId?: number;
  onAccepted: (roomId: number) => void;
  loading?: boolean;
  onGoHome?: () => void;
}

export default function ChatSidebar({ rooms, currentUserId, activeRoomId, onAccepted, loading, onGoHome }: Props) {
  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0);
  const pending = rooms.filter(r => r.status === 'PENDING');
  const open    = rooms.filter(r => r.status === 'OPEN');
  const closed  = rooms.filter(r => r.status === 'CLOSED');

  return (
    <div className="dm-sidebar-inner">
      {/* Header */}
      <div className="dm-sidebar-header">
        <Flex align="center" gap={8}>
          <Text strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>채팅</Text>
          {totalUnread > 0 && (
            <div className="dm-unread-badge" style={{ position: 'static' }}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </div>
          )}
        </Flex>
      </div>

      {/* Room list */}
      <div className="dm-sidebar-rooms">
        {loading ? (
          <Flex align="center" justify="center" style={{ height: 200 }}>
            <Spin indicator={<LoadingOutlined spin />} />
          </Flex>
        ) : rooms.length === 0 ? (
          <Flex vertical align="center" justify="center" gap={12} style={{ padding: '60px 24px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageOutlined style={{ fontSize: 22, color: 'var(--accent)' }} />
            </div>
            <Flex vertical align="center" gap={4}>
              <Text strong style={{ fontSize: 14 }}>채팅이 없어요</Text>
              <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
                질문에 멘토링을 제안하거나<br />제안이 오면 여기서 확인돼요.
              </Text>
            </Flex>
            {onGoHome && (
              <Button size="small" onClick={onGoHome}>질문 목록 보기</Button>
            )}
          </Flex>
        ) : (
          <>
            <Section
              title="대기중"
              badge={pending.length > 0 ? String(pending.length) : undefined}
              rooms={pending}
              currentUserId={currentUserId}
              activeRoomId={activeRoomId}
              onAccepted={onAccepted}
            />
            <Section
              title="진행중"
              rooms={open}
              currentUserId={currentUserId}
              activeRoomId={activeRoomId}
              onAccepted={onAccepted}
              emptyText={pending.length > 0 || closed.length > 0 ? '진행 중인 채팅이 없어요.' : undefined}
            />
            <Section
              title="종료됨"
              rooms={closed}
              currentUserId={currentUserId}
              activeRoomId={activeRoomId}
              onAccepted={onAccepted}
            />
          </>
        )}
      </div>
    </div>
  );
}
