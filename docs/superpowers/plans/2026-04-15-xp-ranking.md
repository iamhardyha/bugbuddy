# XP 랭킹 페이지 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **사용자 설정:** 이 프로젝트는 테스트 코드 작성 금지(MEMORY). 각 태스크는 TDD 단계 없이 구현→수동 검증→커밋 순으로 진행.

**Goal:** BugBuddy에 `/rankings` 페이지를 추가해 전체/주간/월간 XP 랭킹 Top 100과 로그인 유저의 개인 순위를 제공한다.

**Architecture:** Spring Boot 백엔드에 `ranking` 패키지를 신설하고 단일 엔드포인트 `GET /api/rankings`로 period/offset 파라미터 분기. 네이티브 SQL + Caffeine 캐시. 프론트는 Next.js App Router 클라이언트 컴포넌트 + URL 파라미터 기반 상태.

**Tech Stack:** Spring Boot 3.4.13 / Java 21 / JPA 네이티브 쿼리 / Caffeine / Next.js App Router / antd v6 / CSS Modules

**Spec:** `docs/superpowers/specs/2026-04-15-xp-ranking-design.md`

---

## 파일 구조

**백엔드 신규 파일**
```
backend/src/main/java/me/iamhardyha/bugbuddy/ranking/
├── RankingController.java
├── RankingService.java
├── RankingQueryRepository.java
├── RankingPeriod.java              (enum)
├── RankingOffset.java              (enum)
└── dto/
    ├── RankingResponse.java        (record)
    ├── RankingRowResponse.java     (record)
    └── MyRankResponse.java         (record)
backend/src/main/java/me/iamhardyha/bugbuddy/config/
└── CacheConfig.java                (@EnableCaching + Caffeine)
```

**백엔드 수정 파일**
```
backend/build.gradle                (Caffeine 의존성)
backend/src/main/java/me/iamhardyha/bugbuddy/model/entity/XpEvent.java  (인덱스 추가)
backend/src/main/java/me/iamhardyha/bugbuddy/security/SecurityConfig.java (permitAll)
```

**프론트 신규 파일**
```
frontend/app/rankings/page.tsx
frontend/components/ranking/
├── RankingList.tsx
├── RankingRow.tsx
├── RankingMyBanner.tsx
└── RankingList.module.css
frontend/lib/rankings.ts
```

**프론트 수정 파일**
```
frontend/components/common/GlobalHeader.tsx    (내비 링크)
frontend/components/common/BottomNav.tsx       (모바일 하단 내비, 확인 후 선택 추가)
frontend/app/globals.css                       (랭크 토큰)
```

---

## Task 1: XpEvent 인덱스 추가

**목적:** 주간/월간 GROUP BY 쿼리가 `created_at` 레인지 스캔을 효율적으로 사용하도록 복합 인덱스 추가. `ddl-auto: update`가 재시작 시 자동 반영.

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/model/entity/XpEvent.java:12-19`

- [ ] **Step 1: `@Table` 인덱스 목록에 신규 인덱스 추가**

`indexes` 배열에 항목 하나 추가:

```java
@Table(
        name = "xp_events",
        indexes = {
                @Index(name = "idx_xp_events_user_created", columnList = "user_id, created_at"),
                @Index(name = "idx_xp_events_ref", columnList = "ref_type, ref_id"),
                @Index(name = "idx_xp_events_user_type_delta", columnList = "user_id, event_type, delta_xp"),
                @Index(name = "idx_xp_events_created_user_delta", columnList = "created_at, user_id, delta_xp")
        }
)
```

- [ ] **Step 2: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```
기대: BUILD SUCCESSFUL

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/model/entity/XpEvent.java
git commit -m "feat(ranking): xp_events에 기간 집계용 복합 인덱스 추가"
```

---

## Task 2: Caffeine 캐시 설정

**목적:** Top 100 랭킹 보드를 캐싱할 수 있도록 Spring Cache + Caffeine 구성.

**Files:**
- Modify: `backend/build.gradle:21-40`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/config/CacheConfig.java`

- [ ] **Step 1: `build.gradle`에 Caffeine 의존성 추가**

`dependencies` 블록에 두 줄 추가 (`spring-boot-starter-cache` + `caffeine`):

```groovy
    implementation 'org.springframework.boot:spring-boot-starter-cache'
    implementation 'com.github.ben-manes.caffeine:caffeine:3.1.8'
```

- [ ] **Step 2: `CacheConfig.java` 작성**

```java
package me.iamhardyha.bugbuddy.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_RANKING_CURRENT = "rankingCurrent";
    public static final String CACHE_RANKING_PREVIOUS = "rankingPrevious";

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                buildCache(CACHE_RANKING_CURRENT, 5, TimeUnit.MINUTES, 64),
                buildCache(CACHE_RANKING_PREVIOUS, 60, TimeUnit.MINUTES, 64)
        ));
        return manager;
    }

    private CaffeineCache buildCache(String name, long ttl, TimeUnit unit, long maxSize) {
        return new CaffeineCache(name,
                Caffeine.newBuilder()
                        .expireAfterWrite(ttl, unit)
                        .maximumSize(maxSize)
                        .build());
    }
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```
기대: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add backend/build.gradle backend/src/main/java/me/iamhardyha/bugbuddy/config/CacheConfig.java
git commit -m "feat(ranking): Caffeine 기반 랭킹 캐시 설정 추가"
```

---

## Task 3: 랭킹 도메인 enums

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingPeriod.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingOffset.java`

