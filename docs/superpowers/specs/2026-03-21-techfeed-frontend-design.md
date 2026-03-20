# 테크피드 프론트엔드 설계

## 1. 개요

홈 탭 통합 (Q&A | 테크피드) + 피드 상세/등록/북마크 페이지. 컴팩트 카드 디자인, 추천/북마크/댓글 인터랙션.

## 2. 페이지 구조

- `/` — 홈 (상단 탭: Q&A | 테크피드)
- `/feeds/{id}` — 피드 상세 + 댓글
- `/feeds/new` — 피드 등록
- `/feeds/bookmarks` — 내 북마크 목록

## 3. 홈 탭 통합

`app/page.tsx`에 상단 탭(antd Segmented 또는 커스텀 Pill) 추가. Q&A 탭은 기존 QuestionFeed, 테크피드 탭은 새 FeedList 컴포넌트. 탭 전환은 클라이언트 상태.

FAB 버튼: Q&A 탭 → "질문하기", 테크피드 탭 → "피드 등록" 로 텍스트/경로 전환.

## 4. 피드 목록 (FeedList)

- 카테고리 Pill 필터 (전체 | FRONTEND | BACKEND | ...)
- 정렬 토글: 최신순 / 추천순
- FeedCard 컴팩트: 좌측 OG 썸네일(120x80) + 우측 텍스트
- OG 이미지 없으면: 카테고리 색상 + 도메인 첫 글자 fallback
- 메타: 작성자 · 상대시간 · 👍 추천수 · 💬 댓글수
- antd Pagination

## 5. 피드 카드 (FeedCard)

```
┌──────────────────────────────────────────┐
│ [OG 120x80]  카테고리태그  domain.com    │
│              제목 (2줄 truncate)          │
│              "추천 이유" (1줄 truncate)   │
│              작성자 · 3시간 전 · 👍24 💬5 │
└──────────────────────────────────────────┘
```

카드 클릭 → `/feeds/{id}` 이동.

## 6. 피드 상세 (/feeds/{id})

- OG 카드: 이미지(전체너비) + 제목 + 설명 + 도메인 + "원문 보기" 외부 링크 버튼
- 추천 이유 섹션 (작성자 comment)
- 액션 바: 👍 추천(토글) / 🔖 북마크(토글) / 카운트 표시
- 댓글 섹션: antd Input.TextArea(텍스트 전용) + 등록 버튼
- 댓글 목록: 오래된순, 작성자 닉네임 + 상대시간 + 삭제(본인만)

싱글 컬럼, max-width 720px.

## 7. 피드 등록 (/feeds/new)

- URL 입력 (antd Input)
- 카테고리 선택 (antd Select — FeedCategory 11종)
- 추천 이유 (antd Input.TextArea, max 500자, showCount)
- 제출 버튼
- MVP: OG 미리보기 없이 등록 후 결과 확인. 추후 preview API 추가.

싱글 컬럼, max-width 640px. 기존 질문 작성 페이지 패턴.

## 8. 컴포넌트

```
components/feed/
├── FeedList.tsx              — 피드 목록 (필터 + 정렬 + 카드 리스트 + 페이지네이션)
├── FeedCard.tsx              — 개별 카드 (컴팩트)
├── FeedDetail.tsx            — 상세 (OG 카드 + 액션)
├── FeedCommentSection.tsx    — 댓글 입력 + 목록
├── FeedCreateForm.tsx        — 등록 폼
└── Feed.module.css           — 스타일
```

## 9. API 유틸

`lib/feeds.ts`:
- getFeeds, getFeed, createFeed, deleteFeed
- likeFeed, unlikeFeed
- bookmarkFeed, removeBookmark, getBookmarks
- createComment, getComments, deleteComment

## 10. 타입

`types/feed.ts`:
- FeedCategory (11종 union)
- Feed, FeedComment
- FeedCreateRequest, FeedCommentCreateRequest

## 11. 알림 메타

notification.ts에 FEED_LIKED, FEED_COMMENTED 추가.
notificationMeta.ts에 메타 추가.

## 12. 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `app/page.tsx` | Q&A / 테크피드 탭 추가 |
| `app/feeds/[id]/page.tsx` | 신규 |
| `app/feeds/new/page.tsx` | 신규 |
| `app/feeds/bookmarks/page.tsx` | 신규 |
| `components/feed/*` | 신규 (6개) |
| `lib/feeds.ts` | 신규 |
| `types/feed.ts` | 신규 |
| `types/notification.ts` | 수정 |
| `lib/notificationMeta.ts` | 수정 |
