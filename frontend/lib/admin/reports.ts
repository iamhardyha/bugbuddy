import { adminApiFetch } from '../adminApi';
import type { AdminPage, AdminReport } from '@/types/admin';

export const getAdminReports = (status?: string, page = 0, size = 20) => {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) p.set('status', status);
  return adminApiFetch<AdminPage<AdminReport>>(`/api/admin/reports?${p}`);
};

export const reviewReport = (id: number) =>
  adminApiFetch<void>(`/api/admin/reports/${id}/review`, { method: 'PATCH' });

export const resolveReport = (id: number, suspend = false, suspendDays = 0) =>
  adminApiFetch<void>(`/api/admin/reports/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ suspend, suspendDays }),
  });

export const rejectReport = (id: number) =>
  adminApiFetch<void>(`/api/admin/reports/${id}/reject`, { method: 'PATCH' });
