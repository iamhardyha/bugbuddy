import { adminApiFetch } from '../adminApi';
import type { AdminPage, AdminMentorApp } from '@/types/admin';

export const getAdminMentorApps = (status?: string, page = 0, size = 20) => {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) p.set('status', status);
  return adminApiFetch<AdminPage<AdminMentorApp>>(`/api/admin/mentor/applications?${p}`);
};

export const getAdminMentorApp = (id: number) =>
  adminApiFetch<AdminMentorApp>(`/api/admin/mentor/applications/${id}`);

export const approveMentor = (id: number) =>
  adminApiFetch<void>(`/api/admin/mentor/applications/${id}/approve`, { method: 'PATCH' });

export const rejectMentor = (id: number, rejectionReason: string) =>
  adminApiFetch<void>(`/api/admin/mentor/applications/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason }),
  });