- [ ] **Step 1: `RankingPeriod.java` 작성**

```java
package me.iamhardyha.bugbuddy.ranking;

public enum RankingPeriod {
    ALL,
    WEEKLY,
    MONTHLY
}
```

- [ ] **Step 2: `RankingOffset.java` 작성**

```java
package me.iamhardyha.bugbuddy.ranking;

public enum RankingOffset {
    CURRENT,
    PREVIOUS
}
```

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingPeriod.java \
       backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingOffset.java
git commit -m "feat(ranking): RankingPeriod/RankingOffset enum 추가"
```

---

## Task 4: 랭킹 응답 DTO 3종

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/dto/RankingRowResponse.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/dto/MyRankResponse.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/dto/RankingResponse.java`

- [ ] **Step 1: `RankingRowResponse.java` 작성**

```java
package me.iamhardyha.bugbuddy.ranking.dto;

public record RankingRowResponse(
        int rank,
        Long userId,
        String nickname,
        int level,
        int xp,
        Integer periodXp,
        String bio,
        String mentorStatus,
        long acceptedAnswerCount,
        long answerCount,
        long questionCount,
        boolean isCurrentUser
) {}
```

- [ ] **Step 2: `MyRankResponse.java` 작성**

```java
package me.iamhardyha.bugbuddy.ranking.dto;

public record MyRankResponse(
        int rank,
        int xp,
        Integer periodXp,
        int xpToTop100,
        boolean inTop100,
        long acceptedAnswerCount,
        long answerCount,
        long questionCount
) {}
```

- [ ] **Step 3: `RankingResponse.java` 작성**

```java
package me.iamhardyha.bugbuddy.ranking.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record RankingResponse(
        String period,
        String offset,
        OffsetDateTime rangeStart,
        OffsetDateTime rangeEnd,
        List<RankingRowResponse> topRankings,
        MyRankResponse myRank
) {}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/ranking/dto/
git commit -m "feat(ranking): 랭킹 응답 DTO(RankingResponse/Row/MyRank) 추가"
```

---

## Task 5: RankingQueryRepository — 네이티브 SQL

**목적:** period별 Top 100 조회와 myRank 계산용 네이티브 쿼리를 한 곳에 모은다. `EntityManager` 사용.

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingQueryRepository.java`

- [ ] **Step 1: Repository 클래스 작성**

```java
package me.iamhardyha.bugbuddy.ranking;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Tuple;
import me.iamhardyha.bugbuddy.ranking.dto.RankingRowResponse;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Repository
public class RankingQueryRepository {

    @PersistenceContext
    private EntityManager em;

    /** 전체 누적 랭킹 Top 100 */
    @SuppressWarnings("unchecked")
    public List<RankingRowResponse> findAllTimeTop100() {
        String sql = """
                SELECT u.id AS user_id,
                       u.nickname AS nickname,
                       u.level AS level,
                       u.xp AS xp,
                       u.bio AS bio,
                       u.mentor_status AS mentor_status,
                       (SELECT COUNT(*) FROM answers a
                         WHERE a.author_user_id = u.id
                           AND a.is_accepted = 1
                           AND a.deleted_at IS NULL) AS accepted_cnt,
                       (SELECT COUNT(*) FROM answers a
                         WHERE a.author_user_id = u.id
                           AND a.deleted_at IS NULL) AS answer_cnt,
                       (SELECT COUNT(*) FROM questions q
                         WHERE q.author_user_id = u.id
                           AND q.deleted_at IS NULL) AS question_cnt
                  FROM users u
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                 ORDER BY u.xp DESC, u.id ASC
                 LIMIT 100
                """;
        List<Tuple> rows = em.createNativeQuery(sql, Tuple.class).getResultList();
        return mapRows(rows, false);
    }

    /** 기간 XP 합산 Top 100 (weekly/monthly, 현재/이전) */
    @SuppressWarnings("unchecked")
    public List<RankingRowResponse> findPeriodTop100(LocalDateTime start, LocalDateTime end) {
        String sql = """
                WITH period_xp AS (
                  SELECT user_id, SUM(delta_xp) AS period_xp
                    FROM xp_events
                   WHERE created_at BETWEEN :start AND :end
                   GROUP BY user_id
                  HAVING SUM(delta_xp) > 0
                   ORDER BY period_xp DESC, user_id ASC
                   LIMIT 100
                )
                SELECT u.id AS user_id,
                       u.nickname AS nickname,
                       u.level AS level,
                       u.xp AS xp,
                       p.period_xp AS period_xp,
                       u.bio AS bio,
                       u.mentor_status AS mentor_status,
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
                """;
        List<Tuple> rows = em.createNativeQuery(sql, Tuple.class)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getResultList();
        return mapRows(rows, true);
    }

