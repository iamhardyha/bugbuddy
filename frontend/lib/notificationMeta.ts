import type { ReactNode } from 'react';
import {
  MessageOutlined,
  LikeOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CheckOutlined,
  BellOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { createElement } from 'react';

export interface NotificationMeta {
  text: (nickname: string) => string;
  icon: ReactNode;
  color: string;
  bg: string;
  filterGroup: 'ANSWER' | 'CHAT' | null;
}

export const NOTIFICATION_META: Record<string, NotificationMeta> = {
  ANSWER_CREATED: {
    text: (n) => `${n}님이 답변을 등록했습니다`,
    icon: createElement(MessageOutlined),
    color: '#5548e0',
    bg: 'rgba(85,72,224,0.1)',
    filterGroup: 'ANSWER',
  },
  HELPFUL_RECEIVED: {
    text: (n) => `${n}님이 도움됐어요를 눌렀습니다`,
    icon: createElement(LikeOutlined),
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
    filterGroup: 'ANSWER',
  },
  ANSWER_ACCEPTED: {
    text: (n) => `${n}님이 답변을 채택했습니다`,
    icon: createElement(CheckCircleOutlined),
    color: '#d97706',
    bg: 'rgba(217,119,6,0.1)',
    filterGroup: 'ANSWER',
  },
  CHAT_REQUESTED: {
    text: (n) => `${n}님이 채팅을 신청했습니다`,
    icon: createElement(TeamOutlined),
    color: '#5548e0',
    bg: 'rgba(85,72,224,0.1)',
    filterGroup: 'CHAT',
  },
  CHAT_ACCEPTED: {
    text: (n) => `${n}님이 채팅을 수락했습니다`,
    icon: createElement(CheckOutlined),
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.1)',
    filterGroup: 'CHAT',
  },
  MENTOR_APPROVED: {
    text: () => '멘토 인증이 승인되었습니다',
    icon: createElement(TrophyOutlined),
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.1)',
    filterGroup: null,
  },
  MENTOR_REJECTED: {
    text: () => '멘토 신청이 반려되었습니다',
    icon: createElement(CloseCircleOutlined),
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.1)',
    filterGroup: null,
  },
  FEED_LIKED: {
    text: (n) => `${n}님이 테크피드를 추천했습니다`,
    icon: createElement(LinkOutlined),
    color: '#5548e0',
    bg: 'rgba(85,72,224,0.1)',
    filterGroup: null,
  },
  FEED_COMMENTED: {
    text: (n) => `${n}님이 테크피드에 댓글을 남겼습니다`,
    icon: createElement(CommentOutlined),
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
    filterGroup: null,
  },
};

export const FALLBACK_META: NotificationMeta = {
  text: () => '알림이 있습니다',
  icon: createElement(BellOutlined),
  color: '#6b7280',
  bg: 'rgba(107,114,128,0.1)',
  filterGroup: null,
};

export function getMeta(type: string): NotificationMeta {
  return NOTIFICATION_META[type] ?? FALLBACK_META;
}
