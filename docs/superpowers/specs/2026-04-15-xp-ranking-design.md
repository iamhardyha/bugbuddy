# XP 랭킹 페이지 설계

- **작성일:** 2026-04-15
- **대상:** 버그버디 XP 랭킹 페이지 신규 구현
- **관련 기존 시스템:** XP/레벨 시스템 (Phase 7 완료), `XpEvent`, `UserEntity.xp/level`

---

## 1. 목적과 범위

BugBuddy 유저의 XP 누적/기간별 순위를 볼 수 있는 랭킹 페이지를 신규 추가한다. 사용자에게 목표와 동기부여를 제공하고, 상위 기여자를 커뮤니티에 노출한다.

**포함 범위**
- 전체 누적 랭킹 + 주간/월간 기간 랭킹
- 주간/월간은 현재 기간 + 직전 기간 조회
- 상위 100명 리스트 + "내 순위" 배너
- 각 행에 활동 지표(답변 채택 수, 답변 작성 수, 질문 작성 수) 표시
- 유저 한줄 소개(`bio`) 인라인 표시 + 프로필 이동

**제외 범위**
- 연간 랭킹, 월별 아카이브(지난달 이전)
- 카테고리/태그별 랭킹
- 랭킹 진입/변동 알림 푸시
- 친구·팔로잉 기반 랭킹

---

## 2. 사용자 시나리오

1. 로그인 유저가 `/rankings` 진입 → 전체 누적 랭킹 Top 100과 자기 순위를 확인한다.
2. 주간 탭을 눌러 "이번 주 가장 활발한 유저"를 확인한다. 이번 주에 XP를 얻지 못했다면 "아직 순위 없음" 상태로 보인다.
3. "지난 주 보기"를 눌러 직전 주 우승자를 확인한다.
4. 상위 유저의 닉네임 아래 인라인으로 한줄 소개(`bio`)를 읽고, 행을 클릭해 프로필로 이동한다.
5. 비로그인 유저는 랭킹 리스트만 볼 수 있고, "내 순위" 배너는 보이지 않는다.

---

## 3. API 설계

### 3.1 엔드포인트

```
GET /api/rankings
```

**쿼리 파라미터**

| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `period` | `all` \| `weekly` \| `monthly` | ✅ | — | 랭킹 기간 종류 |
| `offset` | `current` \| `previous` | ❌ | `current` | `all`일 때는 무시 |

**인증:** 선택 — 로그인 시 `myRank` 필드가 채워지고, 비로그인 시 `null`.

### 3.2 응답 구조

```json
{
  "success": true,
  "data": {
    "period": "weekly",
    "offset": "current",
    "rangeStart": "2026-04-13T00:00:00+09:00",
    "rangeEnd": "2026-04-19T23:59:59+09:00",
    "topRankings": [
      {
        "rank": 1,
        "userId": 42,
        "nickname": "hardy",
        "level": 7,
        "xp": 2340,
        "periodXp": 480,
        "bio": "한줄 소개",
        "mentorStatus": "APPROVED",
        "acceptedAnswerCount": 12,
        "answerCount": 34,
        "questionCount": 8,
        "isCurrentUser": false
      }
    ],
    "myRank": {
      "rank": 253,
      "xp": 450,
      "periodXp": 30,
      "xpToTop100": 180,
      "inTop100": false,
      "acceptedAnswerCount": 3,
      "answerCount": 7,
      "questionCount": 2
    }
  },
  "error": null
}
```

