# 질문 검색 기능 설계

- 작성일: 2026-04-13
- 범위: BugBuddy 질문 도메인 키워드 검색 (백엔드 + 프론트엔드)
- 상태: 승인됨

## 배경

현재 BugBuddy 질문 탐색은 홈 피드(`/`)의 카테고리/상태 필터에만 의존한다. 일반 사용자가 특정 키워드로 질문을 찾을 방법이 없고, 검색 UI는 관리자 페이지에만 존재한다. 사용자 본인의 질문·답변도 프로필 탭을 거쳐야 찾을 수 있어, "내가 예전에 올린 그 질문"을 바로 찾기 어렵다.

## 목표

- 누구나 홈뿐 아니라 어느 페이지에서든 질문을 키워드로 검색할 수 있다.
- 검색은 질문 **제목 + 본문**을 대상으로 한다. (태그 검색은 향후 `/tags/{name}` 경로로 분리)
- 검색 결과는 **전용 페이지**(`/search?q=`)에서 보여주며, 기존 카테고리/상태 필터와 조합된다.

## 범위 외

- 전문 검색 엔진(Meilisearch, Elasticsearch) 도입 — 후속 과제
- 태그/작성자 검색 — 후속 과제
- 자동완성 드롭다운 — 후속 과제
- 검색 히스토리 저장 — 후속 과제

## 아키텍처

### 백엔드 — Spring Boot

**`QuestionRepository.searchByKeyword`**

```java
@Query(value = """
    SELECT q FROM Question q JOIN FETCH q.author
    WHERE q.hidden = false
      AND (LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(q.body)  LIKE LOWER(CONCAT('%', :keyword, '%')))
      AND (:category IS NULL OR q.category = :category)
      AND (:type     IS NULL OR q.questionType = :type)
      AND (:status   IS NULL OR q.status = :status)
    ORDER BY q.createdAt DESC
    """,
    countQuery = """
    SELECT COUNT(q) FROM Question q
    WHERE q.hidden = false
      AND (LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(q.body)  LIKE LOWER(CONCAT('%', :keyword, '%')))
      AND (:category IS NULL OR q.category = :category)
      AND (:type     IS NULL OR q.questionType = :type)
      AND (:status   IS NULL OR q.status = :status)
    """)
Page<Question> searchByKeyword(...);
```

- JPQL 파라미터 바인딩 → SQL 인젝션 위험 없음.
- count query는 `JOIN FETCH` 제외 (Hibernate 경고 회피).
- 대소문자 무시(`LOWER`).

**`QuestionService.findAll`**

- 시그니처에 `String keyword` 추가.
- `keyword`가 blank 아니면 `searchByKeyword`로 위임, 나머지 필터도 함께 전달.
- blank면 기존 분기 로직 유지(현재 5개 분기).

**`QuestionController`**

- `@RequestParam(required = false) String keyword` 추가.
- 공백 trim, 빈 문자열은 `null` 처리 후 서비스로 전달.
- 인증 불필요(기존 findAll과 동일).

**성능 노트**

- 현재 데이터 규모에서는 `LIKE '%kw%'` 로 충분. 질문 수가 수만 건을 넘거나 P95가 200ms를 넘으면 MySQL FULLTEXT 인덱스 도입을 검토.
- `countQuery`가 별도 실행되므로 N+1이나 페이징 카운트 누락은 발생하지 않음.

### 프론트엔드 — Next.js App Router + antd

**글로벌 헤더 검색바 (`components/common/GlobalHeader.tsx`)**

- 데스크톱: 헤더 중앙에 antd `Input.Search` 배치, `allowClear`, `placeholder="질문 검색..."`, max 100자.
- 모바일(`<md`): 검색 아이콘 버튼 → 터치 시 헤더 전체 영역을 덮는 입력 오버레이.
- 엔터 또는 검색 버튼 클릭 시 `router.push('/search?q=' + encodeURIComponent(trimmed))`.
- 공백만 입력 시 무시.
- 현재 `/search` 페이지에 있는 경우 입력값은 URL의 `q`와 동기화.

**검색 결과 페이지 (`app/search/page.tsx`)**

