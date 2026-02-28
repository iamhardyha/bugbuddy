export const LEVEL_META = [
  { name: '새싹',    emoji: '🌱', minXp: 0 },
  { name: '루키',    emoji: '🐣', minXp: 100 },
  { name: '탐험가',  emoji: '🔍', minXp: 250 },
  { name: '기여자',  emoji: '✍️', minXp: 500 },
  { name: '해결사',  emoji: '🛠️', minXp: 900 },
  { name: '전문가',  emoji: '⚡', minXp: 1500 },
  { name: '시니어',  emoji: '🧑‍💻', minXp: 2500 },
  { name: '아키텍트', emoji: '🏗️', minXp: 4000 },
  { name: '고수',    emoji: '🔥', minXp: 6000 },
  { name: '휴먼AI',  emoji: '🤖', minXp: 10000 },
];

export function getLevelMeta(level: number) {
  return LEVEL_META[Math.min(level - 1, LEVEL_META.length - 1)] ?? LEVEL_META[0];
}

export function getXpProgress(xp: number, level: number) {
  const currentMin = LEVEL_META[level - 1]?.minXp ?? 0;
  const nextMin = LEVEL_META[level]?.minXp ?? null;
  if (nextMin === null) return { current: xp - currentMin, next: 0, percent: 100 };
  const range = nextMin - currentMin;
  const progress = xp - currentMin;
  return { current: progress, next: range, percent: Math.min(100, Math.round((progress / range) * 100)) };
}
