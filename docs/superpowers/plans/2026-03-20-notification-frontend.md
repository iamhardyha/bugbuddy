# 알림 프론트엔드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드 알림 API 연동 — 벨 드롭다운 미리보기 + 싱글 컬럼 알림 목록 페이지 구현

**Architecture:** 백엔드 linkUrl 추가(선행) → 프론트 타입/API 유틸 생성 → NotificationBell Popover 드롭다운 → 알림 목록 페이지 싱글 컬럼 재작성. antd 컴포넌트 우선, CSS Modules로 레이아웃.

**Tech Stack:** Next.js App Router, TypeScript, antd v6, Tailwind CSS (보조), CSS Modules

**Spec:** `docs/superpowers/specs/2026-03-20-notification-frontend-design.md`

---

## 파일 구조

```
백엔드 수정:
  notification/dto/NotificationResponse.java    — linkUrl 필드 + @JsonProperty("read")
  notification/NotificationService.java         — linkUrl 조합 로직

프론트엔드 신규:
  frontend/types/notification.ts                — 타입 정의
  frontend/lib/notifications.ts                 — API 유틸리티
  frontend/lib/notificationMeta.ts              — NOTIFICATION_META 공유 상수 (아이콘, 텍스트, 색상)

프론트엔드 수정:
  frontend/components/common/NotificationBell.tsx           — Popover 드롭다운
  frontend/app/notifications/page.tsx                       — 싱글 컬럼 재작성
  frontend/components/notification/NotificationLayout.module.css — 레이아웃 재작성
```

## 태스크 실행 순서

```
Task 1 (백엔드 linkUrl) → Task 2 (타입 정의) → Task 3 (API 유틸 + NOTIFICATION_META)
  → Task 4 (CSS 레이아웃) → Task 5 (알림 목록 페이지) → Task 6 (NotificationBell 드롭다운)
  → Task 7 (빌드 검증)
```

---

### Task 1: 백엔드 — NotificationResponse linkUrl 추가

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/dto/NotificationResponse.java`
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationService.java`

- [ ] **Step 1: NotificationResponse에 linkUrl 필드 + @JsonProperty 추가**

```java
// NotificationResponse.java
import com.fasterxml.jackson.annotation.JsonProperty;

public record NotificationResponse(
        Long id,
        NotificationType type,
        ReferenceType refType,
        Long refId,
        String triggerUserNickname,
        String targetTitle,
        String linkUrl,
        @JsonProperty("read") boolean isRead,
        Instant createdAt
) {
    public static NotificationResponse of(
            Notification n, String triggerUserNickname, String targetTitle, String linkUrl) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getRefType(), n.getRefId(),
                triggerUserNickname, targetTitle, linkUrl,
                n.isRead(), n.getCreatedAt()
        );
    }
}
```

- [ ] **Step 2: NotificationService.getNotifications()에서 linkUrl 조합**

배치 조회 시 이미 가져온 데이터로 linkUrl을 조합. 추가 쿼리 없음.

**2-a. answerQuestionIdMap 구성** — 기존 ANSWER 배치 조회 블록에서 함께 구성:

```java
// 기존 answerTitleMap 구성 부분을 아래로 교체:
Map<Long, Long> answerQuestionIdMap = new HashMap<>();
if (!answerIds.isEmpty()) {
    answerRepository.findAllActiveByIds(answerIds).forEach(a -> {
        answerTitleMap.put(a.getId(), a.getQuestion().getTitle());
        answerQuestionIdMap.put(a.getId(), a.getQuestion().getId());
    });
}
```

**2-b. linkUrl 조합 인라인** — notifications.map() 람다 내에서 직접 조합 (별도 메서드 불필요):

```java
return notifications.map(n -> {
    String nickname = nicknameMap.get(n.getTriggerUserId());
    String title = switch (n.getRefType()) {
        case QUESTION -> questionTitleMap.get(n.getRefId());
        case ANSWER -> answerTitleMap.get(n.getRefId());
        case CHAT_ROOM -> chatRoomTitleMap.get(n.getRefId());
        default -> null;
    };
    String linkUrl = switch (n.getRefType()) {
        case QUESTION -> "/questions/" + n.getRefId();
        case ANSWER -> "/questions/" + answerQuestionIdMap.getOrDefault(n.getRefId(), n.getRefId());
        case CHAT_ROOM -> "/chat";
        default -> "/notifications";
    };
    return NotificationResponse.of(n, nickname, title, linkUrl);
});
```

**2-c. 빈 페이지 매핑도 수정** — 기존 `NotificationResponse.of(n, null, null)` → 4파라미터로:

