import { adminApiFetch } from '../adminApi';
import type {
  DashboardSummary,
  TrendData,
  ActiveUsers,
  ReportSummary,
  CategoryCount,
  TagCount,
  LevelCount,
  FeedStats,
} from '@/types/admin';

export const getDashboardSummary = () =>
  adminApiFetch<DashboardSummary>('/api/admin/dashboard/summary');

export const getTrends = (type: string, period = 'DAILY', days = 30) => {
  const p = new URLSearchParams({ type, period, days: String(days) });
  return adminApiFetch<TrendData>(`/api/admin/dashboard/trends?${p}`);
};

export const getActiveUsers = () =>
  adminApiFetch<ActiveUsers>('/api/admin/dashboard/active-users');

export const getReportSummary = () =>
  adminApiFetch<ReportSummary>('/api/admin/dashboard/reports');

export const getCategoryDistribution = () =>
  adminApiFetch<{ categories: CategoryCount[] }>('/api/admin/dashboard/categories');

export const getTagRanking = (limit = 20) =>
  adminApiFetch<{ tags: TagCount[] }>(`/api/admin/dashboard/tags?limit=${limit}`);

export const getXpDistribution = () =>
  adminApiFetch<{ levels: LevelCount[] }>('/api/admin/dashboard/xp-distribution');

export const getFeedStats = () =>
  adminApiFetch<FeedStats>('/api/admin/dashboard/feeds');
