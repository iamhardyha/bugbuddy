# 멘토 신청 프론트엔드 설계

## 1. 개요

멘토 신청 페이지(`/mentor/apply`) + 설정 페이지 멘토 카드. 상태별 화면 분기(NONE/PENDING/APPROVED/REJECTED). 관리자 페이지는 별도 작업으로 분리.

## 2. 상태별 화면 분기

| mentorStatus | API 응답 | 화면 |
|-------------|---------|------|
| NONE (신청 이력 없음) | `res.data` = null | 신청 폼 |
| PENDING | `res.data.status` = PENDING | 심사 중 안내 카드 |
| APPROVED | `res.data.status` = APPROVED | "이미 인증 멘토" + 프로필 이동 |
| REJECTED (7일 이내) | `res.data.status` = REJECTED, reviewedAt+7일 미경과 | 반려 사유 + 재신청 가능일 + 비활성 버튼 |
| REJECTED (7일 경과) | `res.data.status` = REJECTED, reviewedAt+7일 경과 | 반려 사유 표시 + 신청 폼 |

**판단 로직:** 페이지 마운트 시 `GET /api/mentor/apply/me` 호출. API는 `ApiResponse<MentorApplication | null>` 래퍼로 응답.
- `res.data === null` → 신청 이력 없음, 신청 폼 표시
- `res.data.status === 'PENDING'` → 심사 중
- `res.data.status === 'APPROVED'` → 인증 멘토
- `res.data.status === 'REJECTED'` → reviewedAt + 7일 vs 현재 시간 비교
  - 7일 미경과: 반려 사유 + 비활성 재신청 버튼
  - 7일 경과: 반려 사유 + 신청 폼 (제출 시 백엔드가 기존 신청 soft-delete 후 새로 생성)

**주의:** REJECTED 상태에서도 `getMyApplication()`은 null이 아닌 REJECTED 신청을 반환함. soft-delete는 재신청 시점에만 발생.

## 3. 신청 폼 (MentorApplyForm)

- 싱글 컬럼, 최대 640px, 가운데 정렬
- **증빙 링크 섹션:** linkType 드롭다운(antd Select) + URL 입력 + 동적 추가/삭제. 최소 1개 필수.
- **주관식 Q1:** "최근 해결한 기술적 문제" — antd TextArea, maxLength 5000
- **주관식 Q2:** "잘 도와줄 수 있는 질문 유형" — antd TextArea, maxLength 5000
- **제출 버튼:** antd Button type="primary", loading 상태
- 제출 성공 시 PENDING 화면으로 전환 (페이지 리로드 없이 상태 변경)

## 4. 상태 카드 (MentorStatusCard)

재사용 가능한 카드 컴포넌트. Props로 상태 정보를 받음.
- PENDING: 아이콘(⏳) + "심사 진행 중" + 신청일
- APPROVED: 아이콘(🎓) + "인증 멘토입니다" + 프로필 보기 버튼
- REJECTED: 아이콘(❌) + 반려 사유 박스 + 재신청 가능일/버튼

설정 페이지에서도 동일 컴포넌트를 사용하되 compact 버전으로 렌더링.

## 5. 설정 페이지 멘토 카드

`/settings/profile` 하단에 추가:
- NONE: "인증 멘토가 되어보세요" + "신청하기" 버튼 → `/mentor/apply`
- PENDING: "심사 진행 중" + "상태 확인" 링크
- APPROVED: "🎓 인증 멘토" 뱃지
- REJECTED: "반려됨" + "재신청" 버튼/링크

`getMyApplication()` API를 호출하여 상태 판단.

## 6. API 유틸리티

`lib/mentor.ts` 신규:

```typescript
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

## 7. 타입 정의

`types/mentor.ts` 신규:

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

## 8. 알림 메타 추가

`types/notification.ts`에 `MENTOR_APPROVED`, `MENTOR_REJECTED` 추가.

`lib/notificationMeta.ts`에 멘토 알림 메타 추가:
- MENTOR_APPROVED: "멘토 인증이 승인되었습니다" / TrophyOutlined / #16a34a
- MENTOR_REJECTED: "멘토 신청이 반려되었습니다" / CloseCircleOutlined / #dc2626
- filterGroup: null (전체 탭에서만 노출)

## 9. 파일 구조

```
신규:
  app/mentor/apply/page.tsx
  components/mentor/MentorApplyForm.tsx
  components/mentor/MentorStatusCard.tsx
  components/mentor/MentorApply.module.css
  lib/mentor.ts
  types/mentor.ts

수정:
  types/notification.ts              — MENTOR_APPROVED, MENTOR_REJECTED
  lib/notificationMeta.ts            — 멘토 알림 메타 추가
  app/settings/profile/page.tsx      — 멘토 카드 섹션 추가
```
