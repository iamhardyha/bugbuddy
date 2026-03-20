# 멘토 신청 프론트엔드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 멘토 신청 페이지(상태별 분기) + 설정 페이지 멘토 카드 + 알림 메타 추가

**Architecture:** `/mentor/apply` 페이지에서 API 조회 → 상태별 컴포넌트 분기. MentorApplyForm(신청 폼) + MentorStatusCard(상태 카드) 재사용. antd 컴포넌트 우선.

**Tech Stack:** Next.js App Router, TypeScript, antd v6, CSS Modules

**Spec:** `docs/superpowers/specs/2026-03-21-mentor-frontend-design.md`

---

## 태스크 실행 순서

```
Task 1 (타입 + API 유틸) → Task 2 (알림 메타) → Task 3 (CSS + 컴포넌트)
  → Task 4 (멘토 신청 페이지) → Task 5 (설정 페이지 멘토 카드)
  → Task 6 (빌드 검증)
```

---

### Task 1: 타입 + API 유틸

**Files:**
- Create: `frontend/types/mentor.ts`
- Create: `frontend/lib/mentor.ts`

- [ ] **Step 1: types/mentor.ts**

```typescript
export type MentorApplicationLinkType = 'GITHUB' | 'LINKEDIN' | 'BLOG' | 'PORTFOLIO' | 'OTHER';
export type MentorApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MentorLink {
  linkType: MentorApplicationLinkType;
  url: string;
}

export interface MentorApplication {
  id: number;
  status: MentorApplicationStatus;
  q1Answer: string;
  q2Answer: string;
  links: MentorLink[];
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface MentorApplyRequest {
  links: MentorLink[];
  q1Answer: string;
  q2Answer: string;
}
```

- [ ] **Step 2: lib/mentor.ts**

```typescript
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
```

---

### Task 2: 알림 메타 추가

**Files:**
- Modify: `frontend/types/notification.ts` — NotificationType에 'MENTOR_APPROVED' | 'MENTOR_REJECTED' 추가
- Modify: `frontend/lib/notificationMeta.ts` — 멘토 알림 메타 2개 추가

```typescript
// notificationMeta.ts에 추가
MENTOR_APPROVED: {
  text: () => '멘토 인증이 승인되었습니다',
  icon: createElement(TrophyOutlined),
  color: '#16a34a',
  bg: 'rgba(22,163,74,0.1)',
  filterGroup: null,
},
MENTOR_REJECTED: {
  text: () => '멘토 신청이 반려되었습니다',
  icon: createElement(CloseCircleOutlined),
  color: '#dc2626',
  bg: 'rgba(220,38,38,0.1)',
  filterGroup: null,
},
```

import 추가: `TrophyOutlined`, `CloseCircleOutlined`

---

### Task 3: CSS + 컴포넌트 (MentorApplyForm + MentorStatusCard)

**Files:**
- Create: `frontend/components/mentor/MentorApply.module.css`
- Create: `frontend/components/mentor/MentorApplyForm.tsx`
- Create: `frontend/components/mentor/MentorStatusCard.tsx`

- [ ] **Step 1: MentorApply.module.css**

싱글 컬럼 레이아웃 + 카드 스타일:
- `.pageLayout` — min-height, padding, bg-base
- `.container` — max-width 640px, margin auto
- `.section` — bg-surface, border, border-radius 12px, padding
- `.linkRow` — flex, gap for link inputs
- `.statusCard` — text-align center, padding
- `.reasonBox` — 반려 사유 박스 스타일

- [ ] **Step 2: MentorApplyForm.tsx**

Props: `onSuccess: (app: MentorApplication) => void`

기능:
- 증빙 링크: 동적 추가/삭제, antd Select(linkType) + Input(url)
- 주관식 2문항: antd Input.TextArea
- 제출: applyMentor() 호출, 성공 시 onSuccess 콜백
- antd Form 또는 수동 state 관리 (기존 프로젝트 패턴: 수동 state)
- 에러: antd Alert

참조 패턴: `app/questions/new/page.tsx` — 폼 구현 패턴

- [ ] **Step 3: MentorStatusCard.tsx**

Props: `application: MentorApplication, compact?: boolean`

상태별 렌더링:
- PENDING: ⏳ 아이콘 + "심사 진행 중" + 신청일
- APPROVED: 🎓 아이콘 + "인증 멘토입니다" + 프로필 보기 버튼
- REJECTED: ❌ 아이콘 + 반려 사유 박스 + 재신청 가능일/버튼
  - 7일 경과 여부: `new Date(reviewedAt).getTime() + 7*24*60*60*1000 < Date.now()`
  - compact=true: 설정 페이지용 간략 버전

---

### Task 4: 멘토 신청 페이지

**Files:**
- Create: `frontend/app/mentor/apply/page.tsx`

- [ ] **Step 1: 페이지 생성**

'use client' 컴포넌트. 마운트 시 `getMyApplication()` 호출.

상태 분기:
```
loading → Spin
res.data === null → MentorApplyForm
res.data.status === 'PENDING' → MentorStatusCard(PENDING)
res.data.status === 'APPROVED' → MentorStatusCard(APPROVED)
res.data.status === 'REJECTED':
  - 7일 미경과 → MentorStatusCard(REJECTED)
  - 7일 경과 → 반려 사유 표시 + MentorApplyForm
```

MentorApplyForm의 onSuccess 콜백에서 상태를 PENDING으로 전환 (리로드 없이).

레이아웃: 기존 `Layout.module.css`의 `.pageRoot` + `.pageHeader` 패턴 사용 (질문 작성 페이지와 동일).

---

### Task 5: 설정 페이지 멘토 카드

**Files:**
- Modify: `frontend/app/settings/profile/page.tsx`

- [ ] **Step 1: 멘토 섹션 추가**

기존 프로필 편집 폼 아래에 멘토 상태 카드 추가.

`getMyApplication()` 호출하여 상태 판단:
- null → "인증 멘토가 되어보세요" + "신청하기" Button → router.push('/mentor/apply')
- PENDING → "심사 진행 중" + "상태 확인" 링크
- APPROVED → "🎓 인증 멘토" 뱃지 표시
- REJECTED → "반려됨" + "재신청" 버튼/링크

antd Card 또는 div.feed-sidebar-card 스타일 사용 (기존 패턴).

---

### Task 6: 빌드 검증 + Obsidian

- [ ] **Step 1: 프론트엔드 빌드**

Run: `cd frontend && npm run build`

- [ ] **Step 2: Obsidian 갱신**

`develop/logos/frontend/멘토 신청 프론트엔드 설계.md` → "구현 완료"
