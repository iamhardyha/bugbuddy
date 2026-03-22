import { adminApiFetch } from '../adminApi';
import type { AdminPage, AdminUser, AdminUserDetail } from '@/types/admin';

export function getAdminUsers(params?: {
  keyword?: string;
  mentorStatus?: string;
  suspended?: boolean;
  page?: number;
  size?: number;
}) {
  const p = new URLSearchParams();
  if (params?.keyword) p.set('keyword', params.keyword);
  if (params?.mentorStatus) p.set('mentorStatus', params.mentorStatus);
  if (params?.suspended !== undefined) p.set('suspended', String(params.suspended));
  p.set('page', String(params?.page ?? 0));
  p.set('size', String(params?.size ?? 20));
  return adminApiFetch<AdminPage<AdminUser>>(`/api/admin/users?${p}`);
}

export const getAdminUserDetail = (id: number) =>
  adminApiFetch<AdminUserDetail>(`/api/admin/users/${id}`);

export const suspendUser = (id: number, suspendDays: number) =>
  adminApiFetch<void>(`/api/admin/users/${id}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({ suspendDays }),
  });

export const unsuspendUser = (id: number) =>
  adminApiFetch<void>(`/api/admin/users/${id}/suspend`, { method: 'DELETE' });

export const deactivateUser = (id: number) =>
  adminApiFetch<void>(`/api/admin/users/${id}/deactivate`, { method: 'PATCH' });

export const changeNickname = (id: number, nickname: string) =>
  adminApiFetch<void>(`/api/admin/users/${id}/nickname`, {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });

export const adjustXp = (id: number, deltaXp: number, reason: string) =>
  adminApiFetch<void>(`/api/admin/users/${id}/xp`, {
    method: 'PATCH',
    body: JSON.stringify({ deltaXp, reason }),
  });

export const changeMentorStatus = (id: number, mentorStatus: string) =>
  adminApiFetch<void>(`/api/admin/users/${id}/mentor-status`, {
    method: 'PATCH',
    body: JSON.stringify({ mentorStatus }),
  });
