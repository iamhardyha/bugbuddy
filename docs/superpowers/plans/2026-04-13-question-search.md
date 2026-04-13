# 질문 검색 기능 Implementation Plan

> **참고:** 본 프로젝트 규칙상 테스트 코드 작성은 생략하고 수동 검증으로 대체합니다.

**Goal:** 사용자가 글로벌 헤더에서 키워드를 입력해 질문(제목+본문)을 검색하고, `/search` 전용 페이지에서 결과를 확인할 수 있도록 한다.

**Architecture:** 기존 `GET /api/questions` 엔드포인트에 `keyword` 파라미터를 추가하고 JPQL `LIKE` 기반 검색 메서드를 새로 만든다. 프론트엔드는 `GlobalHeader`에 antd `Input.Search`를 추가하고, `app/search/page.tsx` 신규 페이지에서 `QuestionCard` 리스트로 결과를 렌더한다.

**Tech Stack:** Spring Boot 3.4 + JPA (JPQL), Next.js App Router + TypeScript, antd v6

**Spec:** `docs/superpowers/specs/2026-04-13-question-search-design.md`

---

## Task 1: Backend — Repository에 searchByKeyword 추가

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/repository/QuestionRepository.java`

- [ ] **Step 1: `searchByKeyword` 메서드 추가**

`findAllActiveByCategoryAndType` 바로 아래에 다음 메서드를 추가한다.

```java
@Query(value = "SELECT q FROM Question q JOIN FETCH q.author WHERE q.hidden = false " +
               "AND (LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
               "     OR LOWER(q.body) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
               "AND (:category IS NULL OR q.category = :category) " +
               "AND (:type IS NULL OR q.questionType = :type) " +
               "AND (:status IS NULL OR q.status = :status) " +
               "ORDER BY q.createdAt DESC",
       countQuery = "SELECT COUNT(q) FROM Question q WHERE q.hidden = false " +
                    "AND (LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "     OR LOWER(q.body) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                    "AND (:category IS NULL OR q.category = :category) " +
                    "AND (:type IS NULL OR q.questionType = :type) " +
                    "AND (:status IS NULL OR q.status = :status)")
Page<Question> searchByKeyword(@Param("keyword") String keyword,
                               @Param("category") QuestionCategory category,
                               @Param("type") QuestionType type,
                               @Param("status") QuestionStatus status,
                               Pageable pageable);
```

- [ ] **Step 2: 빌드 확인**

Run: `cd backend && ./gradlew compileJava`
Expected: `BUILD SUCCESSFUL`

---

## Task 2: Backend — Service에 keyword 분기 추가

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/question/QuestionService.java`

- [ ] **Step 1: `findAll` 시그니처에 `keyword` 추가**

`findAll` 메서드를 다음과 같이 교체한다.

```java
public Page<QuestionSummaryResponse> findAll(String keyword,
                                              QuestionCategory category,
                                              QuestionType questionType,
                                              QuestionStatus status,
                                              Pageable pageable) {
    Page<Question> questions;

    if (keyword != null && !keyword.isBlank()) {
        questions = questionRepository.searchByKeyword(
                keyword.trim(), category, questionType, status, pageable);
    } else if (category != null && questionType != null) {
        questions = questionRepository.findAllActiveByCategoryAndType(category, questionType, pageable);
    } else if (category != null) {
        questions = questionRepository.findAllActiveByCategory(category, pageable);
    } else if (questionType != null) {
        questions = questionRepository.findAllActiveByType(questionType, pageable);
    } else if (status != null) {
        questions = questionRepository.findAllActiveByStatus(status, pageable);
    } else {
        questions = questionRepository.findAllActive(pageable);
    }

    List<Long> questionIds = questions.getContent().stream()
            .map(Question::getId)
            .toList();

    Map<Long, List<String>> tagsMap = tagService.getTagNamesByQuestionIds(questionIds);

    return questions.map(q -> {
        List<String> tags = tagsMap.getOrDefault(q.getId(), List.of());
        return QuestionSummaryResponse.of(q, tags);
    });
}
```

- [ ] **Step 2: 빌드 확인 (컨트롤러 호출부 불일치로 FAIL 예상)**

Run: `cd backend && ./gradlew compileJava`
Expected: FAIL — `QuestionController`에서 기존 `findAll(category, questionType, status, pageable)` 호출 불일치.

---

