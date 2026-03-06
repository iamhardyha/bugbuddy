'use client';

import { Flex, Typography } from 'antd';
import MarkdownRenderer from '@/components/editor/MarkdownRenderer';
import type { ChatMessage } from '@/types/chat';

const { Text } = Typography;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  message: ChatMessage;
  isMe: boolean;
}

export default function ChatMessageItem({ message, isMe }: Props) {
  if (message.messageType === 'SYSTEM') {
    return (
      <Flex justify="center" style={{ margin: '8px 0' }}>
        <Text
          type="secondary"
          style={{
            fontSize: 12,
            background: 'var(--bg-elevated)',
            borderRadius: 999,
            padding: '3px 14px',
            border: '1px solid var(--border-faint)',
          }}
        >
          {message.content}
        </Text>
      </Flex>
    );
  }

  const isMarkdown =
    message.content.includes('\n') ||
    message.content.startsWith('```') ||
    message.content.startsWith('#');

  return (
    <Flex
      vertical
      align={isMe ? 'flex-end' : 'flex-start'}
      style={{ marginBottom: 16 }}
    >
      {!isMe && (
        <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, marginLeft: 4 }}>
          {message.senderNickname}
        </Text>
      )}
      <Flex
        align="flex-end"
        gap={6}
        style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}
      >
        <div className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'}`}>
          {isMarkdown ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: isMe ? '#fff' : 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.55,
              }}
            >
              {message.content}
            </Text>
          )}
        </div>
        <Text type="secondary" style={{ fontSize: 10, flexShrink: 0, marginBottom: 2 }}>
          {formatTime(message.createdAt)}
        </Text>
      </Flex>
    </Flex>
  );
}
