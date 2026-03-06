'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Flex, Tag, Spin, Input, Typography } from 'antd';
import {
  LoadingOutlined,
  SendOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { getChatRooms, getChatMessages, acceptChatRoom, closeChatRoom, submitFeedback } from '@/lib/chat';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useStompChat } from '@/hooks/useStompChat';
import { useModal } from '@/components/common/ModalProvider';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import ChatFeedbackModal from '@/components/chat/ChatFeedbackModal';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import type { UserProfile } from '@/types/user';

const { Text } = Typography;

const ROOM_STATUS_META: Record<ChatRoom['status'], { label: string; bg: string; color: string }> = {
  PENDING: { label: '대기 중', bg: 'var(--warning-bg)', color: 'var(--warning-text)' },
  OPEN: { label: '진행 중', bg: 'var(--status-open-bg)', color: 'var(--status-open)' },
  CLOSED: { label: '종료', bg: 'var(--bg-elevated)', color: 'var(--text-tertiary)' },
};

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roomId = Number(params.id);
  const { confirm } = useModal();

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { connected, sendMessage } = useStompChat(roomId, handleNewMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }

    async function load() {
      const [roomsRes, messagesRes, userRes] = await Promise.all([
        getChatRooms(),
        getChatMessages(roomId),
        apiFetch<UserProfile>('/api/auth/me'),
      ]);

      if (roomsRes.success && roomsRes.data) {
        const found = roomsRes.data.find(r => r.id === roomId);
        if (found) setRoom(found);
      }
      if (messagesRes.success && messagesRes.data) {
        setMessages(messagesRes.data.content);
      }
      if (userRes.success && userRes.data) {
        setCurrentUser(userRes.data);
      }
      setLoading(false);
    }

    load();
  }, [roomId, router]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !connected) return;
    sendMessage(text);
    setInput('');
  }

  async function handleAccept() {
    const ok = await confirm({
      title: '채팅을 수락할까요?',
      message: '멘토와 1:1 채팅이 시작됩니다.',
      variant: 'info',
      confirmLabel: '수락',
    });
    if (!ok) return;
    const res = await acceptChatRoom(roomId);
    if (res.success && res.data) setRoom(res.data);
  }

  async function handleClose() {
    const ok = await confirm({
      title: '세션을 종료할까요?',
      message: '종료 후에는 메시지를 보낼 수 없습니다.',
      variant: 'warning',
      confirmLabel: '종료',
    });
    if (!ok) return;
    const res = await closeChatRoom(roomId);
    if (res.success && res.data) {
      setRoom(res.data);
      setFeedbackOpen(true);
    }
  }

  async function handleFeedback(rating: number, comment: string) {
    const res = await submitFeedback(roomId, { rating, comment: comment || undefined });
    if (res.success) {
      setFeedbackSubmitted(true);
      setFeedbackOpen(false);
    }
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

  if (!room || !currentUser) {
    return (
      <div className="page-root">
        <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: '60vh' }}>
          <Text type="secondary" style={{ fontSize: 14 }}>채팅방을 찾을 수 없어요.</Text>
          <Button type="link" onClick={() => router.replace('/chat')}>목록으로</Button>
        </Flex>
      </div>
    );
  }

  const isMentor = room.mentorUserId === currentUser.id;
  const isMentee = room.menteeUserId === currentUser.id;
  const counterpart = isMentor ? room.menteeNickname : room.mentorNickname;
  const status = ROOM_STATUS_META[room.status];

  const canAccept = room.status === 'PENDING' && isMentee;
  const canClose = room.status === 'OPEN' && (isMentor || isMentee);
  const canSend = room.status === 'OPEN' && connected;
  const showFeedbackBtn = room.status === 'CLOSED' && !feedbackSubmitted;

  return (
    <div className="chat-room-root">
      {/* 헤더 */}
      <header className="chat-room-header">
        <Flex align="center" justify="space-between" gap={12}>
          <Flex align="center" gap={10} style={{ minWidth: 0 }}>
            <Button
              type="link"
              onClick={() => router.push('/chat')}
              style={{ padding: 0, height: 'auto', fontSize: 13, color: 'var(--text-tertiary)', flexShrink: 0 }}
            >
              ←
            </Button>
            <Flex align="center" gap={8} style={{ minWidth: 0 }}>
              <Text
                strong
                style={{
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {counterpart}
              </Text>
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
          </Flex>

          <Flex align="center" gap={8} style={{ flexShrink: 0 }}>
            {room.status === 'OPEN' && (
              connected
                ? <WifiOutlined style={{ color: 'var(--status-open)', fontSize: 14 }} />
                : <DisconnectOutlined style={{ color: 'var(--text-tertiary)', fontSize: 14 }} />
            )}
            {canAccept && (
              <Button size="small" type="primary" onClick={handleAccept}>수락</Button>
            )}
            {canClose && (
              <Button
                size="small"
                onClick={handleClose}
                style={{ borderColor: 'var(--warning-text)', color: 'var(--warning-text)' }}
              >
                종료
              </Button>
            )}
            {showFeedbackBtn && (
              <Button size="small" onClick={() => setFeedbackOpen(true)}>
                피드백 작성
              </Button>
            )}
          </Flex>
        </Flex>

        {room.questionTitle && (
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              marginTop: 6,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            📌 {room.questionTitle}
          </Text>
        )}
      </header>

      {/* 메시지 목록 */}
      <div className="chat-messages-area">
        {messages.length === 0 && (
          <Flex align="center" justify="center" style={{ height: '100%' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {room.status === 'PENDING'
                ? '채팅을 수락하면 대화를 시작할 수 있어요.'
                : '첫 메시지를 보내보세요.'}
            </Text>
          </Flex>
        )}
        {messages.map(msg => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            isMe={msg.senderUserId === currentUser.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      {canSend ? (
        <div className="chat-input-bar">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={e => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지를 입력하세요 (Shift+Enter: 줄바꿈)"
            style={{ flex: 1, borderRadius: 8 }}
            suffix={
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!input.trim()}
                style={{ color: input.trim() ? 'var(--accent)' : 'var(--text-tertiary)' }}
              />
            }
          />
        </div>
      ) : canAccept ? (
        <div className="chat-input-bar">
          <Flex justify="center" style={{ width: '100%' }}>
            <Button type="primary" onClick={handleAccept}>채팅 수락하기</Button>
          </Flex>
        </div>
      ) : room.status === 'CLOSED' ? (
        <div className="chat-input-bar">
          <Flex justify="center" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>종료된 채팅방입니다.</Text>
          </Flex>
        </div>
      ) : null}

      <ChatFeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handleFeedback}
      />
    </div>
  );
}
