# 알림 기능 백엔드 설계

## 1. 개요

사용자가 중요한 상호작용을 놓치지 않도록 인앱 알림을 제공한다. MVP에서는 DB 기반 알림 생성 + REST API 조회 구조로 구현하며, 실시간 푸시는 추후 확장한다.

## 2. 아키텍처

### 알림 생성 흐름 (Spring Event 방식)

```
기존 서비스 (AnswerService, ChatRoomService)
  → ApplicationEventPublisher.publishEvent(도메인 이벤트)
    → @TransactionalEventListener(phase = AFTER_COMMIT)
      → NotificationEventListener (try-catch로 예외 격리)
        → NotificationService.create() (@Transactional(propagation = REQUIRES_NEW))
          → NotificationRepository.save()
```

**트랜잭션 정책:**
- `AFTER_COMMIT` 리스너는 원본 트랜잭션 종료 후 실행되므로, `NotificationService.create()`에 `@Transactional(propagation = REQUIRES_NEW)` 적용하여 별도 트랜잭션에서 알림 저장
- 리스너 메서드에서 try-catch로 모든 예외를 잡아 로그만 남김 — 알림 실패가 클라이언트 응답에 영향 없음

**자기 알림 방지:** `triggerUserId == recipientUserId`이면 스킵

**도움됐어요 중복 알림 방지:** 같은 사용자가 같은 답변에 재반응(soft-delete 복원)하는 경우 `triggerUserId + refType + refId + type` 조합으로 기존 알림 존재 여부를 확인하여 중복 생성하지 않음

### 알림 조회 흐름

```
NotificationController (REST API)
  → NotificationService (조회/읽음처리)
    → NotificationRepository (Spring Data JPA)
```

## 3. 엔티티 변경

### Notification 엔티티

기존 필드 유지 + `triggerUserId` 컬럼 추가:

```java
@Column(name = "trigger_user_id", nullable = false)
private Long triggerUserId;  // 알림을 발생시킨 유저
```

**마이그레이션:** 현재 notifications 테이블은 비어 있으므로 (알림 기능 미구현 상태) NOT NULL 컬럼 직접 추가 가능. Hibernate DDL auto-update로 처리.

### NotificationType Enum 추가

```java
CHAT_ACCEPTED,   // 채팅 신청 수락 (NEW)
CHAT_REJECTED    // 채팅 신청 거절 (NEW, 타입만 선언 — 거절 기능 구현 시 연결)
```

## 4. 이벤트 클래스

`notification/event/` 패키지에 도메인 이벤트 정의. 공통 필드를 포함하는 `NotificationEvent` 인터페이스를 정의하고 각 이벤트가 구현:

```java
public interface NotificationEvent {
    Long triggerUserId();
    Long recipientUserId();
    NotificationType notificationType();
    ReferenceType refType();
    Long refId();
}
```

| 이벤트 클래스 | 발행 위치 | 알림 타입 | 수신자 | refType |
|--------------|----------|----------|--------|---------|
| `AnswerCreatedEvent` | AnswerService.create() | ANSWER_CREATED | 질문 작성자 | QUESTION |
| `AnswerHelpfulEvent` | AnswerService.addReaction() | HELPFUL_RECEIVED | 답변 작성자 | ANSWER |
| `AnswerAcceptedEvent` | AnswerService.accept() | ANSWER_ACCEPTED | 답변 작성자 | ANSWER |
| `ChatRequestedEvent` | ChatRoomService.proposeChat() | CHAT_REQUESTED | 멘토 | CHAT_ROOM |
| `ChatAcceptedEvent` | ChatRoomService.acceptChat() | CHAT_ACCEPTED | 멘티 | CHAT_ROOM |

## 5. API 엔드포인트

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/notifications` | 내 알림 목록 (페이징, 최신순) | 필수 |
| GET | `/api/notifications/unread-count` | 읽지 않은 알림 수 (배지용) | 필수 |
| PATCH | `/api/notifications/{id}/read` | 단건 읽음 처리 | 필수 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 처리 | 필수 |

**페이징:** `@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)` — 기존 컨트롤러와 동일

**전체 읽음:** `UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false` — 기존 `idx_notifications_user_read` 인덱스가 커버

**SecurityConfig:** `.anyRequest().authenticated()`가 이미 커버하므로 별도 추가 불필요

## 6. 응답 DTO

```java
public record NotificationResponse(
    Long id,
    NotificationType type,
    ReferenceType refType,
    Long refId,
    String triggerUserNickname,  // 배치 조회
    String targetTitle,          // 항상 관련 질문의 제목으로 해석 (아래 참고)
    boolean isRead,
    Instant createdAt
) {}
```

**`targetTitle` 해석 규칙:**
- `refType = QUESTION` → 해당 질문의 title
- `refType = ANSWER` → 해당 답변이 속한 질문의 title (answers JOIN FETCH question)
- `refType = CHAT_ROOM` → 해당 채팅방의 연결 질문 title (chat_rooms JOIN FETCH question)
- 참조 엔티티가 soft-delete된 경우 → `targetTitle = null` (프론트에서 "삭제된 게시글" 등 fallback 처리)

## 7. 쿼리 최적화 전략

알림 목록 조회 시 배치 패턴 적용 (기존 AnswerService, ChatRoomService와 동일):

```
1) notifications 페이지 조회 (user_id, 최신순)        → 1 쿼리
2) triggerUserIds 수집 → users IN 절 배치 조회         → 1 쿼리
3) refIds를 refType별 그룹핑:
   - QUESTION refIds → questions 배치 조회             → 0~1 쿼리
   - ANSWER refIds → answers JOIN FETCH question 배치  → 0~1 쿼리
   - CHAT_ROOM refIds → chat_rooms JOIN FETCH question → 0~1 쿼리
```

총 3~5 쿼리 고정, 페이지 사이즈와 무관.

## 8. 파일 구조

```
notification/
├── NotificationController.java
├── NotificationService.java
├── NotificationEventListener.java
├── NotificationRepository.java      (notification 패키지 내 배치 — chat 모듈과 동일 패턴)
├── dto/
│   └── NotificationResponse.java
└── event/
    ├── NotificationEvent.java        (공통 인터페이스)
    ├── AnswerCreatedEvent.java
    ├── AnswerHelpfulEvent.java
    ├── AnswerAcceptedEvent.java
    ├── ChatRequestedEvent.java
    └── ChatAcceptedEvent.java
```

## 9. ErrorCode 추가

```java
// 알림
NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."),
NOTIFICATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "알림 접근 권한이 없습니다."),
```

## 10. 미구현 (추후 확장)

- CHAT_REJECTED 알림 트리거 (거절 기능 구현 시)
- 이메일/푸시 알림 채널
- 묶음 알림
- 알림 보관 기간 정책
- 알림 삭제 API
- unread-count 캐싱 최적화 (polling 빈도 높아질 경우)
