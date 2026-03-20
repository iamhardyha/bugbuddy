# 테크피드 백엔드 설계

## 1. 개요

외부 기술 아티클 URL을 공유하는 큐레이션 피드. OG 메타 자동 파싱 + 추천/북마크/댓글. 기존 Q&A와 독립적인 새 도메인.

## 2. 데이터 모델

### TechFeed (새 엔티티)

```java
@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "tech_feeds", indexes = {
    @Index(name = "idx_feeds_category_created", columnList = "category, created_at"),
    @Index(name = "idx_feeds_author", columnList = "author_user_id, created_at"),
    @Index(name = "idx_feeds_like_count", columnList = "like_count, created_at")
})
public class TechFeed extends BaseSoftDeleteEntity {
    Long id;
    Long authorUserId;
    String url;               // NOT NULL, 500
    String title;             // OG title, nullable
    String description;       // OG description, nullable
    String ogImageUrl;        // OG image, nullable
    String domain;            // 추출된 도메인 (blog.example.com)
    FeedCategory category;    // NOT NULL
    String comment;           // 추천 이유, NOT NULL, 500
    int likeCount = 0;        // 비정규화 카운트
    int commentCount = 0;
    int bookmarkCount = 0;
}
```

### FeedComment (새 엔티티)

```java
@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "feed_comments", indexes = {
    @Index(name = "idx_feed_comments_feed", columnList = "feed_id, created_at")
})
public class FeedComment extends BaseSoftDeleteEntity {
    Long id;
    Long feedId;
    Long authorUserId;
    String body;              // 텍스트 전용, NOT NULL, 2000
}
```

### FeedLike (새 엔티티)

```java
@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "feed_likes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_feed_likes", columnNames = {"feed_id", "user_id"})
})
public class FeedLike extends BaseSoftDeleteEntity {
    Long id;
    Long feedId;
    Long userId;
}
```

### FeedBookmark (새 엔티티 — soft-delete 없음, 즉시 삭제)

```java
@Entity
@Table(name = "feed_bookmarks", uniqueConstraints = {
    @UniqueConstraint(name = "uk_feed_bookmarks", columnNames = {"feed_id", "user_id"})
}, indexes = {
    @Index(name = "idx_feed_bookmarks_user", columnList = "user_id, created_at")
})
public class FeedBookmark extends TimestampedEntity {
    Long id;
    Long feedId;
    Long userId;
}
```

## 3. FeedCategory Enum

```java
public enum FeedCategory {
    FRONTEND, BACKEND, DEVOPS, MOBILE, AI,
    OPEN_SOURCE, TREND, TOOLS, TUTORIAL, CAREER, ETC
}
```

## 4. API 엔드포인트

### 피드 CRUD

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/feeds` | 필수 | 피드 등록 (URL + 카테고리 + 추천 이유) |
| GET | `/api/feeds` | 선택 | 피드 목록 (페이징, 카테고리 필터, 정렬) |
| GET | `/api/feeds/{id}` | 선택 | 피드 상세 |
| DELETE | `/api/feeds/{id}` | 필수 | 피드 삭제 (본인만, soft-delete) |

**목록 쿼리 파라미터:**
- `category` (선택): FeedCategory 필터
- `sort` (기본 `createdAt`): `createdAt` / `likeCount`
- `page` (기본 0), `size` (기본 20)

### 추천 (Like)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/feeds/{id}/like` | 필수 | 추천 (likeCount +1) |
| DELETE | `/api/feeds/{id}/like` | 필수 | 추천 취소 (likeCount -1) |

AnswerReaction 패턴과 동일: **find-and-restore 방식**(새 row insert가 아닌 soft-deleted row 복원). unique constraint + soft-delete 충돌 방지를 위해 native query로 삭제된 레코드 포함 조회 → `deletedAt = null` 복원 → likeCount 업데이트.

### 북마크

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/feeds/{id}/bookmark` | 필수 | 북마크 추가 |
| DELETE | `/api/feeds/{id}/bookmark` | 필수 | 북마크 제거 (hard-delete) |
| GET | `/api/feeds/bookmarks` | 필수 | 내 북마크 목록 (페이징) |

### 댓글

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/feeds/{id}/comments` | 필수 | 댓글 작성 (텍스트 전용) |
| GET | `/api/feeds/{id}/comments` | 선택 | 댓글 목록 (페이징, 오래된순) |
| DELETE | `/api/feeds/{id}/comments/{commentId}` | 필수 | 댓글 삭제 (본인만) |

## 5. OG 메타 파싱

피드 등록 시 서버에서 URL을 HTTP GET → HTML 파싱:
- `og:title` → title
- `og:description` → description
- `og:image` → ogImageUrl
- URL에서 domain 추출: `new URL(url).getHost()`

**구현:** Jsoup 라이브러리 사용 (`connect(url).get()` → `select("meta[property=og:title]")`).

