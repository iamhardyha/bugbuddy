# 알림 프론트엔드 설계

## 1. 개요

백엔드 알림 API와 연동하여 알림 벨 드롭다운 + 알림 목록 페이지를 구현한다. 기존 프론트엔드 코드(NotificationBell, NotificationsPage)를 백엔드 API에 맞춰 전면 수정한다.

**구현 순서:** 백엔드 수정 (linkUrl 추가) → 프론트엔드 구현

## 2. 컴포넌트 구조

```
NotificationBell (GlobalHeader 내)
├── Badge (unread count)
└── Popover 드롭다운
    ├── 최근 알림 5건 미리보기 카드
    ├── "모두 읽음" 버튼
    └── "전체 보기" → /notifications 링크

NotificationsPage (/notifications)
├── 상단 바: 제목 + unread 뱃지 + "모두 읽음" 버튼
├── 탭 필터 (Pill 스타일): 전체 | 답변 | 채팅
└── 알림 카드 리스트 (싱글 컬럼, 최대 600px, 페이징)
```

## 3. 레이아웃

**싱글 컬럼 + 탭 필터** 방식. 기존 3컬럼 제거.
- 최대 너비 600px, 가운데 정렬
- 필터는 상단 Pill 탭으로 처리
- 모바일 호환 최적

## 4. 필터 탭 그룹핑

| 탭 | 포함하는 NotificationType |
|----|--------------------------|
| 전체 | ALL |
| 답변 | ANSWER_CREATED, HELPFUL_RECEIVED, ANSWER_ACCEPTED |
| 채팅 | CHAT_REQUESTED, CHAT_ACCEPTED |

**필터 방식:** 전체 조회 후 프론트 클라이언트 필터링 (MVP).

**페이지네이션 한계:** 페이지당 20건 조회이므로, 특정 탭에서 해당 타입 알림이 현재 페이지에 적을 수 있음. MVP에서는 이 한계를 수용하며, 추후 백엔드에 `type` 쿼리 파라미터 추가로 해결 가능.

**탭별 빈 상태:** 특정 탭에 결과가 없으면 탭 맞춤 메시지 표시 (예: "채팅 알림이 없습니다").

## 5. 알림 타입별 텍스트 렌더링

프론트에서 `type` 기반으로 한국어 텍스트를 조합한다:

| NotificationType | 텍스트 | 아이콘 (antd) | 아이콘 색상 |
|------------------|--------|--------------|-----------|
| ANSWER_CREATED | `{nickname}님이 답변을 등록했습니다` | MessageOutlined | #5548e0 |
| HELPFUL_RECEIVED | `{nickname}님이 도움됐어요를 눌렀습니다` | LikeOutlined | #2563eb |
| ANSWER_ACCEPTED | `{nickname}님이 답변을 채택했습니다` | CheckCircleOutlined | #d97706 |
| CHAT_REQUESTED | `{nickname}님이 채팅을 신청했습니다` | TeamOutlined | #5548e0 |
| CHAT_ACCEPTED | `{nickname}님이 채팅을 수락했습니다` | CheckOutlined | #16a34a |

**알 수 없는 타입 fallback:** `CHAT_REJECTED` 등 매핑되지 않은 타입은 `BellOutlined` 아이콘 + `"알림이 있습니다"` 텍스트로 렌더링.

부제: `{targetTitle} · {상대시간}`

- `nickname`: `triggerUserNickname`. null이면 "알 수 없는 사용자"
- `targetTitle`: 관련 질문 제목. null이면 "삭제된 게시글"
- `상대시간`: 기존 `lib/questionMeta.ts`의 `relativeTime` 함수 재사용 (중복 정의 금지)

## 6. 클릭 동작

알림 클릭 시:
1. UI에서 즉시 읽음 표시 (낙관적 업데이트)
2. `PATCH /api/notifications/{id}/read` 호출
3. API 실패 시 읽음 상태 롤백 + 에러 무시 (사용자에게 별도 알림 불필요)
4. `router.push(notification.linkUrl)` 이동

## 7. 벨 드롭다운 (NotificationBell)

- antd `Popover` 사용 (trigger="click")
- 내부: 최근 5건 알림 카드 + "모두 읽음" + "전체 보기" 링크
- 알림 클릭 시 드롭다운 닫히고 해당 페이지로 이동
- 읽지 않은 알림이 0이면 뱃지 숨김
- 로그인하지 않은 경우 벨 자체 비노출 (기존 로직 유지)
- **데이터 갱신:** Popover가 열릴 때마다 최근 5건 + unread count 재조회 (stale data 방지)

## 8. 백엔드 수정 (프론트 작업 전 선행)

### 8-1. NotificationResponse에 linkUrl 추가

```java
String linkUrl
```

### 8-2. NotificationService.getNotifications()에서 linkUrl 조합

배치 조회 시 이미 가져온 데이터로 조합 (추가 쿼리 없음):

| refType | linkUrl 규칙 |
|---------|-------------|
| QUESTION | `/questions/{refId}` |
| ANSWER | `/questions/{questionId}` (answer.getQuestion().getId()) |
| CHAT_ROOM | `/chat` |

### 8-3. isRead 직렬화 확인

Java record의 `boolean isRead` 파라미터는 Jackson이 `isRead`로 직렬화할 수 있음. 프론트와 일치시키기 위해 `@JsonProperty("read")`를 추가하거나, 실제 직렬화 결과를 확인 후 프론트 타입을 맞춤.

## 9. API 유틸리티

`lib/notifications.ts` 신규 생성:

```typescript
export function getNotifications(page = 0, size = 20): Promise<ApiResponse<Page<Notification>>>
export function getUnreadCount(): Promise<ApiResponse<number>>  // data는 bare number
export function markAsRead(id: number): Promise<ApiResponse<void>>   // PATCH
export function markAllAsRead(): Promise<ApiResponse<void>>          // PATCH
```

**기존 버그 수정:**
- `unread-count` 응답: 기존 코드는 `res.data.unreadCount`로 접근하지만, 백엔드는 bare `Long`을 반환. → `res.data` 직접 사용
- `read-all`, `{id}/read`: 기존 코드는 `POST` 사용하지만 백엔드는 `PATCH`. → `PATCH`로 수정

## 10. 타입 정의

`types/notification.ts` 신규 생성:

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
  read: boolean;      // 백엔드 isRead → JSON "read" (@JsonProperty 적용 후)
  createdAt: string;   // ISO-8601 문자열
}
```

`Page<T>`는 기존 `@/types/question`에서 import하여 재사용.

## 11. 수정 대상 파일

### 백엔드 (선행)
| 파일 | 변경 |
|------|------|
| `notification/dto/NotificationResponse.java` | linkUrl 필드 + @JsonProperty("read") |
| `notification/NotificationService.java` | linkUrl 조합 로직 |

### 프론트엔드
| 파일 | 변경 |
|------|------|
| `types/notification.ts` | 신규 — 타입 정의 |
| `lib/notifications.ts` | 신규 — API 유틸리티 (PATCH, bare number 수정) |
| `components/common/NotificationBell.tsx` | Popover 드롭다운, API 수정 |
| `app/notifications/page.tsx` | 전면 재작성 (싱글 컬럼 + 탭) |
| `components/notification/NotificationLayout.module.css` | 싱글 컬럼 레이아웃으로 재작성 |

## 12. 미구현 (추후 확장)

- 실시간 알림 (WebSocket)
- 무한 스크롤
- 알림 설정 (타입별 on/off)
- 백엔드 `type` 쿼리 파라미터 (서버 사이드 필터링)
- 접근성 개선 (aria-label, 키보드 내비게이션)
