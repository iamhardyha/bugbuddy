import { apiFetch } from './api';
import type { Answer, AnswerRequest } from '@/types/answer';
import type { Page } from '@/types/question';

export function getAnswers(questionId: number) {
  return apiFetch<Page<Answer>>(
    `/api/questions/${questionId}/answers?size=100&sort=createdAt,asc`
  );
}

export function createAnswer(questionId: number, data: AnswerRequest) {
  return apiFetch<Answer>(`/api/questions/${questionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAnswer(questionId: number, answerId: number, data: AnswerRequest) {
  return apiFetch<Answer>(`/api/questions/${questionId}/answers/${answerId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteAnswer(questionId: number, answerId: number) {
  return apiFetch<null>(`/api/questions/${questionId}/answers/${answerId}`, {
    method: 'DELETE',
  });
}

export function acceptAnswer(questionId: number, answerId: number) {
  return apiFetch<Answer>(`/api/questions/${questionId}/answers/${answerId}/accept`, {
    method: 'PATCH',
  });
}

export function addHelpful(questionId: number, answerId: number) {
  return apiFetch<Answer>(`/api/questions/${questionId}/answers/${answerId}/reactions`, {
    method: 'POST',
  });
}

export function removeHelpful(questionId: number, answerId: number) {
  return apiFetch<Answer>(`/api/questions/${questionId}/answers/${answerId}/reactions`, {
    method: 'DELETE',
  });
}