**필드 의미**
- `nickname`: `UserEntity.nickname`. 아바타 이미지 필드가 없으므로 UI는 닉네임 이니셜 기반 antd `Avatar` 대체 렌더.
- `bio`: 닉네임 아래 인라인으로 노출. `null`이면 해당 라인 미렌더.
- `mentorStatus`: `APPROVED`일 때 닉네임 옆 멘토 배지 노출(기존 프론트 컨벤션 재사용).
- `period=all`일 때 `periodXp`는 `null`로 리턴하고 프론트는 `xp`만 표시한다.
- `period=all`일 때 `rangeStart/rangeEnd`는 `null`이다.
- 기간 경계(`rangeStart`, `rangeEnd`)는 `Asia/Seoul` 타임존 기준 ISO-8601 문자열.
- `myRank`는 로그인했고 해당 기간에 XP를 1 이상 획득한 경우에만 값을 가진다. 그 외에는 `null`.
- Top 100 안에 본인이 있으면 해당 행의 `isCurrentUser: true` + `myRank` 동시 채움.

### 3.3 에러 응답

| 상황 | HTTP | 메시지 |
|------|------|--------|
| `period` 누락/오타 | 400 | `"period는 all, weekly, monthly 중 하나여야 합니다"` |
| `offset` 오타 | 400 | `"offset은 current 또는 previous여야 합니다"` |
| 내부 오류 | 500 | 기존 `ApiResponse` 규약 |

---

## 4. 백엔드 설계

### 4.1 패키지 구조

```
me.iamhardyha.bugbuddy.ranking
├── RankingController.java
├── RankingService.java
├── RankingQueryRepository.java      // 네이티브 SQL 전용
└── dto
    ├── RankingResponse.java          // 최상위 응답
    ├── RankingRowResponse.java       // Top100 행
    └── MyRankResponse.java           // 로그인 유저 개인 순위
```

### 4.2 기간 경계 계산

- 타임존: `Asia/Seoul` 고정.
- 주간: `LocalDate.now(ZoneId.of("Asia/Seoul")).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))` ~ `+6일 23:59:59`
- 월간: `withDayOfMonth(1)` ~ `with(TemporalAdjusters.lastDayOfMonth()) 23:59:59`
- `offset=previous`: 주간은 `-7일`, 월간은 `minusMonths(1)` 후 동일 로직.

### 4.3 쿼리 전략

모든 쿼리는 다음 필터를 공통 적용한다:

```
u.deleted_at IS NULL
u.deactivated_at IS NULL
u.suspended_until IS NULL OR u.suspended_until < NOW()
```

#### 4.3.1 `period=all`

```sql
SELECT u.id, u.nickname, u.level, u.xp, u.bio, u.mentor_status
  FROM users u
 WHERE u.deleted_at IS NULL
   AND u.deactivated_at IS NULL
   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
 ORDER BY u.xp DESC, u.id ASC
 LIMIT 100
```

*주: `UserEntity`에는 프로필 이미지/소속 컬럼이 없다. 프론트는 닉네임 이니셜 기반 `Avatar`로 대체한다.*

- 활동 카운트(누적): Top100 `user_id IN (...)` 조건으로 3개 집계 쿼리를 병렬 실행하거나, 단일 쿼리에 상관 서브쿼리 3개를 삽입.
- `myRank`: `SELECT COUNT(*) + 1 FROM users WHERE xp > :myXp AND <common filters>`
- `xpToTop100`: `SELECT xp FROM users WHERE <filters> ORDER BY xp DESC LIMIT 1 OFFSET 99` — 100위 XP를 조회해 차이 계산. 유저 수가 100 미만이면 0.

#### 4.3.2 `period=weekly|monthly`

