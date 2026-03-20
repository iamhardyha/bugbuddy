# 멘토 인증 시스템 백엔드 설계

## 1. 개요

인증 멘토만 1:1 채팅 제안/수락 가능하도록, 멘토 신청 → 관리자 승인 워크플로우를 구현한다. 엔티티(MentorApplication, MentorApplicationLink)와 Enum은 이미 정의되어 있으며, Repository/Service/Controller를 새로 생성한다.

## 2. 엔티티 수정 (선행)

### MentorApplication에 `@SQLRestriction` 추가

현재 엔티티에 `@SQLRestriction("deleted_at IS NULL")`이 누락되어 있음. 프로젝트의 다른 모든 soft-delete 엔티티(`Question`, `Answer`, `Report` 등)와 일관성을 위해 추가 필요.

### unique(user_id) 제약 처리

현재 `@UniqueConstraint(columnNames = {"user_id"})` → DB 레벨에서 soft-delete된 행도 충돌 발생.

**해결:** unique constraint를 제거하고, 애플리케이션 로직에서 "활성 신청 1건" 제약을 enforcing. `@SQLRestriction`이 추가되면 JPA 쿼리가 자동으로 soft-delete 필터링하므로 `findByUserId`로 활성 신청 존재 여부 확인.

## 3. 상태 모델

`MentorApplicationStatus`: **PENDING / APPROVED / REJECTED** (3개)

| 신청 액션 | MentorApplicationStatus | UserEntity.mentorStatus |
|----------|------------------------|------------------------|
| 신청 | PENDING | PENDING |
| 승인 | APPROVED | APPROVED |
| 거절 | REJECTED | NONE (재신청 허용) |

## 4. API 엔드포인트

### 유저용

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/mentor/apply` | 필수 | 멘토 신청 |
| GET | `/api/mentor/apply/me` | 필수 | 내 신청 상태 조회 (없으면 `ApiResponse.ok(null)`) |

### 관리자용

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/mentor/applications` | ADMIN | 신청 목록 (페이징, 상태 필터) |
| GET | `/api/admin/mentor/applications/{id}` | ADMIN | 신청 상세 (신청자 정보 포함) |
| PATCH | `/api/admin/mentor/applications/{id}/approve` | ADMIN | 승인 (body 없음) |
| PATCH | `/api/admin/mentor/applications/{id}/reject` | ADMIN | 거절 (rejectionReason 필수) |

**관리자 목록 쿼리 파라미터:**
- `status` (선택): PENDING / APPROVED / REJECTED 필터. 기본값 없음(전체)
- `page` (기본 0), `size` (기본 20), `sort` (기본 createdAt DESC)

AdminReportController 패턴과 동일.

## 5. 신청 검증 규칙

- 로그인 필수
- `UserEntity.mentorStatus`가 PENDING이면 → `MENTOR_ALREADY_PENDING`
- `UserEntity.mentorStatus`가 APPROVED이면 → `MENTOR_ALREADY_APPROVED`
- 가장 최근 REJECTED 신청의 `reviewedAt + 7일` 이전이면 → `MENTOR_REAPPLY_TOO_EARLY`
- 증빙 링크 최소 1개 필수
- q1Answer, q2Answer 모두 필수 (빈 문자열 불가)

## 6. 신청 처리 흐름

### 신청 (POST /api/mentor/apply) — 단일 `@Transactional`

1. 검증 규칙 통과 확인
2. 기존 REJECTED 신청이 있으면 soft-delete (재신청 시)
3. MentorApplication 생성 (status = PENDING)
4. MentorApplicationLink 다건 저장
5. UserEntity.mentorStatus → PENDING
6. 응답 반환

### 승인 (PATCH .../approve) — 단일 `@Transactional`

1. MentorApplication 조회 (status가 PENDING인지 확인, 아니면 `MENTOR_APPLICATION_NOT_PENDING`)
2. status → APPROVED, reviewerUserId, reviewedAt 설정
3. UserEntity.mentorStatus → APPROVED
4. `MentorApprovedEvent` 발행 (알림 생성)

### 거절 (PATCH .../reject) — 단일 `@Transactional`

1. MentorApplication 조회 (status가 PENDING인지 확인)
2. status → REJECTED, reviewerUserId, reviewedAt, rejectionReason 설정
3. UserEntity.mentorStatus → NONE (재신청 허용)
4. `MentorRejectedEvent` 발행 (알림 생성)

## 7. 거절 후 재신청 정책

- 거절 후 **7일** 대기 필요
- 가장 최근 REJECTED 신청의 `reviewedAt`을 기준으로 체크
- 재신청 시: 기존 REJECTED 신청을 soft-delete → 새 PENDING 신청 생성 (같은 트랜잭션)
- `@SQLRestriction` + unique constraint 제거로 DB 레벨 충돌 없음

