export type ChatRoomStatus = 'PENDING' | 'OPEN' | 'CLOSED';
export type ChatMessageType = 'TEXT' | 'FILE' | 'SYSTEM';

export interface ChatRoom {
  id: number;
  questionId: number | null;
  questionTitle: string | null;
  mentorUserId: number;
  mentorNickname: string;
  menteeUserId: number;
  menteeNickname: string;
  status: ChatRoomStatus;
  unreadCount: number;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  closedAt: string | null;
  myFeedbackSubmitted: boolean;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderUserId: number;
  senderNickname: string;
  messageType: ChatMessageType;
  content: string;
  createdAt: string;
}
