'use client';

import { useRouter } from 'next/navigation';
import { Flex, Tag, Typography } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import type { ChatRoom } from '@/types/chat';

const { Text } = Typography;

const STATUS_META: Record<ChatRoom['status'], { label: string; bg: string; color: string }> = {
  PENDING: { label: '대기 중', bg: 'var(--warning-bg)', color: 'var(--warning-text)' },
  OPEN: { label: '진행 중', bg: 'var(--status-open-bg)', color: 'var(--status-open)' },
  CLOSED: { label: '종료', bg: 'var(--bg-elevated)', color: 'var(--text-tertiary)' },
};

interface Props {
  room: ChatRoom;
  currentUserId: number;
}

export default function ChatRoomCard({ room, currentUserId }: Props) {
  const router = useRouter();
  const counterpart =
    room.mentorUserId === currentUserId ? room.menteeNickname : room.mentorNickname;
  const role = room.mentorUserId === currentUserId ? '멘티' : '멘토';
  const status = STATUS_META[room.status];

  return (
    <button className="chat-room-card" onClick={() => router.push(`/chat/${room.id}`)}>
      <Flex align="center" justify="space-between" gap={12}>
        <Flex align="center" gap={12} style={{ minWidth: 0 }}>
          <div className="chat-room-avatar">
            <MessageOutlined style={{ fontSize: 16, color: 'var(--accent)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <Flex align="center" gap={6} style={{ marginBottom: 2 }}>
              <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {counterpart}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {role}
              </Text>
            </Flex>
            {room.questionTitle && (
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {room.questionTitle}
              </Text>
            )}
          </div>
        </Flex>
        <Tag
          style={{
            background: status.bg,
            color: status.color,
            border: 'none',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {status.label}
        </Tag>
      </Flex>
    </button>
  );
}
