import { apiFetch } from './api';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import type { Page } from '@/types/question';

export function getChatRooms() {
  return apiFetch<ChatRoom[]>('/api/chat/rooms');
}

export function markAsRead(roomId: number) {
  return apiFetch<void>(`/api/chat/rooms/${roomId}/read`, { method: 'PATCH' });
}

export function getChatMessages(roomId: number, page = 0) {
  return apiFetch<Page<ChatMessage>>(
    `/api/chat/rooms/${roomId}/messages?page=${page}&size=50&sort=createdAt,asc`
  );
}

export function createChatRoom(questionId: number) {
  return apiFetch<ChatRoom>('/api/chat/rooms', {
    method: 'POST',
    body: JSON.stringify({ questionId }),
  });
}

export function acceptChatRoom(roomId: number) {
  return apiFetch<ChatRoom>(`/api/chat/rooms/${roomId}/accept`, {
    method: 'PATCH',
  });
}

export function closeChatRoom(roomId: number) {
  return apiFetch<ChatRoom>(`/api/chat/rooms/${roomId}/close`, {
    method: 'PATCH',
  });
}

export function submitFeedback(roomId: number, data: { rating: number; comment?: string }) {
  return apiFetch<void>(`/api/chat/rooms/${roomId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
