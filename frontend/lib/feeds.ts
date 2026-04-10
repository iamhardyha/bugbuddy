import { apiFetch } from './api';
import type { Feed, FeedCategory, FeedComment, FeedCreateRequest, FeedCommentCreateRequest } from '@/types/feed';
import type { Page } from '@/types/question';

export function getFeeds(params?: { category?: string; sort?: string; page?: number; size?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.sort) searchParams.set('sort', params.sort);
  searchParams.set('page', String(params?.page ?? 0));
  searchParams.set('size', String(params?.size ?? 20));
  return apiFetch<Page<Feed>>(`/api/feeds?${searchParams.toString()}`);
}

export function getFeed(id: number) {
  return apiFetch<Feed>(`/api/feeds/${id}`);
}

export function createFeed(request: FeedCreateRequest) {
  return apiFetch<Feed>('/api/feeds', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function deleteFeed(id: number) {
  return apiFetch<void>(`/api/feeds/${id}`, { method: 'DELETE' });
}

export function likeFeed(id: number) {
  return apiFetch<void>(`/api/feeds/${id}/like`, { method: 'POST' });
}

export function unlikeFeed(id: number) {
  return apiFetch<void>(`/api/feeds/${id}/like`, { method: 'DELETE' });
}

export function bookmarkFeed(id: number) {
  return apiFetch<void>(`/api/feeds/${id}/bookmark`, { method: 'POST' });
}

export function removeBookmark(id: number) {
  return apiFetch<void>(`/api/feeds/${id}/bookmark`, { method: 'DELETE' });
}

export function getBookmarks(page = 0, size = 20) {
  return apiFetch<Page<Feed>>(`/api/feeds/bookmarks?page=${page}&size=${size}`);
}

export function createFeedComment(feedId: number, request: FeedCommentCreateRequest) {
  return apiFetch<FeedComment>(`/api/feeds/${feedId}/comments`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getFeedComments(feedId: number, page = 0, size = 20) {
  return apiFetch<Page<FeedComment>>(`/api/feeds/${feedId}/comments?page=${page}&size=${size}`);
}

export function deleteFeedComment(feedId: number, commentId: number) {
  return apiFetch<void>(`/api/feeds/${feedId}/comments/${commentId}`, { method: 'DELETE' });
}

export function updateFeed(id: number, request: { category: FeedCategory; comment: string }) {
  return apiFetch<Feed>(`/api/feeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function getLikedFeeds(page = 0, size = 20) {
  return apiFetch<Page<Feed>>(`/api/feeds/liked?page=${page}&size=${size}`);
}