```java
if (notifications.isEmpty()) {
    return notifications.map(n -> NotificationResponse.of(n, null, null, null));
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd backend && ./gradlew compileJava`

---

### Task 2: 프론트엔드 — 타입 정의

**Files:**
- Create: `frontend/types/notification.ts`

- [ ] **Step 1: 타입 파일 생성**

```typescript
export type NotificationType =
  | 'ANSWER_CREATED'
  | 'HELPFUL_RECEIVED'
  | 'ANSWER_ACCEPTED'
  | 'CHAT_REQUESTED'
  | 'CHAT_ACCEPTED'
  | 'CHAT_REJECTED';

export type ReferenceType = 'QUESTION' | 'ANSWER' | 'CHAT_MESSAGE' | 'CHAT_ROOM' | 'USER';

export interface Notification {
  id: number;
  type: NotificationType;
  refType: ReferenceType;
  refId: number;
  triggerUserNickname: string | null;
  targetTitle: string | null;
  linkUrl: string;
  read: boolean;
  createdAt: string;
}
```

`Page<T>`는 `@/types/question`에서 import하여 재사용 (재정의하지 않음).

---

### Task 3: 프론트엔드 — API 유틸리티 + 공유 상수

**Files:**
- Create: `frontend/lib/notifications.ts`
- Create: `frontend/lib/notificationMeta.ts`

- [ ] **Step 1: API 함수 생성**

```typescript
import { apiFetch } from './api';
import type { Notification } from '@/types/notification';
import type { Page } from '@/types/question';

export function getNotifications(page = 0, size = 20) {
  return apiFetch<Page<Notification>>(`/api/notifications?page=${page}&size=${size}`);
}

export function getUnreadCount() {
  return apiFetch<number>('/api/notifications/unread-count');
}

export function markAsRead(id: number) {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllAsRead() {
  return apiFetch<void>('/api/notifications/read-all', { method: 'PATCH' });
}
```

**기존 버그 수정 포인트:**
- `unread-count`: `apiFetch<number>` → `res.data` 직접 사용 (기존 `res.data.unreadCount` 버그)
- `read`, `read-all`: `PATCH` 메서드 사용 (기존 `POST` 버그)

- [ ] **Step 2: NOTIFICATION_META 공유 상수 생성**

`lib/notificationMeta.ts`:

```typescript
import {
  MessageOutlined, LikeOutlined, CheckCircleOutlined,
  TeamOutlined, CheckOutlined, BellOutlined,
} from '@ant-design/icons';
import type { NotificationType } from '@/types/notification';

interface NotificationMeta {
  text: (nickname: string) => string;
  icon: React.ComponentType;
  color: string;
  bg: string;
  filterGroup: 'ANSWER' | 'CHAT' | null;
}

export const NOTIFICATION_META: Record<string, NotificationMeta> = {
  ANSWER_CREATED:   { text: (n) => `${n}님이 답변을 등록했습니다`,       icon: MessageOutlined,       color: '#5548e0', bg: 'rgba(85,72,224,0.1)',  filterGroup: 'ANSWER' },
  HELPFUL_RECEIVED: { text: (n) => `${n}님이 도움됐어요를 눌렀습니다`,   icon: LikeOutlined,          color: '#2563eb', bg: 'rgba(37,99,235,0.1)',  filterGroup: 'ANSWER' },
  ANSWER_ACCEPTED:  { text: (n) => `${n}님이 답변을 채택했습니다`,       icon: CheckCircleOutlined,   color: '#d97706', bg: 'rgba(217,119,6,0.1)',  filterGroup: 'ANSWER' },
  CHAT_REQUESTED:   { text: (n) => `${n}님이 채팅을 신청했습니다`,       icon: TeamOutlined,          color: '#5548e0', bg: 'rgba(85,72,224,0.1)',  filterGroup: 'CHAT' },
  CHAT_ACCEPTED:    { text: (n) => `${n}님이 채팅을 수락했습니다`,       icon: CheckOutlined,         color: '#16a34a', bg: 'rgba(22,163,74,0.1)',  filterGroup: 'CHAT' },
};

export const FALLBACK_META: NotificationMeta = {
  text: () => '알림이 있습니다',
  icon: BellOutlined,
  color: '#6b7280',
  bg: 'rgba(107,114,128,0.1)',
  filterGroup: null,
};

export function getMeta(type: string): NotificationMeta {
  return NOTIFICATION_META[type] ?? FALLBACK_META;
}
```

`CHAT_REJECTED` 등 매핑되지 않은 타입은 `FALLBACK_META` 사용. 필터 그룹이 null이면 "전체" 탭에서만 노출.