```sql
WITH period_xp AS (
  SELECT user_id, SUM(delta_xp) AS period_xp
    FROM xp_events
   WHERE created_at BETWEEN :start AND :end
   GROUP BY user_id
  HAVING SUM(delta_xp) > 0
   ORDER BY period_xp DESC, user_id ASC
   LIMIT 100
)
SELECT p.user_id, p.period_xp,
       u.nickname, u.level, u.xp, u.bio, u.mentor_status,
       (SELECT COUNT(*) FROM answers a
         WHERE a.author_user_id = u.id
           AND a.is_accepted = 1
           AND a.deleted_at IS NULL
           AND a.created_at BETWEEN :start AND :end) AS accepted_cnt,
       (SELECT COUNT(*) FROM answers a
         WHERE a.author_user_id = u.id
           AND a.deleted_at IS NULL
           AND a.created_at BETWEEN :start AND :end) AS answer_cnt,
       (SELECT COUNT(*) FROM questions q
         WHERE q.author_user_id = u.id
           AND q.deleted_at IS NULL
           AND q.created_at BETWEEN :start AND :end) AS question_cnt
  FROM period_xp p
  JOIN users u ON u.id = p.user_id
 WHERE u.deleted_at IS NULL
   AND u.deactivated_at IS NULL
   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
 ORDER BY p.period_xp DESC, p.user_id ASC
```

- MySQL 8의 `WITH` (CTE) 사용. Hibernate 네이티브 쿼리로 실행하고 DTO 프로젝션으로 매핑한다.
- `myRank` (기간):
  ```sql
  SELECT COUNT(*) + 1
    FROM (SELECT user_id, SUM(delta_xp) s
            FROM xp_events
           WHERE created_at BETWEEN :start AND :end
           GROUP BY user_id
          HAVING SUM(delta_xp) > :myPeriodXp) t
   JOIN users u ON u.id = t.user_id
   WHERE <common filters>
  ```
  내 `myPeriodXp`가 0 이하이면 `myRank = null`.

### 4.4 필요한 인덱스 (마이그레이션에서 생성)

```sql
-- xp_events: 기간 필터 + GROUP BY 최적화
CREATE INDEX idx_xp_events_created_user_delta
  ON xp_events (created_at, user_id, delta_xp);
```

- `answers(author_user_id, created_at)`, `questions(author_user_id, created_at)`는 기존 인덱스 존재 → 재사용.
- `is_accepted` 필터가 선택도 높은 경우 `(author_user_id, is_accepted, created_at)` 복합 인덱스 추가를 후속 작업으로 고려.
- `users.xp` 기존 `idx_users_xp` 사용. 소프트 삭제 + 상태 필터가 selectivity를 낮추지만 100행 LIMIT이므로 filesort 비용 허용.

### 4.5 트랜잭션 & 캐시

- `RankingService`의 모든 조회 메서드는 `@Transactional(readOnly = true)`.
- Spring `@Cacheable`로 **Top100 보드만** 캐시:
  - 캐시 키: `period + offset`
  - `sync = true` (스탬피드 방지)
  - 현재 기간(`offset=current`, `period=all`): TTL 5분
  - 과거 기간(`offset=previous`): 별도 캐시 리전, TTL 1시간 (불변 데이터)
- `myRank`는 캐시하지 않고 매 요청 계산.
- Caffeine 로컬 캐시 사용(기존 프로젝트 설정 우선 확인).

### 4.6 도메인 서비스 시그니처

```java
public RankingResponse getRanking(RankingPeriod period, RankingOffset offset, Long currentUserId);
```

내부적으로 `period == ALL`이면 `fetchAllRanking()`, 그 외 `fetchPeriodRanking(period, offset)` 호출. `currentUserId`로 개인 순위 산출 (비로그인 시 `null`).

### 4.7 보안

- 엔드포인트는 공개(`permitAll`)이지만, 로그인 시 `@AuthenticationPrincipal`로 유저 ID 획득.
- SQL Injection 방지: 모든 파라미터는 바인딩 변수 사용. 날짜 포맷팅은 서비스에서 `LocalDateTime` → `Timestamp` 변환.
- Rate limiting: 기존 글로벌 설정 상속. 추가 제한 불요.

---

## 5. 프론트엔드 설계

### 5.1 경로 및 파일 구조

```
frontend/app/rankings/page.tsx        // Client Component, 페이지 껍데기
frontend/components/ranking/
├── RankingList.tsx                   // Segmented + 리스트 총괄
├── RankingRow.tsx                    // 행 (메모화)
├── RankingMyBanner.tsx               // 내 순위 배너
└── RankingList.module.css            // 행 레이아웃 전용 스타일
frontend/lib/rankings.ts              // fetch 헬퍼 + in-memory 캐시
```

