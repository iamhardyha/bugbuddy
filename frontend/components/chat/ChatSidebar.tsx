'use client';

import { Flex, Spin, Typography, Button } from 'antd';
import { LoadingOutlined, MessageOutlined } from '@ant-design/icons';
import ChatRoomCard from './ChatRoomCard';
import type { ChatRoom } from '@/types/chat';
import styles from './ChatSidebar.module.css';
import roomCardStyles from './ChatRoomCard.module.css';

const { Text } = Typography;

interface SectionProps {
  title: string;
  dotColor: string;
  badge?: string;
  rooms: ChatRoom[];
  currentUserId: number;
  activeRoomId?: number;
  onAccepted: (roomId: number) => void;
  emptyText?: string;
}

function Section({ title, dotColor, badge, rooms, currentUserId, activeRoomId, onAccepted, emptyText }: SectionProps) {
  if (rooms.length === 0 && !emptyText) return null;
  return (
    <section>
      <Flex align="center" gap={6} style={{ padding: '12px 16px 6px' }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: dotColor, flexShrink: 0,
          boxShadow: `0 0 5px ${dotColor}88`,
        }} />
        <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          {title}
        </Text>
        {badge && <div className={styles.sectionBadge}>{badge}</div>}
      </Flex>
      {rooms.length === 0 ? (
        <div style={{ padding: '4px 16px 12px' }}>
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
    <div className={styles.sidebarInner}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
        <Flex align="center" gap={8}>
          <Text strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>채팅</Text>
          {totalUnread > 0 && (
            <div className={roomCardStyles.unreadBadge} style={{ position: 'static' }}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </div>
          )}
        </Flex>
      </div>

      {/* Room list */}
      <div className={styles.sidebarRooms}>
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
              dotColor="var(--warning-text)"
              badge={pending.length > 0 ? String(pending.length) : undefined}
              rooms={pending}
              currentUserId={currentUserId}
              activeRoomId={activeRoomId}
              onAccepted={onAccepted}
              emptyText="대기 중인 채팅이 없어요."
            />
            <Section
              title="진행중"
              dotColor="var(--status-open)"
              rooms={open}
              currentUserId={currentUserId}
              activeRoomId={activeRoomId}
              onAccepted={onAccepted}
              emptyText="진행 중인 채팅이 없어요."
            />
            <Section
              title="종료됨"
              dotColor="var(--text-tertiary)"
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
