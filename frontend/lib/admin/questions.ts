import { adminApiFetch } from '../adminApi';
import type { AdminPage, AdminQuestion } from '@/types/admin';

export const getAdminQuestions = (page = 0, size = 20) =>
  adminApiFetch<AdminPage<AdminQuestion>>(`/api/admin/questions?page=${page}&size=${size}`);

export const hideQuestion = (id: number) =>
  adminApiFetch<void>(`/api/admin/questions/${id}/hide`, { method: 'PATCH' });

export const restoreQuestion = (id: number) =>
  adminApiFetch<void>(`/api/admin/questions/${id}/restore`, { method: 'PATCH' });

export const deleteQuestion = (id: number) =>
  adminApiFetch<void>(`/api/admin/questions/${id}`, { method: 'DELETE' });