## Task 3: Backend — Controller에 keyword 파라미터 추가

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/question/QuestionController.java`

- [ ] **Step 1: `findAll` 엔드포인트 수정**

```java
@GetMapping
public ResponseEntity<ApiResponse<Page<QuestionSummaryResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) QuestionCategory category,
        @RequestParam(required = false) QuestionType questionType,
        @RequestParam(required = false) QuestionStatus status,
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
) {
    Page<QuestionSummaryResponse> response =
            questionService.findAll(keyword, category, questionType, status, pageable);
    return ResponseEntity.ok(ApiResponse.ok(response));
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd backend && ./gradlew compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/repository/QuestionRepository.java \
        backend/src/main/java/me/iamhardyha/bugbuddy/question/QuestionService.java \
        backend/src/main/java/me/iamhardyha/bugbuddy/question/QuestionController.java
git commit -m "feat(question): 질문 키워드 검색 API 추가"
```

---

## Task 4: Backend — 수동 검증 (서버 실행 후 호출)

**Files:** 없음

- [ ] **Step 1: 서버 구동 (이미 구동 중이면 생략)**

Run: `cd backend && ./gradlew bootRun`
Expected: `Started BugbuddyApplication`

- [ ] **Step 2: 키워드 없는 목록 기존 동작 확인**

Run: `curl -s 'http://localhost:8080/api/questions?size=3' | jq '.data.content | length'`
Expected: 0 이상의 정수

- [ ] **Step 3: 키워드 검색 호출**

Run: `curl -s 'http://localhost:8080/api/questions?keyword=a&size=3' | jq '.success, .data.totalElements'`
Expected: `true` + 숫자 출력 (오류 없음)

- [ ] **Step 4: 카테고리 + 키워드 조합**

Run: `curl -s 'http://localhost:8080/api/questions?keyword=a&category=BACKEND&size=3' | jq '.success'`
Expected: `true`

---

## Task 5: Frontend — lib/questions.ts에 keyword 파라미터 추가

**Files:**
- Modify: `frontend/lib/questions.ts`

- [ ] **Step 1: `getQuestions` 시그니처 수정**

```typescript
export function getQuestions(params?: {
  keyword?: string;
  category?: QuestionCategory;
  questionType?: QuestionType;
  status?: QuestionStatus;
  page?: number;
  size?: number;
}) {
  const filtered = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(filtered as Record<string, string>).toString();
  return apiFetch<Page<QuestionSummary>>(`/api/questions${query ? `?${query}` : ''}`);
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd frontend && npx tsc --noEmit`
Expected: 에러 없음

---

## Task 6: Frontend — GlobalHeader 검색바 추가

**Files:**
- Read first: `frontend/components/common/GlobalHeader.tsx`
- Modify: `frontend/components/common/GlobalHeader.tsx`
- Modify: `frontend/components/common/GlobalHeader.module.css`

- [ ] **Step 1: 현재 `GlobalHeader.tsx` 전체 읽어서 기존 구조 파악**

Read tool로 전체 내용을 확인한다. 로고/메뉴/액션 영역 배치를 확인.

- [ ] **Step 2: Input.Search 통합**

상단 import에 다음 추가:

```tsx
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
```

컴포넌트 내부에 검색 상태 + 핸들러 추가:

```tsx
const router = useRouter();
const pathname = usePathname();
const searchParams = useSearchParams();
const [searchValue, setSearchValue] = useState(
  pathname === '/search' ? (searchParams.get('q') ?? '') : ''
);

function handleSearch(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  router.push(`/search?q=${encodeURIComponent(trimmed)}`);
}
```

로고와 우측 액션 사이(중앙 영역)에 다음 JSX를 배치한다. 기존 레이아웃 구조에 맞춰 className은 모듈 CSS로 연결.

```tsx
<div className={styles.searchBox}>
  <Input.Search
    value={searchValue}
    onChange={(e) => setSearchValue(e.target.value)}
    onSearch={handleSearch}
    placeholder="질문 검색..."
    allowClear
    maxLength={100}
    enterButton={<SearchOutlined />}
    size="middle"
  />
</div>
```

- [ ] **Step 3: CSS 추가**

`GlobalHeader.module.css` 하단에 추가:

```css
.searchBox {
  flex: 1;
  max-width: 520px;
  margin: 0 24px;
}

@media (max-width: 768px) {
  .searchBox {
    margin: 0 12px;
    max-width: 100%;
  }
  .searchBox :global(.ant-input-search) {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .searchBox :global(.ant-input-group-addon) {
    display: none;
  }
}
```

- [ ] **Step 4: 타입 체크**

Run: `cd frontend && npx tsc --noEmit`
Expected: 에러 없음

---

## Task 7: Frontend — /search 페이지 생성

**Files:**
- Create: `frontend/app/search/page.tsx`

- [ ] **Step 1: 디렉터리 생성 및 페이지 작성**

```bash
mkdir -p /Users/iamhardyha/dev/bugbuddy/frontend/app/search
```

`app/search/page.tsx` 작성:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import QuestionCard from '@/components/question/QuestionCard';
import { getQuestions } from '@/lib/questions';
import { getAccessToken } from '@/lib/auth';
import type { QuestionSummary, QuestionCategory, QuestionStatus } from '@/types/question';
import layoutStyles from '@/components/common/Layout.module.css';

const { Title, Text } = Typography;

const ALL = 'ALL' as const;
type CategoryFilter = QuestionCategory | typeof ALL;

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: ALL, label: '전체' },
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'MOBILE', label: '모바일' },
  { value: 'AI_DATA', label: 'AI / 데이터' },
  { value: 'CS_ALGO', label: 'CS / 알고리즘' },
  { value: 'CAREER', label: '커리어' },
  { value: 'FUTURE', label: '미래 고민' },
  { value: 'ETC', label: '기타' },
];

type StatusTab = 'all' | 'open' | 'solved' | 'closed';
const STATUS_TABS: { value: StatusTab; label: string; status?: QuestionStatus }[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '진행중', status: 'OPEN' },
  { value: 'solved', label: '해결됨', status: 'SOLVED' },
  { value: 'closed', label: '마감됨', status: 'CLOSED' },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = (searchParams.get('q') ?? '').trim();

  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  useEffect(() => {
    if (!keyword) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setPage(0);
    const status = STATUS_TABS.find(t => t.value === statusTab)?.status;
    getQuestions({
      keyword,
      category: category === ALL ? undefined : category,
      status,
      page: 0,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(res.data.content);
        setTotal(res.data.totalElements);
        setHasMore(!res.data.last);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [keyword, category, statusTab, router]);

  function handleLoadMore() {
    const next = page + 1;
    const status = STATUS_TABS.find(t => t.value === statusTab)?.status;
    setLoadingMore(true);
    getQuestions({
      keyword,
      category: category === ALL ? undefined : category,
      status,
      page: next,
      size: 20,
    }).then(res => {
      if (res.success && res.data) {
        setQuestions(prev => [...prev, ...res.data!.content]);
        setHasMore(!res.data.last);
        setPage(next);
      }
      setLoadingMore(false);
    }).catch(() => setLoadingMore(false));
  }

  if (!keyword) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain} style={{ padding: '24px 0' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 16px' }}>
          <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
            검색 결과 · <span style={{ color: 'var(--accent)' }}>{keyword}</span>
          </Title>
          <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {loading ? '검색 중…' : `${total.toLocaleString()}건`}
          </Text>

          <Flex gap={6} wrap style={{ margin: '16px 0 8px' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  border: '1px solid var(--border-faint)',
                  background: category === c.value ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  color: category === c.value ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </Flex>

          <Flex gap={6} style={{ margin: '0 0 16px' }}>
            {STATUS_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setStatusTab(t.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  border: 'none',
                  background: statusTab === t.value ? 'var(--bg-elevated)' : 'transparent',
                  color: statusTab === t.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </Flex>

          {loading ? (
            <Flex vertical gap={8}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  active
                  paragraph={{ rows: 2 }}
                  style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-surface)' }}
                />
              ))}
            </Flex>
          ) : questions.length === 0 ? (
            <Flex vertical align="center" gap={10} style={{ padding: '80px 0' }}>
              <Text style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                &quot;{keyword}&quot;에 해당하는 질문이 없어요.
              </Text>
              {isLoggedIn && (
                <Button type="link" icon={<EditOutlined />} onClick={() => router.push('/questions/new')}>
                  질문하기
                </Button>
              )}
            </Flex>
          ) : (
            <>
              <Flex vertical gap={8}>
                {questions.map(q => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </Flex>
              {hasMore && (
                <Flex justify="center" style={{ padding: '24px 0 8px' }}>
                  <Button onClick={handleLoadMore} loading={loadingMore}>
                    더 보기
                  </Button>
                </Flex>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd frontend && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 프론트 커밋**

```bash
git add frontend/lib/questions.ts \
        frontend/components/common/GlobalHeader.tsx \
        frontend/components/common/GlobalHeader.module.css \
        frontend/app/search/page.tsx
git commit -m "feat(search): 글로벌 헤더 검색바 + /search 결과 페이지 추가"
```

---

## Task 8: 수동 통합 검증

**Files:** 없음

- [ ] **Step 1: 프론트 개발 서버 구동 (이미 실행 중이면 생략)**

Run: `cd frontend && npm run dev`
Expected: `Ready in ...ms`

- [ ] **Step 2: 브라우저에서 다음 케이스 확인**

1. 홈(`/`)에서 헤더 검색바에 "spring" 입력 → 엔터 → `/search?q=spring`로 이동, 결과 노출
2. 결과 페이지에서 카테고리 필터 변경 → 동일 키워드로 재조회
3. 빈 결과: 존재하지 않는 키워드 검색 → "결과 없어요" 빈 상태
4. 공백만 입력 → 헤더에서 submit 무시
5. `/search` 직접 접근(쿼리 없음) → 홈으로 이동
6. 다크 모드 토글 후 헤더 검색바 + 검색 페이지 렌더 확인
7. 모바일 사이즈(`<768px`)에서 헤더 레이아웃이 깨지지 않는지 확인

- [ ] **Step 3: verification-before-completion 스킬로 최종 검증**

백엔드 빌드 + 프론트 타입체크 + 수동 케이스 결과를 종합해 사용자에게 보고.

---

## Self-Review

- Spec의 모든 섹션이 Task에 매핑됨: Repository(Task 1), Service(Task 2), Controller(Task 3), 수동 검증(Task 4, 8), lib/questions(Task 5), GlobalHeader(Task 6), /search 페이지(Task 7).
- Placeholder 없음. 모든 코드 블록이 실제 내용.
- 타입/메서드 이름 일관: `searchByKeyword`, `findAll(keyword,...)`, `getQuestions({keyword,...})`, `/search?q=`.
- 테스트 코드 부재는 프로젝트 규칙에 명시적으로 따른 것.