헤더 내비(`components/layout/Header.tsx` 등)에 "랭킹" 링크를 추가해 접근성 확보.

### 5.2 상태 관리 — URL 파라미터

- `useSearchParams` + `router.replace` (shallow) 사용.
- 파라미터:
  - `scope`: `all` | `weekly` | `monthly` (기본 `all`)
  - `offset`: `0` | `-1` (기본 `0`; `all`일 땐 무시)
- 이유: 공유 가능(`지난주 1위 봐봐`), 뒤로가기 정상 동작, 탭 상태가 브라우저 히스토리에 반영.

### 5.3 UI 레이아웃

```
┌─────────────────────────────────────────────┐
│  랭킹                                         │
│  매주/매달 가장 활발한 유저를 확인해 보세요.       │
├─────────────────────────────────────────────┤
│  [ 전체 | 주간 | 월간 ]                         │
│  (주간/월간일 때만) [ 이번 | 지난 ]              │
│  기간: 2026-04-13 ~ 2026-04-19                │
├─────────────────────────────────────────────┤
│  [내 순위 배너]  253위 · 450 XP               │
│                 Top 100 진입까지 180 XP       │
├─────────────────────────────────────────────┤
│  🥇 1  [H]  hardy 🎓         Lv.7     2,340 XP │
│          한줄 소개 텍스트          ✓12 💬34 ❓8 │
│  🥈 2  ...                                    │
│  🥉 3  ...                                    │
│   4    ...                                    │
│  ...                                          │
└─────────────────────────────────────────────┘
```

- `[H]`: 닉네임 이니셜 기반 antd `Avatar`
- `🎓`: `mentorStatus=APPROVED`일 때만 노출되는 멘토 배지

**구성 컴포넌트**
- 기간 선택: antd `Segmented` (3개 옵션)
- 오프셋 선택: antd `Segmented` (2개 옵션, 아이콘 포함) — weekly/monthly에서만 렌더
- 내 순위 배너: antd `Card`, Top 100 안/밖 두 가지 변형
- 리스트: antd `List` + 각 행을 커스텀 `<Link>` (Next.js)
- 상위 1~3위: 메달 아이콘 + CSS 변수 배경 강조

### 5.4 행 구조 & 접근성

- 행 자체를 `<Link href={`/users/${userId}`}>` 로 감싸 일반 앵커처럼 동작(middle-click, cmd-click, prefetch).
- `aria-label="1위, hardy, 레벨 7, 2340 XP, 답변 채택 12, 답변 34, 질문 8"` 와 같이 전체 정보를 하나의 레이블로 제공.
- 메달 아이콘은 `aria-hidden="true"`. 대신 `"1위"` 텍스트로 순위 제공.
- `bio`는 닉네임 아래 별도 라인에 인라인 표시. `null`이면 해당 라인을 렌더하지 않음.
- 색상 강조(금/은/동)에 의존하지 않고 메달 아이콘 + 텍스트 레이블로 이중 표기.

### 5.5 다크/라이트 모드 토큰

`globals.css`에 랭킹 전용 토큰 추가:

```css
:root {
  --rank-gold: #f5c518;
  --rank-silver: #b8bcc4;
  --rank-bronze: #cd7f32;
  --rank-row-highlight: rgba(245, 197, 24, 0.08);
}
[data-theme="dark"] {
  --rank-gold: #ffd740;
  --rank-silver: #d0d4dc;
  --rank-bronze: #e39555;
  --rank-row-highlight: rgba(255, 215, 64, 0.1);
}
```

상위 1~3위 행에만 `background-color: var(--rank-row-highlight)` 적용.

### 5.6 데이터 페칭

