# 멘토 탐색 페이지 설계

- 작성일: 2026-04-13
- 범위: `/mentor` 목록 페이지 + 백엔드 공개 API
- 상태: 승인됨

## 배경

현재 BugBuddy에는 멘토 신청(`/mentor/apply`)만 존재하고, 누가 인증된 멘토인지 사용자가 찾을 방법이 없다. 공개 프로필(`/users/{id}`)은 이미 멘토 정보(`PublicProfile.isMentor`, `mentorAvgRating`)를 포함하므로, 멘토 **탐색**만 추가하면 된다.

## 목표

- 사용자가 승인된 멘토 목록을 브라우징할 수 있다.
- 닉네임 키워드 검색, 정렬(평점/최신/레벨) 가능.
- 멘토 카드 클릭 시 기존 `/users/{id}` 공개 프로필로 이동 (중복 페이지 없음).
- 글로벌 헤더에 `Mentors` 내비 링크 추가.

## 범위 외

- 전용 `/mentor/{id}` 페이지 — `/users/{id}` 재사용
- 멘토링 직접 요청 버튼 — 기존 채팅 플로우 사용
- 멘토 태그/전문 분야 필터 — `MentorApplication`에 필드 없음, 후속 과제
- 북마크/팔로우 멘토 — 후속 과제

## 백엔드 설계

**신규 엔드포인트**

```
GET /api/mentors?keyword=&sort=RATING|RECENT|LEVEL&page=0&size=20
```

- 인증 불필요 (공개)
- 응답: `ApiResponse<Page<MentorCardResponse>>`

**`MentorCardResponse`**

```java
public record MentorCardResponse(
    Long id,
    String nickname,
    String bio,
    int level,
    int xp,
    BigDecimal mentorAvgRating,
    int mentorRatingCount
) {
    public static MentorCardResponse of(UserEntity u) { ... }
}
```

**`UserRepository.findApprovedMentors`**

```java
@Query(value = """
    SELECT u FROM UserEntity u
    WHERE u.mentorStatus = me.iamhardyha.bugbuddy.model.enums.MentorStatus.APPROVED
      AND u.deactivatedAt IS NULL
      AND (:keyword IS NULL
           OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(COALESCE(u.bio, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """,
    countQuery = """
    SELECT COUNT(u) FROM UserEntity u
    WHERE u.mentorStatus = me.iamhardyha.bugbuddy.model.enums.MentorStatus.APPROVED
      AND u.deactivatedAt IS NULL
      AND (:keyword IS NULL
           OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(COALESCE(u.bio, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
Page<UserEntity> findApprovedMentors(@Param("keyword") String keyword, Pageable pageable);
```

- 정렬은 호출 측 `Pageable.getSort()`에서 전달. 서비스에서 `sort` 쿼리 파라미터를 `Sort`로 변환:
  - `RATING` (기본): `mentorAvgRating DESC NULLS LAST, mentorRatingCount DESC, id DESC`
  - `RECENT`: `id DESC` (신규 가입 ≈ 최근 승인 근사)
  - `LEVEL`: `level DESC, xp DESC, id DESC`
- JPA `Sort`는 `NULLS LAST`를 직접 표현 못함 → `RATING` 정렬 시 평점 없는 유저가 하위에 오도록 `COALESCE` 기반 정렬은 복잡하므로, 기본 `mentorAvgRating DESC`만 적용하고 MySQL이 NULL을 가장 작게(ASC)/가장 크게(DESC) 취급하는 기본 동작 허용 (MySQL은 DESC에서 NULL이 마지막에 오므로 요구사항과 일치).

**`MentorService.listMentors`**

```java
public Page<MentorCardResponse> listMentors(String keyword, String sort, Pageable pageable) {
    Sort sortOption = resolveSort(sort); // RATING|RECENT|LEVEL
    Pageable effective = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sortOption);
    String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
    return userRepository.findApprovedMentors(kw, effective)
        .map(MentorCardResponse::of);
}
```

**`MentorController`** — `@GetMapping` 추가

```java
@GetMapping("s")  // /api/mentors (RequestMapping이 /api/mentor)
```

