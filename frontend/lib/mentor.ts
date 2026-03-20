import { apiFetch } from './api';
import type { MentorApplication, MentorApplyRequest } from '@/types/mentor';

export function applyMentor(request: MentorApplyRequest) {
  return apiFetch<MentorApplication>('/api/mentor/apply', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getMyApplication() {
  return apiFetch<MentorApplication | null>('/api/mentor/apply/me');
}
