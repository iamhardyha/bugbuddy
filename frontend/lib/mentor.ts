import { apiFetch } from './api';
import type {
  MentorApplication,
  MentorApplyRequest,
  MentorCard,
  MentorSort,
} from '@/types/mentor';
import type { Page } from '@/types/question';

export function applyMentor(request: MentorApplyRequest) {
  return apiFetch<MentorApplication>('/api/mentor/apply', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getMyApplication() {
  return apiFetch<MentorApplication | null>('/api/mentor/apply/me');
}

export function getMentors(params?: {
  keyword?: string;
  sort?: MentorSort;
  page?: number;
  size?: number;
}) {
  const filtered = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(filtered as Record<string, string>).toString();
  return apiFetch<Page<MentorCard>>(`/api/mentors${query ? `?${query}` : ''}`);
}
