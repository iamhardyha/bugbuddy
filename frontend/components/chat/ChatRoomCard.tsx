'use client';

import { useRouter } from 'next/navigation';
import { Flex, Typography, Button } from 'antd';
import { PushpinOutlined } from '@ant-design/icons';
import { acceptChatRoom } from '@/lib/chat';
import type { ChatRoom } from '@/types/chat';

const { Text } = Typography;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (hr < 24) return `${hr}시간 전`;
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    ['#e8e0ff', '#5548e0'], ['#d4f5e9', '#1a9c5e'], ['#dbeafe', '#2878e8'],
    ['#fde8d8', '#a0522d'], ['#fce7f3', '#be185d'],
  ];
  const [bg, fg] = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

interface Props {
  room: ChatRoom;
  currentUserId: number;
  onAccepted: (roomId: number) => void;
  isActive?: boolean;
}

export default function ChatRoomCard({ room, currentUserId, onAccepted, isActive }: Props) {
  const router = useRouter();
  const isMentor = room.mentorUserId === currentUserId;
  const counterpart = isMentor ? room.menteeNickname : room.mentorNickname;
  const hasUnread = room.unreadCount > 0;
  const isMentee = room.menteeUserId === currentUserId;
  const isPending = room.status === 'PENDING';
  const canAccept = isPending && isMentee;

  async function handleAccept(e: React.MouseEvent) {
    e.stopPropagation();
    const res = await acceptChatRoom(room.id);
    if (res.success) onAccepted(room.id);
  }

  const lastTime = room.lastMessageAt ?? room.createdAt;
  const previewText = isPending
    ? isMentor ? '채팅 제안을 보냈어요' : '채팅 제안이 왔어요'
    : room.lastMessageContent ?? '대화를 시작해보세요';

  return (
    <button
      className="dm-room-card"
      onClick={() => router.push(`/chat/${room.id}`)}
      data-unread={hasUnread}
      data-active={isActive}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={counterpart} />
        {hasUnread && !isActive && <div className="dm-unread-dot" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" justify="space-between" gap={8}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: hasUnread ? 700 : 500,
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {counterpart}
          </Text>
          <Text style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
            {relativeTime(lastTime)}
          </Text>
        </Flex>

        <Flex align="center" justify="space-between" gap={8} style={{ marginTop: 2 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: hasUnread ? 600 : 400,
              color: hasUnread ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {previewText}
          </Text>

          {hasUnread && !isActive && (
            <div className="dm-unread-badge">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </div>
          )}

          {canAccept && (
            <Button
              type="primary"
              size="small"
              onClick={handleAccept}
              style={{ flexShrink: 0, fontSize: 12, height: 26, padding: '0 10px' }}
            >
              참여하기
            </Button>
          )}
        </Flex>

        {room.questionTitle && (
          <Flex align="center" gap={4} style={{ marginTop: 3 }}>
            <PushpinOutlined style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {room.questionTitle}
            </Text>
          </Flex>
        )}
      </div>
    </button>
  );
}