    /** 전체 랭킹에서 내 순위 (누적 xp 기준). */
    public int countUsersAboveXp(int myXp) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COUNT(*)
                  FROM users u
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                   AND u.xp > :myXp
                """)
                .setParameter("myXp", myXp)
                .getSingleResult();
        return n.intValue();
    }

    /** 100위 유저의 xp (xpToTop100 계산용). 100명 미만이면 null. */
    public Integer findHundredthXp() {
        List<?> rs = em.createNativeQuery("""
                SELECT u.xp
                  FROM users u
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                 ORDER BY u.xp DESC, u.id ASC
                 LIMIT 1 OFFSET 99
                """).getResultList();
        return rs.isEmpty() ? null : ((Number) rs.get(0)).intValue();
    }

    /** 내 기간 XP 합산. */
    public int sumPeriodXp(Long userId, LocalDateTime start, LocalDateTime end) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COALESCE(SUM(delta_xp), 0)
                  FROM xp_events
                 WHERE user_id = :userId
                   AND created_at BETWEEN :start AND :end
                """)
                .setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult();
        return n.intValue();
    }

    /** 기간 랭킹에서 내 순위 (내 기간 XP 이상인 유저 수). */
    public int countUsersAbovePeriodXp(int myPeriodXp, LocalDateTime start, LocalDateTime end) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM (
                  SELECT user_id, SUM(delta_xp) AS s
                    FROM xp_events
                   WHERE created_at BETWEEN :start AND :end
                   GROUP BY user_id
                  HAVING SUM(delta_xp) > :myPeriodXp
                ) t
                  JOIN users u ON u.id = t.user_id
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                """)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .setParameter("myPeriodXp", myPeriodXp)
                .getSingleResult();
        return n.intValue();
    }

    /** 누적 랭킹에서 내 활동 카운트 (accepted/answer/question). */
    public long[] countMyActivityAllTime(Long userId) {
        long accepted = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND is_accepted = 1 AND deleted_at IS NULL
                """).setParameter("userId", userId).getSingleResult()).longValue();
        long answers = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                """).setParameter("userId", userId).getSingleResult()).longValue();
        long questions = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM questions
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                """).setParameter("userId", userId).getSingleResult()).longValue();
        return new long[]{accepted, answers, questions};
    }

    /** 기간 랭킹에서 내 활동 카운트. */
    public long[] countMyActivityInPeriod(Long userId, LocalDateTime start, LocalDateTime end) {
        long accepted = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND is_accepted = 1
                   AND deleted_at IS NULL AND created_at BETWEEN :start AND :end
                """).setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult()).longValue();
        long answers = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                   AND created_at BETWEEN :start AND :end
                """).setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult()).longValue();
        long questions = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM questions
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                   AND created_at BETWEEN :start AND :end
                """).setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult()).longValue();
        return new long[]{accepted, answers, questions};
    }

    private List<RankingRowResponse> mapRows(List<Tuple> rows, boolean hasPeriodXp) {
        List<RankingRowResponse> out = new ArrayList<>(rows.size());
        int rank = 1;
        for (Tuple t : rows) {
            Integer periodXp = hasPeriodXp ? ((Number) t.get("period_xp")).intValue() : null;
            out.add(new RankingRowResponse(
                    rank++,
                    ((Number) t.get("user_id")).longValue(),
                    (String) t.get("nickname"),
                    ((Number) t.get("level")).intValue(),
                    ((Number) t.get("xp")).intValue(),
                    periodXp,
                    (String) t.get("bio"),
                    (String) t.get("mentor_status"),
                    ((Number) t.get("accepted_cnt")).longValue(),
                    ((Number) t.get("answer_cnt")).longValue(),
                    ((Number) t.get("question_cnt")).longValue(),
                    false
            ));
        }
        return Collections.unmodifiableList(out);
    }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingQueryRepository.java
git commit -m "feat(ranking): 네이티브 SQL 기반 RankingQueryRepository 추가"
```

---

## Task 6: RankingService — 기간 계산 + 캐싱 + 오케스트레이션

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingService.java`

- [ ] **Step 1: 서비스 작성**

```java
package me.iamhardyha.bugbuddy.ranking;

import me.iamhardyha.bugbuddy.config.CacheConfig;
import me.iamhardyha.bugbuddy.ranking.dto.MyRankResponse;
import me.iamhardyha.bugbuddy.ranking.dto.RankingResponse;
import me.iamhardyha.bugbuddy.ranking.dto.RankingRowResponse;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class RankingService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final RankingQueryRepository rankingQueryRepository;
    private final UserRepository userRepository;

    public RankingService(RankingQueryRepository rankingQueryRepository,
                          UserRepository userRepository) {
        this.rankingQueryRepository = rankingQueryRepository;
        this.userRepository = userRepository;
    }

    public RankingResponse getRanking(RankingPeriod period, RankingOffset offset, Long currentUserId) {
        if (period == RankingPeriod.ALL) {
            return buildAllRanking(currentUserId);
        }
        return buildPeriodRanking(period, offset, currentUserId);
    }

    // --- 전체 누적 ---

    private RankingResponse buildAllRanking(Long currentUserId) {
        List<RankingRowResponse> top100 = getCachedAllTimeTop100();
        MyRankResponse myRank = computeAllTimeMyRank(currentUserId);
        List<RankingRowResponse> marked = markCurrentUser(top100, currentUserId);
        return new RankingResponse("all", "current", null, null, marked, myRank);
    }

    @Cacheable(cacheNames = CacheConfig.CACHE_RANKING_CURRENT, key = "'all'", sync = true)
    public List<RankingRowResponse> getCachedAllTimeTop100() {
        return rankingQueryRepository.findAllTimeTop100();
    }

    private MyRankResponse computeAllTimeMyRank(Long currentUserId) {
        if (currentUserId == null) return null;
        Optional<UserEntity> me = userRepository.findById(currentUserId);
        if (me.isEmpty()) return null;
        int myXp = me.get().getXp();
        int rank = rankingQueryRepository.countUsersAboveXp(myXp) + 1;
        boolean inTop100 = rank <= 100;
        Integer hundredthXp = rankingQueryRepository.findHundredthXp();
        int xpToTop100 = (hundredthXp == null || myXp >= hundredthXp) ? 0 : (hundredthXp - myXp + 1);
        long[] counts = rankingQueryRepository.countMyActivityAllTime(currentUserId);
        return new MyRankResponse(rank, myXp, null, xpToTop100, inTop100,
                counts[0], counts[1], counts[2]);
    }

    // --- 기간 (주간/월간) ---

    private RankingResponse buildPeriodRanking(RankingPeriod period, RankingOffset offset, Long currentUserId) {
        LocalDateTime[] range = computeRange(period, offset);
        LocalDateTime start = range[0];
        LocalDateTime end = range[1];

        List<RankingRowResponse> top100 = (offset == RankingOffset.PREVIOUS)
                ? getCachedPreviousPeriodTop100(period, start, end)
                : getCachedCurrentPeriodTop100(period, start, end);

        MyRankResponse myRank = computePeriodMyRank(currentUserId, start, end);
        List<RankingRowResponse> marked = markCurrentUser(top100, currentUserId);

        return new RankingResponse(
                period.name().toLowerCase(),
                offset.name().toLowerCase(),
                start.atZone(KST).toOffsetDateTime(),
                end.atZone(KST).toOffsetDateTime(),
                marked,
                myRank
        );
    }

    @Cacheable(cacheNames = CacheConfig.CACHE_RANKING_CURRENT,
               key = "'period-current-' + #period.name()", sync = true)
    public List<RankingRowResponse> getCachedCurrentPeriodTop100(
            RankingPeriod period, LocalDateTime start, LocalDateTime end) {
        return rankingQueryRepository.findPeriodTop100(start, end);
    }

    @Cacheable(cacheNames = CacheConfig.CACHE_RANKING_PREVIOUS,
               key = "'period-prev-' + #period.name() + '-' + #start.toLocalDate()", sync = true)
    public List<RankingRowResponse> getCachedPreviousPeriodTop100(
            RankingPeriod period, LocalDateTime start, LocalDateTime end) {
        return rankingQueryRepository.findPeriodTop100(start, end);
    }

    private MyRankResponse computePeriodMyRank(Long currentUserId, LocalDateTime start, LocalDateTime end) {
        if (currentUserId == null) return null;
        Optional<UserEntity> me = userRepository.findById(currentUserId);
        if (me.isEmpty()) return null;
        int myPeriodXp = rankingQueryRepository.sumPeriodXp(currentUserId, start, end);
        if (myPeriodXp <= 0) return null;
        int rank = rankingQueryRepository.countUsersAbovePeriodXp(myPeriodXp, start, end) + 1;
        boolean inTop100 = rank <= 100;
        long[] counts = rankingQueryRepository.countMyActivityInPeriod(currentUserId, start, end);
        return new MyRankResponse(rank, me.get().getXp(), myPeriodXp, 0, inTop100,
                counts[0], counts[1], counts[2]);
    }

    // --- 기간 경계 계산 ---

    private LocalDateTime[] computeRange(RankingPeriod period, RankingOffset offset) {
        LocalDate today = LocalDate.now(KST);
        LocalDate startDate;
        LocalDate endDate;

        if (period == RankingPeriod.WEEKLY) {
            LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            if (offset == RankingOffset.PREVIOUS) monday = monday.minusWeeks(1);
            startDate = monday;
            endDate = monday.plusDays(6);
        } else { // MONTHLY
            LocalDate first = today.withDayOfMonth(1);
            if (offset == RankingOffset.PREVIOUS) first = first.minusMonths(1);
            startDate = first;
            endDate = first.with(TemporalAdjusters.lastDayOfMonth());
        }
        return new LocalDateTime[]{
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.of(23, 59, 59))
        };
    }

    // --- isCurrentUser 플래그 마킹 ---

    private List<RankingRowResponse> markCurrentUser(List<RankingRowResponse> rows, Long currentUserId) {
        if (currentUserId == null) return rows;
        List<RankingRowResponse> out = new ArrayList<>(rows.size());
        for (RankingRowResponse r : rows) {
            if (r.userId().equals(currentUserId)) {
                out.add(new RankingRowResponse(
                        r.rank(), r.userId(), r.nickname(), r.level(), r.xp(),
                        r.periodXp(), r.bio(), r.mentorStatus(),
                        r.acceptedAnswerCount(), r.answerCount(), r.questionCount(),
                        true
                ));
            } else {
                out.add(r);
            }
        }
        return out;
    }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingService.java
git commit -m "feat(ranking): 기간 경계/캐싱/myRank 오케스트레이션 서비스 추가"
```

---

## Task 7: RankingController

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingController.java`

- [ ] **Step 1: 컨트롤러 작성**

기존 프로젝트에서 로그인 유저 ID를 얻는 패턴(`@AuthenticationPrincipal`)을 따른다. 기존 컨트롤러(예: `FeedController`)를 참고해 정확한 유저 주입 방식을 확인한 뒤 동일하게 적용.

```java
package me.iamhardyha.bugbuddy.ranking;

import me.iamhardyha.bugbuddy.auth.BugBuddyOAuth2User;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.ranking.dto.RankingResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rankings")
public class RankingController {

    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RankingResponse>> getRanking(
            @RequestParam("period") String period,
            @RequestParam(value = "offset", required = false, defaultValue = "current") String offset,
            @AuthenticationPrincipal BugBuddyOAuth2User principal
    ) {
        RankingPeriod periodEnum = parsePeriod(period);
        RankingOffset offsetEnum = parseOffset(offset);
        Long userId = principal != null ? principal.getUserId() : null;
        return ResponseEntity.ok(
                ApiResponse.ok(rankingService.getRanking(periodEnum, offsetEnum, userId))
        );
    }

    private RankingPeriod parsePeriod(String raw) {
        try {
            return RankingPeriod.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("period는 all, weekly, monthly 중 하나여야 합니다");
        }
    }

    private RankingOffset parseOffset(String raw) {
        try {
            return RankingOffset.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("offset은 current 또는 previous여야 합니다");
        }
    }
}
```

- [ ] **Step 2: `BugBuddyOAuth2User` 존재 및 `getUserId()` 시그니처 확인**

```bash
grep -n "class BugBuddyOAuth2User\|getUserId" backend/src/main/java/me/iamhardyha/bugbuddy/auth/BugBuddyOAuth2User.java
```
존재하지 않거나 메서드명이 다르면 실제 프로젝트 패턴(예: `principal.getUser().getId()`)으로 조정.

JWT 기반 API라면 `@AuthenticationPrincipal`이 `BugBuddyOAuth2User`가 아닐 수 있다. 기존 `FeedController`가 로그인 유저를 얻는 방식과 **완전히 동일하게** 맞춘다:

```bash
grep -rn "@AuthenticationPrincipal" backend/src/main/java/me/iamhardyha/bugbuddy/feed/
```

- [ ] **Step 3: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/ranking/RankingController.java
git commit -m "feat(ranking): GET /api/rankings 엔드포인트 추가"
```

---

## Task 8: Security 설정 — /api/rankings 공개 허용

**목적:** 비로그인 유저도 랭킹 리스트는 볼 수 있어야 하므로 `permitAll` 등록.

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/security/SecurityConfig.java` (정확한 파일명은 확인 후 적용)

- [ ] **Step 1: 기존 SecurityConfig 위치 확인**

```bash
find backend/src/main/java -name "SecurityConfig*.java"
```

- [ ] **Step 2: 공개 엔드포인트 매처에 `/api/rankings/**` 추가**

`requestMatchers(...).permitAll()` 체인에 아래를 동일 패턴으로 삽입:

```java
.requestMatchers("/api/rankings/**").permitAll()
```

(기존 `/api/feeds/**` 같은 공개 엔드포인트가 있으면 그 옆에 넣는다.)

- [ ] **Step 3: 빌드 확인**

```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 4: 앱 부팅 + 수동 호출로 검증**

```bash
cd backend && ./gradlew bootRun
```

다른 터미널에서:

```bash
curl -s "http://localhost:8080/api/rankings?period=all" | head -c 500
curl -s "http://localhost:8080/api/rankings?period=weekly&offset=current" | head -c 500
curl -s "http://localhost:8080/api/rankings?period=weekly&offset=previous" | head -c 500
curl -s "http://localhost:8080/api/rankings?period=monthly" | head -c 500
```

기대: 200 응답 + `{"success":true,"data":{...}}`. `topRankings` 배열 확인. 400 에러는 파라미터 오타일 때만 나야 함.

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/security/SecurityConfig.java
git commit -m "feat(ranking): /api/rankings 비로그인 허용 설정"
```

---

## Task 9: 프론트 — lib/rankings.ts

**Files:**
- Create: `frontend/lib/rankings.ts`

- [ ] **Step 1: 타입 + fetch + 인메모리 캐시 작성**

기존 `lib/feeds.ts` 또는 `lib/questions.ts`를 먼저 읽고 baseUrl/fetch 헬퍼 패턴을 그대로 따른다.

```typescript
import { apiGet } from './api';

export type RankingPeriod = 'all' | 'weekly' | 'monthly';
export type RankingOffset = 'current' | 'previous';

export interface RankingRow {
  rank: number;
  userId: number;
  nickname: string;
  level: number;
  xp: number;
  periodXp: number | null;
  bio: string | null;
  mentorStatus: string | null;
  acceptedAnswerCount: number;
  answerCount: number;
  questionCount: number;
  isCurrentUser: boolean;
}

export interface MyRank {
  rank: number;
  xp: number;
  periodXp: number | null;
  xpToTop100: number;
  inTop100: boolean;
  acceptedAnswerCount: number;
  answerCount: number;
  questionCount: number;
}

export interface RankingResponse {
  period: string;
  offset: string;
  rangeStart: string | null;
  rangeEnd: string | null;
  topRankings: RankingRow[];
  myRank: MyRank | null;
}

interface CacheEntry {
  data: RankingResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

function cacheKey(period: RankingPeriod, offset: RankingOffset): string {
  return `${period}:${offset}`;
}

export async function fetchRanking(
  period: RankingPeriod,
  offset: RankingOffset,
  signal?: AbortSignal,
): Promise<RankingResponse> {
  const key = cacheKey(period, offset);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.data;

  const qs = new URLSearchParams({ period, offset });
  const data = await apiGet<RankingResponse>(`/api/rankings?${qs.toString()}`, { signal });
  cache.set(key, { data, expiresAt: now + TTL_MS });
  return data;
}

export function invalidateRankingCache() {
  cache.clear();
}
```

- **`apiGet`** 시그니처가 `(path: string, opts?: { signal?: AbortSignal }) => Promise<T>` 형태가 아니라면 기존 `lib/api.ts` 패턴을 확인해 맞춘다 (fetch 직접 호출 허용).

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/lib/rankings.ts
git commit -m "feat(ranking): 프론트 랭킹 fetch 헬퍼 + 인메모리 캐시 추가"
```

---

## Task 10: globals.css 랭크 토큰

**Files:**
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: `:root`에 라이트 토큰 추가**

`:root { ... }` 블록 안(기존 토큰 옆)에:

```css
  --rank-gold: #f5c518;
  --rank-silver: #b8bcc4;
  --rank-bronze: #cd7f32;
  --rank-row-highlight: rgba(245, 197, 24, 0.08);
```

- [ ] **Step 2: `[data-theme="dark"]`에 다크 토큰 추가**

```css
  --rank-gold: #ffd740;
  --rank-silver: #d0d4dc;
  --rank-bronze: #e39555;
  --rank-row-highlight: rgba(255, 215, 64, 0.1);
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/app/globals.css
git commit -m "feat(ranking): 랭크 메달 색상 CSS 토큰 추가"
```

---

## Task 11: RankingRow 컴포넌트

**Files:**
- Create: `frontend/components/ranking/RankingRow.tsx`
- Create: `frontend/components/ranking/RankingList.module.css`

- [ ] **Step 1: `RankingList.module.css` 작성 (행 + 리스트 공통)**

```css
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--border-base);
  border-radius: 12px;
  background: var(--bg-surface);
  color: inherit;
  text-decoration: none;
  transition: background 0.15s;
}
.row:hover { background: var(--bg-surface-hover); }

.rowTop1, .rowTop2, .rowTop3 {
  background: var(--rank-row-highlight);
}

.rankNumber {
  min-width: 40px;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-muted);
}
.rankGold { color: var(--rank-gold); }
.rankSilver { color: var(--rank-silver); }
.rankBronze { color: var(--rank-bronze); }

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nameRow {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nickname {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.levelBadge {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.bio {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 140px;
}
.xp {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.activity {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 639px) {
  .right { min-width: 100px; }
  .activity { gap: 6px; font-size: 0.75rem; }
  .bio { display: none; }
}
```

- [ ] **Step 2: `RankingRow.tsx` 작성**

```tsx
'use client';

import Link from 'next/link';
import { Avatar, Tag } from 'antd';
import { CheckCircleOutlined, MessageOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { RankingRow as RankingRowData } from '@/lib/rankings';
import styles from './RankingList.module.css';

function rankClass(rank: number): string {
  if (rank === 1) return `${styles.rankNumber} ${styles.rankGold}`;
  if (rank === 2) return `${styles.rankNumber} ${styles.rankSilver}`;
  if (rank === 3) return `${styles.rankNumber} ${styles.rankBronze}`;
  return styles.rankNumber;
}

function rowClass(rank: number): string {
  if (rank === 1) return `${styles.row} ${styles.rowTop1}`;
  if (rank === 2) return `${styles.row} ${styles.rowTop2}`;
  if (rank === 3) return `${styles.row} ${styles.rowTop3}`;
  return styles.row;
}

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇 1';
  if (rank === 2) return '🥈 2';
  if (rank === 3) return '🥉 3';
  return String(rank);
}

interface Props {
  row: RankingRowData;
  showPeriodXp: boolean;
}

export default function RankingRow({ row, showPeriodXp }: Props) {
  const xpValue = showPeriodXp && row.periodXp !== null ? row.periodXp : row.xp;
  const aria = `${row.rank}위, ${row.nickname}, 레벨 ${row.level}, ${xpValue.toLocaleString()} XP, 답변 채택 ${row.acceptedAnswerCount}, 답변 ${row.answerCount}, 질문 ${row.questionCount}`;

  return (
    <Link
      href={`/users/${row.userId}`}
      className={rowClass(row.rank)}
      aria-label={aria}
    >
      <span className={rankClass(row.rank)} aria-hidden="true">
        {rankLabel(row.rank)}
      </span>
      <Avatar size={40} aria-hidden="true">
        {row.nickname.charAt(0).toUpperCase()}
      </Avatar>
      <div className={styles.main}>
        <div className={styles.nameRow}>
          <span className={styles.nickname}>{row.nickname}</span>
          {row.mentorStatus === 'APPROVED' && (
            <Tag color="gold" aria-hidden="true">멘토</Tag>
          )}
          <span className={styles.levelBadge}>Lv.{row.level}</span>
        </div>
        {row.bio && <span className={styles.bio}>{row.bio}</span>}
      </div>
      <div className={styles.right}>
        <span className={styles.xp}>{xpValue.toLocaleString()} XP</span>
        <span className={styles.activity}>
          <span><CheckCircleOutlined aria-hidden="true" /> {row.acceptedAnswerCount}</span>
          <span><MessageOutlined aria-hidden="true" /> {row.answerCount}</span>
          <span><QuestionCircleOutlined aria-hidden="true" /> {row.questionCount}</span>
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/components/ranking/RankingRow.tsx frontend/components/ranking/RankingList.module.css
git commit -m "feat(ranking): RankingRow 컴포넌트 + 스타일 추가"
```

---

## Task 12: RankingMyBanner 컴포넌트

**Files:**
- Create: `frontend/components/ranking/RankingMyBanner.tsx`

- [ ] **Step 1: 배너 작성**

```tsx
'use client';

import { Card, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { MyRank } from '@/lib/rankings';

interface Props {
  myRank: MyRank | null;
  showPeriodXp: boolean;
}

export default function RankingMyBanner({ myRank, showPeriodXp }: Props) {
  if (!myRank) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          이 기간에는 아직 활동 기록이 없어요.
        </Typography.Text>
      </Card>
    );
  }

  const xpLabel = showPeriodXp && myRank.periodXp !== null
    ? `${myRank.periodXp.toLocaleString()} XP`
    : `${myRank.xp.toLocaleString()} XP`;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: 'var(--rank-row-highlight)',
        borderColor: 'var(--rank-gold)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TrophyOutlined style={{ fontSize: 20, color: 'var(--rank-gold)' }} aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <Typography.Text strong>
            내 순위 {myRank.rank.toLocaleString()}위 · {xpLabel}
          </Typography.Text>
          {!myRank.inTop100 && myRank.xpToTop100 > 0 && (
            <Typography.Paragraph
              type="secondary"
              style={{ margin: 0, fontSize: '0.85rem' }}
            >
              Top 100 진입까지 {myRank.xpToTop100.toLocaleString()} XP
            </Typography.Paragraph>
          )}
          {myRank.inTop100 && (
            <Typography.Paragraph
              type="secondary"
              style={{ margin: 0, fontSize: '0.85rem' }}
            >
              Top 100에 진입했어요!
            </Typography.Paragraph>
          )}
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/components/ranking/RankingMyBanner.tsx
git commit -m "feat(ranking): RankingMyBanner 컴포넌트 추가"
```

---

## Task 13: RankingList 컴포넌트 (탭 + 리스트 총괄)

**Files:**
- Create: `frontend/components/ranking/RankingList.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Segmented, Skeleton, Empty, Typography, message } from 'antd';
import RankingRow from './RankingRow';
import RankingMyBanner from './RankingMyBanner';
import { fetchRanking, type RankingPeriod, type RankingOffset, type RankingResponse } from '@/lib/rankings';
import styles from './RankingList.module.css';

function normalizePeriod(raw: string | null): RankingPeriod {
  if (raw === 'weekly' || raw === 'monthly') return raw;
  return 'all';
}

function normalizeOffset(raw: string | null): RankingOffset {
  return raw === 'previous' ? 'previous' : 'current';
}

function formatRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const s = start.slice(0, 10);
  const e = end.slice(0, 10);
  return `${s} ~ ${e}`;
}

export default function RankingList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = normalizePeriod(searchParams.get('scope'));
  const offset = normalizeOffset(searchParams.get('offset'));

  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetchRanking(period, offset, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        message.error('랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        console.error(err);
      });

    return () => controller.abort();
  }, [period, offset]);

  const updateParams = useCallback(
    (next: { scope?: RankingPeriod; offset?: RankingOffset }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.scope) params.set('scope', next.scope);
      if (next.scope === 'all') params.delete('offset');
      else if (next.offset) params.set('offset', next.offset);
      router.replace(`/rankings?${params.toString()}`);
    },
    [router, searchParams],
  );

  const showPeriodXp = period !== 'all';
  const rangeLabel = useMemo(
    () => (data ? formatRange(data.rangeStart, data.rangeEnd) : null),
    [data],
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <Segmented
          value={period}
          onChange={(value) => updateParams({ scope: value as RankingPeriod, offset: 'current' })}
          options={[
            { label: '전체', value: 'all' },
            { label: '주간', value: 'weekly' },
            { label: '월간', value: 'monthly' },
          ]}
          block
        />
        {period !== 'all' && (
          <Segmented
            value={offset}
            onChange={(value) => updateParams({ scope: period, offset: value as RankingOffset })}
            options={[
              { label: '이번', value: 'current' },
              { label: '지난', value: 'previous' },
            ]}
          />
        )}
        {rangeLabel && (
          <Typography.Text type="secondary">기간: {rangeLabel}</Typography.Text>
        )}
      </div>

      {data && <RankingMyBanner myRank={data.myRank} showPeriodXp={showPeriodXp} />}

      {loading && !data && (
        <div className={styles.list}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} active paragraph={{ rows: 1 }} />
          ))}
        </div>
      )}

      {data && data.topRankings.length === 0 && (
        <Empty description="이 기간에는 아직 랭킹이 없어요" />
      )}

      {data && data.topRankings.length > 0 && (
        <div className={styles.list}>
          {data.topRankings.map((row) => (
            <RankingRow key={row.userId} row={row} showPeriodXp={showPeriodXp} />
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/components/ranking/RankingList.tsx
git commit -m "feat(ranking): RankingList 탭/오프셋 컨트롤 + 데이터 fetch 구현"
```

---

## Task 14: /rankings 페이지

**Files:**
- Create: `frontend/app/rankings/page.tsx`

- [ ] **Step 1: 페이지 작성**

기존 페이지(예: `app/feeds/page.tsx`)의 상단 레이아웃 래퍼(`layoutStyles.homeMain`, 배경색 CSS 변수 등)와 동일하게 맞춘다.

```tsx
'use client';

import { Typography } from 'antd';
import RankingList from '@/components/ranking/RankingList';
import layoutStyles from '@/components/common/Layout.module.css';

export default function RankingsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain}>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          랭킹
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          매주/매달 가장 활발한 유저를 확인해 보세요.
        </Typography.Paragraph>
        <RankingList />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/app/rankings/page.tsx
git commit -m "feat(ranking): /rankings 페이지 추가"
```

---

## Task 15: 헤더 내비에 "랭킹" 링크 추가

**Files:**
- Modify: `frontend/components/common/GlobalHeader.tsx:65` (nav 닫는 태그 직전)

- [ ] **Step 1: Mentors 링크 뒤에 Rankings 링크 추가**

```tsx
          <Link
            href="/rankings"
            className={`${styles.navLink}${pathname.startsWith('/rankings') ? ` ${styles.navLinkActive}` : ''}`}
          >
            Rankings
          </Link>
```

- [ ] **Step 2: 모바일 하단 내비(`BottomNav.tsx`) 확인 및 선택적 추가**

```bash
cat frontend/components/common/BottomNav.tsx
```
`BottomNav`에 Q&A/Feed/Mentor 등 주요 섹션이 있으면 Rankings도 동일 패턴으로 추가. 슬롯이 꽉 차 있으면 생략하고 헤더 링크만 유지(접근성은 헤더로 확보됨).

- [ ] **Step 3: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/components/common/GlobalHeader.tsx frontend/components/common/BottomNav.tsx
git commit -m "feat(ranking): 헤더 내비에 랭킹 링크 추가"
```

---

## Task 16: 엔드투엔드 수동 검증

**목적:** 구현이 실제로 동작하는지 브라우저에서 확인. 이 태스크는 코드 변경 없음.

- [ ] **Step 1: 백엔드 실행**

```bash
cd backend && ./gradlew bootRun
```

- [ ] **Step 2: 프론트 실행 (다른 터미널)**

```bash
cd frontend && npm run dev
```

- [ ] **Step 3: 브라우저 체크리스트**

`http://localhost:3000/rankings` 접속 후 다음을 확인:

- [ ] 전체/주간/월간 탭 전환 시 URL에 `?scope=...` 반영
- [ ] 주간/월간에서 이번/지난 토글 동작, URL `&offset=previous` 반영
- [ ] 상위 3위가 금/은/동 강조, 메달 이모지 표시
- [ ] 각 행 클릭 시 `/users/{id}` 이동, 중클릭/cmd+클릭으로 새 탭 열림
- [ ] 닉네임 아래 `bio`가 있으면 노출, 없으면 미노출
- [ ] `mentorStatus=APPROVED` 유저에 "멘토" 태그 표시
- [ ] 로그인 유저: 내 순위 배너 노출, Top 100 밖이면 "진입까지 XX XP"
- [ ] 비로그인: 배너 없이 리스트만 노출
- [ ] 다크모드 토글 시 행/메달/배너 색상 정상
- [ ] 모바일 뷰(639px 이하)에서 `bio` 숨김, 활동 지표 작게 표시
- [ ] 빈 기간 (지난 월 XP 이벤트 없음): "이 기간에는 아직 랭킹이 없어요" 노출
- [ ] 스크린리더: 행 포커스 시 `aria-label` 전체 정보 읽힘

- [ ] **Step 4: 문제 없으면 완료, 문제 있으면 수정 후 재검증**

---

## 체크리스트 (스펙 대비)

- [ ] `/api/rankings?period=all|weekly|monthly&offset=current|previous` 엔드포인트 제공
- [ ] 네이티브 SQL 기반 Top 100 + myRank 산출
- [ ] `Asia/Seoul` 타임존 고정, 주 경계 `MONDAY`
- [ ] `HAVING SUM(delta_xp) > 0`로 음수 XP 유저 제외
- [ ] soft-delete / deactivated / suspended 유저 제외
- [ ] Caffeine 캐시 (현재 5분 / 과거 1시간, `sync=true`)
- [ ] `idx_xp_events_created_user_delta` 인덱스 추가
- [ ] 프론트 URL 파라미터(`scope`, `offset`) 기반 상태 관리
- [ ] 행 `<Link>` + `aria-label` + 메달 `aria-hidden`
- [ ] `globals.css`에 라이트/다크 모두 랭크 토큰 정의
- [ ] 내 순위 배너 (Top 100 안/밖 변형)
- [ ] 빈/로딩/에러 상태 처리
- [ ] 헤더 내비 링크