- Client Component. `useSearchParams`로 `q` 추출.
- `q`가 비어 있으면 `/`로 `router.replace`.
- 상단: "`{keyword}` 검색 결과 · `{total}`건" + 카테고리/상태 필터 pills.
- 본문: `QuestionCard` 리스트. 페이지 사이즈 20. 더보기 버튼 방식(기존 `QuestionFeed`와 동일).
- 로딩: Skeleton 6개.
- 빈 결과: "`{keyword}`에 해당하는 질문이 없어요" + "질문하기" CTA(로그인 시).
- 카테고리/상태 필터 변경 시 같은 `q`로 재조회.

**API 클라이언트 (`lib/questions.ts`)**

- `getQuestions` 옵션에 `keyword?: string` 추가. URL 직렬화는 기존 `URLSearchParams` 로직 재사용 (빈 값 필터링).

**컴포넌트 재사용**

- `QuestionFeed`의 필터 pills과 카드 리스트를 재사용할 수 있도록 작은 단위로 추출하지 않고, `/search` 페이지는 `QuestionFeed` 없이 직접 구현한다(피드는 좌측 사이드바/우측 사이드바가 있어 구조가 다르기 때문). 재사용은 `QuestionCard`와 `getQuestions`에서 충분.

## 데이터 흐름

```
사용자 입력(GlobalHeader)
   │
   ▼
router.push('/search?q=kw')
   │
   ▼
SearchPage mount
   │
   ▼
getQuestions({ keyword, category, status, page })
   │
   ▼
GET /api/questions?keyword=kw&category=...&page=...
   │
   ▼
QuestionController → QuestionService.findAll
   │
   ▼
QuestionRepository.searchByKeyword (JPQL LIKE)
   │
   ▼
Page<QuestionSummaryResponse> 반환
   │
   ▼
QuestionCard 리스트 렌더
```

## 에러 및 엣지 케이스

| 상황 | 처리 |
|------|------|
| `q` 파라미터 없음 / 빈 문자열 | `/`로 `router.replace` |
| 공백만 입력 | 헤더에서 submit 무시 |
| 100자 초과 입력 | FE에서 `maxLength={100}` 컷 |
| 특수문자(`%`, `_`, `'`) | JPQL 파라미터 바인딩으로 이스케이프. `LIKE` 와일드카드(`%`, `_`)는 의도적으로 리터럴 처리하지 않음(허용되는 부작용) |
| 네트워크 실패 | `getQuestions` 에러를 catch, "검색 중 오류가 발생했어요" 알림 |
| 결과 0건 | 빈 상태 UI |

## 보안

- 인증 불필요(기존 목록 API와 동일 권한).
- JPQL 바인딩으로 SQL 인젝션 방어.
- 검색어는 URL 파라미터로 노출되지만 공개 데이터이므로 문제 없음.
- 과도한 요청에 대한 rate limit은 BugBuddy 전역 정책을 따름(현재 구현 없음 — 별도 과제).

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|----------|
| `backend/.../repository/QuestionRepository.java` | 수정 — `searchByKeyword` 추가 |
| `backend/.../question/QuestionService.java` | 수정 — `findAll`에 `keyword` 파라미터 |
| `backend/.../question/QuestionController.java` | 수정 — `@RequestParam keyword` |
| `frontend/components/common/GlobalHeader.tsx` | 수정 — 검색바 추가 |
| `frontend/components/common/GlobalHeader.module.css` | 수정 — 검색바 스타일 |
| `frontend/app/search/page.tsx` | 신규 — 검색 결과 페이지 |
| `frontend/lib/questions.ts` | 수정 — `keyword` 파라미터 전파 |

## 검증 기준

- [ ] 백엔드 빌드(`./gradlew compileJava`) 통과
- [ ] 프론트엔드 타입 체크(`npm run build` or `tsc --noEmit`) 통과
- [ ] 수동 테스트: 홈 → 헤더에 "spring" 입력 → `/search?q=spring`에서 관련 질문 노출
- [ ] 카테고리 + 키워드 조합 필터링 동작
- [ ] 빈 결과 / 빈 쿼리 처리 동작
- [ ] 다크/라이트 모드에서 헤더 검색바 스타일 확인
- [ ] 모바일 뷰(`<md`)에서 검색 아이콘/오버레이 동작