## 8. 알림 연동 (Spring Event)

| 이벤트 | 알림 타입 | 수신자 | refType | refId | triggerUserId |
|--------|----------|--------|---------|-------|--------------|
| `MentorApprovedEvent` | MENTOR_APPROVED | 신청자 | USER | 신청자 userId | 관리자 |
| `MentorRejectedEvent` | MENTOR_REJECTED | 신청자 | USER | 신청자 userId | 관리자 |

이벤트는 `notification/event/` 패키지에 배치 (기존 이벤트와 일관성).

`NotificationType`에 `MENTOR_APPROVED`, `MENTOR_REJECTED` 추가.

**NotificationService 수정 필요:**
- `getNotifications()`의 title switch: `case USER -> null;`
- `getNotifications()`의 linkUrl switch: `case USER -> "/settings/profile";`

**자기 알림 방지:** 관리자가 본인 신청을 처리하는 경우(dev 환경) 알림이 생성되지 않음. 의도된 동작이며 프로덕션에서는 발생하지 않음.

## 9. ErrorCode 추가

```java
MENTOR_ALREADY_PENDING(HttpStatus.CONFLICT, "이미 심사 중인 멘토 신청이 있습니다."),
MENTOR_ALREADY_APPROVED(HttpStatus.CONFLICT, "이미 인증 멘토입니다."),
MENTOR_REAPPLY_TOO_EARLY(HttpStatus.BAD_REQUEST, "재신청 대기 기간입니다. 7일 후 다시 시도해주세요."),
MENTOR_APPLICATION_NOT_PENDING(HttpStatus.BAD_REQUEST, "심사 대기 중인 신청이 아닙니다."),
```

기존 `MENTOR_APPLICATION_NOT_FOUND` 유지. `MENTOR_APPLICATION_ALREADY_EXISTS`는 `MENTOR_ALREADY_PENDING`으로 대체하므로 제거.

## 10. DTO

### 요청

```java
public record MentorApplyRequest(
    @NotEmpty List<MentorLinkRequest> links,
    @NotBlank @Size(max = 5000) String q1Answer,
    @NotBlank @Size(max = 5000) String q2Answer
) {}

public record MentorLinkRequest(
    @NotNull MentorApplicationLinkType linkType,
    @NotBlank @Size(max = 500) String url
) {}

public record MentorRejectRequest(
    @NotBlank @Size(max = 500) String rejectionReason
) {}
```

### 응답

```java
public record MentorApplicationResponse(
    Long id,
    MentorApplicationStatus status,
    String q1Answer,
    String q2Answer,
    List<MentorLinkResponse> links,
    String rejectionReason,
    Instant createdAt,
    Instant reviewedAt
) {}

public record MentorLinkResponse(
    MentorApplicationLinkType linkType,
    String url
) {}
```

### 관리자 상세 응답 (신청자 정보 포함)

```java
public record AdminMentorApplicationResponse(
    Long id,
    MentorApplicationStatus status,
    String q1Answer,
    String q2Answer,
    List<MentorLinkResponse> links,
    String rejectionReason,
    Instant createdAt,
    Instant reviewedAt,
    Long applicantUserId,
    String applicantNickname,
    String applicantEmail
) {}
```

## 11. 파일 구조

```
mentor/
├── MentorController.java
├── AdminMentorController.java
├── MentorService.java
├── MentorApplicationRepository.java
├── MentorApplicationLinkRepository.java
└── dto/
    ├── MentorApplyRequest.java
    ├── MentorLinkRequest.java
    ├── MentorRejectRequest.java
    ├── MentorApplicationResponse.java
    ├── MentorLinkResponse.java
    └── AdminMentorApplicationResponse.java

notification/event/                     (기존 패키지에 추가)
    ├── MentorApprovedEvent.java
    └── MentorRejectedEvent.java

수정:
  model/entity/MentorApplication.java   — @SQLRestriction 추가, unique constraint 제거
  model/enums/NotificationType.java     — MENTOR_APPROVED, MENTOR_REJECTED
  global/response/ErrorCode.java        — 4개 추가, 1개 제거
  notification/NotificationService.java — USER refType linkUrl/title 처리
```

## 12. 미구현 (추후 확장)

- 멘토 전문 분야 태그 설정
- 경력 연차 / 기술 스택 선택 입력
- 심사 SLA (N일 이내 처리 알림)
- 평균 별점 기준 재심사 트리거
- 멘토 권한 회수 (REVOKED) — 현재 SUSPENDED로 처리
- URL 형식 검증 (@Pattern)
