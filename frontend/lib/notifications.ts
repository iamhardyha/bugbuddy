import { apiFetch } from './api';
import type { Notification } from '@/types/notification';
import type { Page } from '@/types/question';

export function getNotifications(page = 0, size = 20) {
  return apiFetch<Page<Notification>>(`/api/notifications?page=${page}&size=${size}`);
}

export function getUnreadCount() {
  return apiFetch<number>('/api/notifications/unread-count');
}

export function markAsRead(id: number) {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllAsRead() {
  return apiFetch<void>('/api/notifications/read-all', { method: 'PATCH' });
}