RequestMapping 경로와 맞지 않으므로 **별도 컨트롤러** 또는 `MentorController`의 `@RequestMapping`을 `/api/mentor`로 유지하고 새 엔드포인트는 `@GetMapping(path = "/list")`로 타협 — 그러나 RESTful 관례에 따라 복수 `/api/mentors`가 더 적절.

**결정**: `MentorController`에 `@RequestMapping` 없이 메서드 레벨 `@GetMapping("/api/mentors")`를 추가하거나, 신규 `MentorExploreController` 분리. 기존 컨트롤러의 `@RequestMapping("/api/mentor")`를 깨지 않기 위해 **`MentorExploreController` 신규 클래스로 분리**한다.

```java
@RestController
@RequiredArgsConstructor
public class MentorExploreController {
    private final MentorService mentorService;

    @GetMapping("/api/mentors")
    public ResponseEntity<ApiResponse<Page<MentorCardResponse>>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false, defaultValue = "RATING") String sort,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            mentorService.listMentors(keyword, sort, pageable)));
    }
}
```

## 프론트엔드 설계

**`app/mentor/page.tsx` (신규)**

- Client Component
- 상단: 페이지 제목 "멘토 탐색" + 설명, `Input.Search` (닉네임/bio), antd `Segmented`로 정렬 토글 (평점/최신/레벨)
- 본문: `MentorCard` 그리드 (2열 데스크톱, 1열 모바일)
- 하단: 더보기 버튼
- 빈 상태: "조건에 맞는 멘토가 없어요"

**`components/mentor/MentorCard.tsx`**

- 아바타(닉네임 이니셜), 닉네임, 레벨 배지, 평점 (별 아이콘 + 평균/카운트), bio 2줄 클램프, "프로필 보기" 버튼 → `router.push('/users/' + id)`
- 다크/라이트 모드 변수 사용

**`lib/mentors.ts`**

```typescript
export function getMentors(params?: {
  keyword?: string;
  sort?: 'RATING' | 'RECENT' | 'LEVEL';
  page?: number;
  size?: number;
}) { ... }
```

**`types/mentor.ts`**

```typescript
export interface MentorCard {
  id: number;
  nickname: string;
  bio: string | null;
  level: number;
  xp: number;
  mentorAvgRating: number | null;
  mentorRatingCount: number;
}
```

**`GlobalHeader.tsx`**

- `Q&A`, `TechFeed` 옆에 `Mentors` 링크 추가 (`/mentor`에서 active)
- `/mentor/apply`도 `/mentor` 하위이므로 기존 active 로직은 `startsWith('/mentor')`로 수정

## 에러/엣지

| 상황 | 처리 |
|------|------|
| 결과 0건 | 빈 상태 UI |
| 평점 없는 멘토 (`mentorAvgRating == null`) | "평점 없음" 표시 |
| `deactivatedAt != null` 멘토 | 쿼리에서 제외 |
| 키워드 특수문자 | JPQL 파라미터 바인딩으로 안전 |

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `backend/.../repository/UserRepository.java` | `findApprovedMentors` 추가 |
| `backend/.../mentor/MentorService.java` | `listMentors` 추가 |
| `backend/.../mentor/MentorExploreController.java` | 신규 |
| `backend/.../mentor/dto/MentorCardResponse.java` | 신규 |
| `frontend/app/mentor/page.tsx` | 신규 |
| `frontend/components/mentor/MentorCard.tsx` | 신규 |
| `frontend/components/mentor/MentorCard.module.css` | 신규 |
| `frontend/lib/mentors.ts` | 신규 |
| `frontend/types/mentor.ts` | 신규 |
| `frontend/components/common/GlobalHeader.tsx` | Mentors 링크 추가 |

## 검증

- [ ] 백엔드 `./gradlew compileJava` 통과
- [ ] 프론트엔드 `npm run build` 통과
- [ ] `/mentor` 접근 → 목록 렌더
- [ ] 정렬 변경 시 재조회
- [ ] 키워드 검색 동작
- [ ] 카드 클릭 시 `/users/{id}` 이동
- [ ] 헤더 Mentors 링크 active 상태 (`/mentor`, `/mentor/apply`)
- [ ] 다크/라이트 모드 카드 렌더