---

### Task 4: 프론트엔드 — CSS 레이아웃 재작성

**Files:**
- Modify: `frontend/components/notification/NotificationLayout.module.css`

- [ ] **Step 1: 싱글 컬럼 레이아웃으로 전면 재작성**

기존 3컬럼(.sidebar, .main, .right) 제거 → 싱글 컬럼:

```css
/* ─── Notification Layout (싱글 컬럼) ─── */
.layout {
  min-height: calc(100vh - var(--global-header-height));
  background: var(--bg-base);
  padding: 24px 16px;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.headerBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 탭 필터 (Pill 스타일) */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-faint);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tab:hover {
  border-color: var(--border);
  color: var(--text-primary);
}
.tab.active {
  background: var(--accent-subtle);
  color: var(--accent);
  border-color: transparent;
  font-weight: 600;
}

/* 알림 카드 */
.card {
  border-radius: 12px;
  border: 1px solid var(--border-faint);
  background: var(--bg-surface);
  padding: 16px 18px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.card:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}
.card.unread {
  border-left: 3px solid var(--accent);
}
.card.readCard {
  opacity: 0.7;
}

/* ─── Responsive ─── */
@media (max-width: 639px) {
  .layout {
    padding: 16px 12px;
  }
}
```

---

### Task 5: 프론트엔드 — 알림 목록 페이지 재작성

**Files:**
- Modify: `frontend/app/notifications/page.tsx`

- [ ] **Step 1: 페이지 전면 재작성**

싱글 컬럼 + 탭 필터 + type 기반 텍스트 렌더링:

핵심 구현 요소:
- `NOTIFICATION_META` 상수: type별 텍스트 템플릿, 아이콘, 색상, 필터 그룹
- `activeTab` 상태: 'ALL' | 'ANSWER' | 'CHAT'
- `getNotifications()` 호출 → 클라이언트 필터링
- `markAsRead(id)` 낙관적 업데이트 + 실패 시 롤백
- `markAllAsRead()` 전체 읽음
- 카드 클릭 시 `router.push(notification.linkUrl)`
- 상대시간: `relativeTime` from `@/lib/questionMeta` 재사용
- fallback: nickname null → "알 수 없는 사용자", title null → "삭제된 게시글"
- 알 수 없는 type → `FALLBACK_META` 사용 (BellOutlined + "알림이 있습니다")
- 탭별 빈 상태 메시지 (예: "채팅 알림이 없습니다")
- 기존 `relativeTime` 로컬 함수 삭제, `@/lib/questionMeta`에서 import
- **페이지네이션:** antd `Pagination` 컴포넌트 사용. `Page<T>`의 `totalElements`, `number`, `size`로 제어. 탭 변경 시 page 0으로 리셋.

**참조 패턴:**
- `app/questions/page.tsx` — 리스트 페이지 패턴
- `lib/questionMeta.ts` — relativeTime 함수

---

### Task 6: 프론트엔드 — NotificationBell Popover 드롭다운

**Files:**
- Modify: `frontend/components/common/NotificationBell.tsx`

- [ ] **Step 1: Popover 드롭다운으로 전면 재작성**

핵심 구현 요소:
- antd `Popover` (trigger="click") + `Badge`
- Popover 열릴 때마다 `getNotifications(0, 5)` + `getUnreadCount()` 재조회
- 드롭다운 내부:
  - 헤더: "알림" + "모두 읽음" 버튼
  - 알림 카드 5건 (Task 5와 동일한 NOTIFICATION_META 사용)
  - 하단: "전체 보기" → `/notifications` 링크
- 알림 클릭 시: Popover 닫기 + markAsRead + router.push(linkUrl)
- unread 0이면 뱃지 숨김
- 미로그인 시 null 반환 (기존 로직 유지)

**공유 상수:** `NOTIFICATION_META`는 `lib/notificationMeta.ts`에 정의하여 Bell과 Page에서 import. type별 텍스트 템플릿, antd 아이콘, 색상, 필터 그룹을 포함. 알 수 없는 타입 fallback도 여기서 정의.

**Popover 스타일:** width 360px, maxHeight 400px, overflow-y auto.

---

### Task 7: 빌드 검증 & Obsidian 갱신

- [ ] **Step 1: 백엔드 빌드**

Run: `cd backend && ./gradlew clean build -x test`

- [ ] **Step 2: 프론트엔드 빌드**

Run: `cd frontend && npm run build`

- [ ] **Step 3: Obsidian 문서 갱신**

`Obsidian Vault/develop/logos/frontend/알림 프론트엔드 설계.md` 상태를 "구현 완료"로 갱신
