import { apiFetch } from './api';

export type RankingPeriod = 'all' | 'weekly' | 'monthly';
export type RankingOffset = 'current' | 'previous';

export interface RankingRow {
  rank: number;
  userId: number;
  nickname: string;
  level: number;
  xp: number;
  periodXp: number | null;
  bio: string | null;
  mentorStatus: string | null;
  acceptedAnswerCount: number;
  answerCount: number;
  questionCount: number;
  isCurrentUser: boolean;
}

export interface MyRank {
  rank: number;
  xp: number;
  periodXp: number | null;
  xpToTop100: number;
  inTop100: boolean;
  acceptedAnswerCount: number;
  answerCount: number;
  questionCount: number;
}

export interface RankingResponse {
  period: string;
  offset: string;
  rangeStart: string | null;
  rangeEnd: string | null;
  topRankings: RankingRow[];
  myRank: MyRank | null;
}

interface CacheEntry {
  data: RankingResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

function cacheKey(period: RankingPeriod, offset: RankingOffset): string {
  return `${period}:${offset}`;
}

export async function fetchRanking(
  period: RankingPeriod,
  offset: RankingOffset,
  signal?: AbortSignal,
): Promise<RankingResponse> {
  const key = cacheKey(period, offset);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.data;

  const qs = new URLSearchParams({ period, offset });
  const res = await apiFetch<RankingResponse>(`/api/rankings?${qs.toString()}`, { signal });

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? '랭킹을 불러오지 못했습니다.');
  }

  cache.set(key, { data: res.data, expiresAt: now + TTL_MS });
  return res.data;
}

export function invalidateRankingCache() {
  cache.clear();
}
