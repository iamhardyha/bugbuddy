import { apiFetch } from './api';
import type { PublicProfile, UserStats, UserAnswerSummary } from '@/types/user';
import type { Page, QuestionSummary } from '@/types/question';

export function getPublicProfile(userId: number) {
  return apiFetch<PublicProfile>(`/api/users/${userId}`);
}

export function updateProfile(data: { nickname: string; bio?: string | null }) {
  return apiFetch<null>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deactivateAccount() {
  return apiFetch<null>('/api/users/me', { method: 'DELETE' });
}

export function getUserQuestions(userId: number, page = 0) {
  return apiFetch<Page<QuestionSummary>>(`/api/users/${userId}/questions?page=${page}&size=10`);
}

export function getUserAnswers(userId: number, page = 0) {
  return apiFetch<Page<UserAnswerSummary>>(`/api/users/${userId}/answers?page=${page}&size=10`);
}

export function getUserStats(userId: number) {
  return apiFetch<UserStats>(`/api/users/${userId}/stats`);
}
