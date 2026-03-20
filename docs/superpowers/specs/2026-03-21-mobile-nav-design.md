# 모바일 하단 네비게이션 + 알림 모바일 대응

## 1. 개요

모바일(639px 이하)에서 하단 네비게이션 바를 추가하여 앱 느낌의 네비게이션 제공. 알림 Popover는 데스크탑 전용으로 유지, 모바일에서는 하단 네비 알림 탭이 `/notifications` 직행.

## 2. 하단 네비게이션 바 (BottomNav)

### 표시 조건
- `@media (max-width: 639px)` 에서만 표시
- 데스크탑에서는 완전히 숨김 (`display: none`)
- 로그인하지 않은 경우에도 표시 (홈 탭만 활성, 나머지 탭은 로그인 페이지로 유도)

### 탭 구성

| 탭 | 아이콘 (antd) | 라벨 | 경로 | 뱃지 |
|----|-------------|------|------|------|
| 홈 | HomeOutlined / HomeFilled | 홈 | `/` | 없음 |
| 채팅 | MessageOutlined / MessageFilled | 채팅 | `/chat` | 없음 (추후 unread count) |
| 알림 | BellOutlined / BellFilled | 알림 | `/notifications` | unread count |
| MY | UserOutlined / UserFilled | MY | `/users/{myId}` 또는 `/settings/profile` | 없음 |

활성 탭: 현재 pathname과 매칭. accent 색상 + Filled 아이콘으로 전환.

### 스타일
- antd 아이콘 사용 (이모지 아님)
- 높이: 56px + safe-area-inset-bottom (노치 대응)
- 배경: `var(--bg-surface)` + 상단 border `var(--border-faint)`
- 다크/라이트 자동 전환 (CSS 변수)
- 고정 위치: `position: fixed; bottom: 0;`

### 페이지 콘텐츠 패딩
하단 네비 높이만큼 모바일에서 body/main에 `padding-bottom` 추가 필요. `var(--bottom-nav-height, 56px)` CSS 변수 사용.

## 3. NotificationBell 모바일 대응

- 모바일(`max-width: 639px`)에서 NotificationBell 숨김 → 하단 네비 알림 탭이 대체
- 데스크탑에서는 기존 Popover 드롭다운 유지
- CSS `display: none`으로 처리 (컴포넌트 렌더링 자체를 막지 않음 — Popover API 호출 방지를 위해 미디어 쿼리로 숨김)

## 4. 기존 FAB 처리

현재 모바일에서 질문 작성 FAB(floating action button)가 `bottom: 28px`에 위치. 하단 네비 추가 시:
- FAB `bottom` 값을 `calc(var(--bottom-nav-height) + 16px)`로 조정
- 또는 모바일에서 FAB 숨기고 하단 네비 홈 화면에서 "질문 작성" 진입점 제공

**결정:** FAB 위치만 조정 (기존 동작 유지).

## 5. 컴포넌트 구조

```
components/common/BottomNav.tsx          — 하단 네비게이션 바
components/common/BottomNav.module.css   — 스타일
```

## 6. 파일 수정 목록

| 파일 | 변경 |
|------|------|
| `components/common/BottomNav.tsx` | 신규 — 하단 네비 컴포넌트 |
| `components/common/BottomNav.module.css` | 신규 — 스타일 |
| `app/layout.tsx` | BottomNav 추가 (providers 내부) |
| `app/globals.css` | `--bottom-nav-height` 변수 + 모바일 body padding |
| `components/common/GlobalHeader.module.css` | NotificationBell 모바일 숨김 |
| `components/question/QuestionFeed.module.css` | FAB bottom 조정 |
