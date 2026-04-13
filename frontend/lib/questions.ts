import { apiFetch } from './api';
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  QuestionRequest,
  QuestionCategory,
  QuestionType,
  QuestionStatus,
} from '@/types/question';

export function getQuestions(params?: {
  keyword?: string;
  category?: QuestionCategory;
  questionType?: QuestionType;
  status?: QuestionStatus;
  page?: number;
  size?: number;
}) {
  const filtered = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(filtered as Record<string, string>).toString();
  return apiFetch<Page<QuestionSummary>>(`/api/questions${query ? `?${query}` : ''}`);
}

export function getQuestion(id: number) {
  return apiFetch<QuestionDetail>(`/api/questions/${id}`);
}

export function createQuestion(data: QuestionRequest) {
  return apiFetch<QuestionDetail>('/api/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateQuestion(id: number, data: QuestionRequest) {
  return apiFetch<QuestionDetail>(`/api/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteQuestion(id: number) {
  return apiFetch<null>(`/api/questions/${id}`, { method: 'DELETE' });
}

export function closeQuestion(id: number) {
  return apiFetch<QuestionDetail>(`/api/questions/${id}/close`, { method: 'PATCH' });
}