**타임아웃:** 3초. 파싱 실패 시 title/description/ogImageUrl = null, domain만 추출.

**SSRF 방지 (필수):**
1. URL 스킴 화이트리스트: `http://`, `https://`만 허용. `file://`, `ftp://` 등 거부.
2. DNS 해석 후 IP 검증: private/reserved 대역 거부 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`)
3. 리다이렉트 비활성화: `Jsoup.connect(url).followRedirects(false)`
4. 응답 크기 제한: `maxBodySize(1_000_000)` (1MB)
5. `OgMetaParser`에 URL 검증 로직을 내장하여 파싱 전 체크

**비동기 처리 여부:** MVP에서는 동기 처리 (등록 시 약간 느릴 수 있지만 단순). 추후 비동기 + 캐시 고려.

## 6. 알림 연동

NotificationType 추가:
- `FEED_LIKED` — 내 피드에 추천
- `FEED_COMMENTED` — 내 피드에 댓글

ReferenceType 추가:
- `FEED` — 테크피드 참조

NotificationService linkUrl: `case FEED -> "/feeds/" + refId;`

XpEventType 추가:
- `FEED_CREATED` (+3 XP)
- `FEED_LIKED_RECEIVED` (+2 XP)

## 7. 신고 연동

ReferenceType에 `FEED`, `FEED_COMMENT` 추가. 기존 신고 시스템 그대로 사용.

## 8. ErrorCode 추가

```java
FEED_NOT_FOUND(HttpStatus.NOT_FOUND, "피드를 찾을 수 없습니다."),
FEED_FORBIDDEN(HttpStatus.FORBIDDEN, "피드 삭제 권한이 없습니다."),
FEED_ALREADY_LIKED(HttpStatus.CONFLICT, "이미 추천한 피드입니다."),
FEED_LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "추천 기록을 찾을 수 없습니다."),
FEED_ALREADY_BOOKMARKED(HttpStatus.CONFLICT, "이미 북마크한 피드입니다."),
FEED_BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "북마크를 찾을 수 없습니다."),
FEED_COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
FEED_COMMENT_FORBIDDEN(HttpStatus.FORBIDDEN, "댓글 삭제 권한이 없습니다."),
FEED_OG_PARSE_FAILED(HttpStatus.BAD_REQUEST, "URL에서 정보를 가져올 수 없습니다."),
FEED_SELF_LIKE(HttpStatus.BAD_REQUEST, "자신의 피드는 추천할 수 없습니다."),
```

## 9. DTO

### 요청
```java
FeedCreateRequest { url, category, comment }
FeedCommentCreateRequest { body }
```

### 응답
```java
FeedResponse { id, authorUserId, authorNickname, url, title, description,
               ogImageUrl, domain, category, comment, likeCount, commentCount,
               bookmarkCount, myLiked, myBookmarked, createdAt }
FeedCommentResponse { id, authorUserId, authorNickname, body, createdAt }
```

## 10. 파일 구조

```
feed/
├── FeedController.java
├── FeedService.java
├── FeedRepository.java
├── FeedCommentRepository.java
├── FeedLikeRepository.java
├── FeedBookmarkRepository.java
├── OgMetaParser.java               (Jsoup OG 파싱 유틸)
├── dto/
│   ├── FeedCreateRequest.java
│   ├── FeedCommentCreateRequest.java
│   ├── FeedResponse.java
│   └── FeedCommentResponse.java
└── event/
    ├── FeedLikedEvent.java
    └── FeedCommentedEvent.java

model/entity/
├── TechFeed.java
├── FeedComment.java
├── FeedLike.java
└── FeedBookmark.java

model/enums/
└── FeedCategory.java

수정:
  model/enums/NotificationType.java    — FEED_LIKED, FEED_COMMENTED
  model/enums/ReferenceType.java       — FEED, FEED_COMMENT
  model/enums/XpEventType.java         — FEED_CREATED, FEED_LIKED_RECEIVED
  global/response/ErrorCode.java       — 10개 추가
  notification/NotificationService.java — FEED refType linkUrl 처리
  config/SecurityConfig.java           — /api/feeds GET permitAll
  build.gradle                         — Jsoup 의존성 추가
```

## 11. SecurityConfig

```java
.requestMatchers(HttpMethod.GET, "/api/feeds", "/api/feeds/**").permitAll()
```
피드 목록/상세/댓글 조회는 비로그인도 가능. 등록/추천/북마크/댓글 작성은 인증 필수.

## 12. 의존성 추가

```groovy
// build.gradle
implementation 'org.jsoup:jsoup:1.18.3'
```

## 13. 미구현 (추후 확장)

- 중복 URL 방지 (같은 URL 재등록 차단)
- OG 파싱 비동기 처리 + 캐시
- 피드 수정 기능
- 댓글 수정 기능
- 인기 피드 큐레이션 (주간/월간)
- 프론트엔드 (별도 사이클)
