export type NotificationType =
  | 'ANSWER_CREATED'
  | 'HELPFUL_RECEIVED'
  | 'ANSWER_ACCEPTED'
  | 'CHAT_REQUESTED'
  | 'CHAT_ACCEPTED'
  | 'CHAT_REJECTED'
  | 'MENTOR_APPROVED'
  | 'MENTOR_REJECTED'
  | 'FEED_LIKED'
  | 'FEED_COMMENTED';

export type ReferenceType = 'QUESTION' | 'ANSWER' | 'CHAT_MESSAGE' | 'CHAT_ROOM' | 'USER';

export interface Notification {
  id: number;
  type: NotificationType;
  refType: ReferenceType;
  refId: number;
  triggerUserNickname: string | null;
  targetTitle: string | null;
  linkUrl: string;
  read: boolean;
  createdAt: string;
}