- 클라이언트 컴포넌트 + `useEffect(() => fetchRanking(scope, offset), [scope, offset])` 패턴(기존 페이지와 동일).
- `lib/rankings.ts`에 `Map<string, RankingResponse>` 형태 in-memory 캐시. 키: `${scope}:${offset}`. TTL 5분.
- 탭 전환 시 이전에 본 탭은 캐시에서 즉시 복원 → 깜빡임 제거.
- SWR / React Query는 도입하지 않음 (프로젝트 컨벤션 유지).

### 5.7 로딩 / 빈 / 에러 상태

- 로딩: antd `Skeleton` 20행(가시 영역만 스켈레톤, 100행은 과함).
- 빈 상태: 기간 내 랭킹이 없을 때 `<Empty>` + "이 기간에는 아직 랭킹이 없어요".
- 에러: 토스트 + "다시 시도" 버튼 (antd `Result`).

### 5.8 반응형

- `@media (max-width: 639px)`
  - 아바타 크기 축소, 닉네임 줄임표(`text-overflow: ellipsis`)
  - 활동 지표 3개는 행 두 번째 줄 오른쪽에 소형 아이콘+숫자만
  - 소속/한줄 소개는 최대 1줄, 넘치면 줄임표

### 5.9 비로그인 처리

- 로그인 안 된 경우 `myRank` 배너 자체를 렌더하지 않음.
- 행 Top100은 동일하게 노출.
- 헤더 내비에는 비로그인에도 "랭킹" 링크 표시.

---

## 6. 엣지 케이스 매트릭스

| 상황 | 처리 |
|------|------|
| 기간 내 XP 0 또는 음수 유저 | Top100 리스트에서 제외 (`HAVING SUM > 0`) |
| 로그인 유저가 기간 내 XP 0 | `myRank: null` 반환 → 배너 대신 "이번 기간에는 활동 기록이 없어요" |
| 동점 | `user_id ASC`로 결정적 정렬 |
| 소프트 삭제/비활성/정지 유저 | 모든 쿼리에서 제외 |
| Top 100 < 100명(유저 수 적음) | `xpToTop100 = 0`, "당신이 곧 랭커!" 문구 |
| `offset=previous`에 XP 이벤트 없음 | 빈 리스트, Empty 상태 표시 |
| 요청 중복 (빠른 탭 전환) | fetch 취소(AbortController) + 마지막 요청만 반영 |
| 비로그인 | `myRank: null`, 배너 미노출 |

---

## 7. 확장 여지 (이번 범위 외)

- 기간 랭킹 사전 집계 테이블(`user_xp_weekly`, `user_xp_monthly`) 도입 — 유저 수가 커지면 5분 캐시로 부족.
- "내 순위 변동" 알림 (예: 100위 진입, 순위 10계단 상승).
- 태그/카테고리별 랭킹.
- 연간 챔피언 아카이브.

---

## 8. 체크리스트

- [ ] 백엔드: `ranking` 패키지 신설, 컨트롤러/서비스/네이티브 쿼리 리포지토리
- [ ] 백엔드: 마이그레이션에 `idx_xp_events_created_user_delta` 추가
- [ ] 백엔드: 캐시 리전 2개 등록(current/previous) + `sync=true`
- [ ] 백엔드: 공통 필터(`deleted_at`, `deactivated_at`, `suspended_until`) 누락 없는지 코드리뷰 체크포인트
- [ ] 프론트: `/rankings` 페이지 + `RankingList/Row/MyBanner` 컴포넌트
- [ ] 프론트: `lib/rankings.ts` fetch + in-memory 캐시
- [ ] 프론트: 헤더 내비에 "랭킹" 링크 추가
- [ ] 프론트: `globals.css`에 랭크 토큰 추가(라이트/다크)
- [ ] 프론트: URL 파라미터(`scope`, `offset`) 기반 상태 관리
- [ ] 접근성: 행 `<Link>` + `aria-label` + 메달 `aria-hidden`
