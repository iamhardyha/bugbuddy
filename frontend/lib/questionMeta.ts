import type { QuestionCategory, QuestionType, QuestionStatus } from '@/types/question';

export const CATEGORY_META: Record<QuestionCategory, { label: string; emoji: string }> = {
  BACKEND:  { label: '백엔드',      emoji: '🧩' },
  FRONTEND: { label: '프론트엔드',  emoji: '🎨' },
  DEVOPS:   { label: 'DevOps',      emoji: '🛠️' },
  MOBILE:   { label: '모바일',      emoji: '📱' },
  AI_DATA:  { label: 'AI/데이터',   emoji: '🤖' },
  CS_ALGO:  { label: 'CS/알고리즘', emoji: '🧪' },
  CAREER:   { label: '커리어',      emoji: '🚀' },
  FUTURE:   { label: '미래 고민',   emoji: '🌱' },
  ETC:      { label: '기타',        emoji: '🐞' },
};

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; emoji: string }> = {
  BUG:         { label: '버그/에러',    emoji: '🐛' },
  CONCEPT:     { label: '개념 설명',    emoji: '🧠' },
  ARCH:        { label: '설계/아키텍처', emoji: '🏗️' },
  PERF:        { label: '성능',         emoji: '⚙️' },
  OPS:         { label: '배포/운영',    emoji: '📦' },
  TECH_CHOICE: { label: '기술 선택',    emoji: '🤔' },
  CAREER:      { label: '진로/미래',    emoji: '🌱' },
  FUTURE:      { label: '미래 기술',    emoji: '🔭' },
};

export const STATUS_META: Record<QuestionStatus, { label: string; color: string }> = {
  OPEN:   { label: '답변 받는 중', color: 'text-green-700 bg-green-50 ring-green-600/20' },
  SOLVED: { label: '해결됨',       color: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
  CLOSED: { label: '마감',         color: 'text-gray-600 bg-gray-50 ring-gray-500/20' },
};

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR');
}
