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
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
