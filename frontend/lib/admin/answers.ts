import { adminApiFetch } from '../adminApi';
import type { AdminPage, AdminAnswer } from '@/types/admin';

export const getAdminAnswers = (page = 0, size = 20) =>
  adminApiFetch<AdminPage<AdminAnswer>>(`/api/admin/answers?page=${page}&size=${size}`);

export const hideAnswer = (id: number) =>
  adminApiFetch<void>(`/api/admin/answers/${id}/hide`, { method: 'PATCH' });

export const restoreAnswer = (id: number) =>
  adminApiFetch<void>(`/api/admin/answers/${id}/restore`, { method: 'PATCH' });

export const deleteAnswer = (id: number) =>
  adminApiFetch<void>(`/api/admin/answers/${id}`, { method: 'DELETE' });
