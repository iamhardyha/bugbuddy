import { adminApiFetch } from '../adminApi';
import type { AdminPage, AdminFeed } from '@/types/admin';

export const getAdminFeeds = (page = 0, size = 20) =>
  adminApiFetch<AdminPage<AdminFeed>>(`/api/admin/feeds?page=${page}&size=${size}`);

export const hideFeed = (id: number) =>
  adminApiFetch<void>(`/api/admin/feeds/${id}/hide`, { method: 'PATCH' });

export const restoreFeed = (id: number) =>
  adminApiFetch<void>(`/api/admin/feeds/${id}/restore`, { method: 'PATCH' });

export const deleteFeed = (id: number) =>
  adminApiFetch<void>(`/api/admin/feeds/${id}`, { method: 'DELETE' });
