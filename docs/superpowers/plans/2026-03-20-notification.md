# 알림 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spring Event 기반 알림 시스템 구현 — 이벤트 발행 → 리스너 → 알림 저장 + REST API 조회/읽음처리

**Architecture:** 기존 서비스에서 ApplicationEventPublisher로 도메인 이벤트 발행 → @TransactionalEventListener(AFTER_COMMIT)에서 수신 → NotificationService(REQUIRES_NEW)가 알림 저장. 조회는 배치 패턴(3~5 쿼리 고정)으로 N+1 방지.

**Tech Stack:** Spring Boot 3.4.13, Java 21, Spring Data JPA, Lombok, MySQL

**Spec:** `docs/superpowers/specs/2026-03-20-notification-design.md`

---

## 파일 구조

```
신규 생성:
  notification/NotificationController.java
  notification/NotificationService.java
  notification/NotificationEventListener.java
  notification/NotificationRepository.java
  notification/dto/NotificationResponse.java
  notification/event/NotificationEvent.java
  notification/event/AnswerCreatedEvent.java
  notification/event/AnswerHelpfulEvent.java
  notification/event/AnswerAcceptedEvent.java
  notification/event/ChatRequestedEvent.java
  notification/event/ChatAcceptedEvent.java

수정:
  model/entity/Notification.java              — triggerUserId 컬럼 + 중복방지 인덱스 추가
  model/enums/NotificationType.java           — CHAT_ACCEPTED, CHAT_REJECTED 추가
  global/response/ErrorCode.java              — 알림 에러코드 추가
  repository/AnswerRepository.java            — findAllActiveByIds 배치 쿼리 추가
  chat/ChatRoomRepository.java                — findAllActiveByIds 배치 쿼리 추가
  answer/AnswerService.java                   — 이벤트 발행 추가 (create, addReaction, accept)
  chat/ChatRoomService.java                   — 이벤트 발행 추가 (proposeChat, acceptChat)
```

## 태스크 실행 순서

```
Task 1 (엔티티/Enum) → Task 2 (이벤트 클래스) → Task 3 (Repository)
  → Task 4 (DTO) → Task 5 (배치 쿼리) → Task 6 (Service)
  → Task 7 (EventListener) → Task 8 (Controller)
  → Task 9 (이벤트 발행 연결) → Task 10 (빌드 검증)
```

---

### Task 1: 엔티티 & Enum 변경

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/model/entity/Notification.java`
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/model/enums/NotificationType.java`
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/global/response/ErrorCode.java`

- [ ] **Step 1: Notification 엔티티에 triggerUserId 추가 + 중복방지 인덱스 추가**

```java
// Notification.java — @Table indexes 배열에 추가
@Index(name = "idx_notifications_dedup", columnList = "trigger_user_id, ref_type, ref_id, type")

// isRead 필드 아래에 추가
@Column(name = "trigger_user_id", nullable = false)
private Long triggerUserId;
```

마이그레이션: notifications 테이블이 비어있어 NOT NULL 직접 추가 가능 (Hibernate DDL auto-update).

- [ ] **Step 2: NotificationType에 CHAT_ACCEPTED, CHAT_REJECTED 추가**

```java
CHAT_REQUESTED,
CHAT_ACCEPTED,    // 채팅 신청 수락
CHAT_REJECTED     // 채팅 신청 거절 (타입만 선언, 거절 기능 구현 시 연결)
```

- [ ] **Step 3: ErrorCode에 알림 에러코드 추가**

```java
// 알림
NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."),
NOTIFICATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "알림 접근 권한이 없습니다."),
```

- [ ] **Step 4: 빌드 확인**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/model/entity/Notification.java \
       backend/src/main/java/me/iamhardyha/bugbuddy/model/enums/NotificationType.java \
       backend/src/main/java/me/iamhardyha/bugbuddy/global/response/ErrorCode.java
git commit -m "feat(notification): 엔티티 triggerUserId 추가, Enum/ErrorCode 확장"
```

---

### Task 2: 이벤트 인터페이스 & 이벤트 클래스

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/NotificationEvent.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/AnswerCreatedEvent.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/AnswerHelpfulEvent.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/AnswerAcceptedEvent.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/ChatRequestedEvent.java`
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/ChatAcceptedEvent.java`

- [ ] **Step 1: NotificationEvent 인터페이스 생성**

```java
package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public interface NotificationEvent {
    Long triggerUserId();
    Long recipientUserId();
    NotificationType notificationType();
    ReferenceType refType();
    Long refId();
}
```

- [ ] **Step 2: 5개 이벤트 record 생성**

각 이벤트는 `NotificationEvent` 인터페이스를 구현하는 Java record:

```java
// AnswerCreatedEvent.java
package me.iamhardyha.bugbuddy.notification.event;

import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

public record AnswerCreatedEvent(
        Long triggerUserId,
        Long recipientUserId,
        Long refId
) implements NotificationEvent {
    @Override public NotificationType notificationType() { return NotificationType.ANSWER_CREATED; }
    @Override public ReferenceType refType() { return ReferenceType.QUESTION; }
}
```

동일 패턴으로:
- `AnswerHelpfulEvent` — `NotificationType.HELPFUL_RECEIVED`, `ReferenceType.ANSWER`
- `AnswerAcceptedEvent` — `NotificationType.ANSWER_ACCEPTED`, `ReferenceType.ANSWER`
- `ChatRequestedEvent` — `NotificationType.CHAT_REQUESTED`, `ReferenceType.CHAT_ROOM`
- `ChatAcceptedEvent` — `NotificationType.CHAT_ACCEPTED`, `ReferenceType.CHAT_ROOM`

- [ ] **Step 3: 빌드 확인**

Run: `cd backend && ./gradlew compileJava`

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/me/iamhardyha/bugbuddy/notification/event/
git commit -m "feat(notification): 도메인 이벤트 인터페이스 및 5개 이벤트 클래스"
```

---

### Task 3: NotificationRepository

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationRepository.java`

- [ ] **Step 1: Repository 생성**

```java
package me.iamhardyha.bugbuddy.notification;

import me.iamhardyha.bugbuddy.model.entity.Notification;
import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId);

    boolean existsByTriggerUserIdAndRefTypeAndRefIdAndType(
            Long triggerUserId, ReferenceType refType, Long refId, NotificationType type);
}
```

- [ ] **Step 2: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationRepository.java
git commit -m "feat(notification): NotificationRepository — 조회, 읽음처리, 중복확인"
```

---

### Task 4: NotificationResponse DTO

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/dto/NotificationResponse.java`

- [ ] **Step 1: DTO 생성**

```java
package me.iamhardyha.bugbuddy.notification.dto;

import me.iamhardyha.bugbuddy.model.entity.Notification;
import me.iamhardyha.bugbuddy.model.enums.NotificationType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        ReferenceType refType,
        Long refId,
        String triggerUserNickname,
        String targetTitle,
        boolean isRead,
        Instant createdAt
) {
    public static NotificationResponse of(
            Notification n, String triggerUserNickname, String targetTitle) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getRefType(), n.getRefId(),
                triggerUserNickname, targetTitle,
                n.isRead(), n.getCreatedAt()
        );
    }
}
```

- [ ] **Step 2: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/notification/dto/NotificationResponse.java
git commit -m "feat(notification): NotificationResponse DTO"
```

---

### Task 5: Repository 배치 쿼리 추가 (targetTitle 조회용)

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/repository/AnswerRepository.java`
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/chat/ChatRoomRepository.java`

- [ ] **Step 1: AnswerRepository에 배치 조회 메서드 추가**

`@SQLRestriction`이 자동으로 soft-delete 필터링하므로 JPQL에 `deletedAt IS NULL` 불필요:

```java
@Query("SELECT a FROM Answer a JOIN FETCH a.question WHERE a.id IN :ids")
List<Answer> findAllActiveByIds(@Param("ids") List<Long> ids);
```

- [ ] **Step 2: ChatRoomRepository에 배치 조회 메서드 추가**

```java
@Query("SELECT r FROM ChatRoom r LEFT JOIN FETCH r.question WHERE r.id IN :ids")
List<ChatRoom> findAllActiveByIds(@Param("ids") List<Long> ids);
```

- [ ] **Step 3: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/repository/AnswerRepository.java \
       backend/src/main/java/me/iamhardyha/bugbuddy/chat/ChatRoomRepository.java
git commit -m "feat(notification): 배치 조회 쿼리 추가 (Answer, ChatRoom)"
```

---

### Task 6: NotificationService

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationService.java`

- [ ] **Step 1: Service 생성**

**주입 의존성:** `NotificationRepository`, `UserRepository`, `QuestionRepository`, `AnswerRepository`, `ChatRoomRepository`

```java
package me.iamhardyha.bugbuddy.notification;

import me.iamhardyha.bugbuddy.chat.ChatRoomRepository;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.*;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.notification.dto.NotificationResponse;
import me.iamhardyha.bugbuddy.notification.event.NotificationEvent;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ChatRoomRepository chatRoomRepository;

    /** 알림 생성 — REQUIRES_NEW로 별도 트랜잭션. 자기알림/중복 방지. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void create(NotificationEvent event) {
        // 자기 알림 방지
        if (event.triggerUserId().equals(event.recipientUserId())) {
            return;
        }

        // 중복 알림 방지 (도움됐어요 재반응 등)
        boolean exists = notificationRepository.existsByTriggerUserIdAndRefTypeAndRefIdAndType(
                event.triggerUserId(), event.refType(), event.refId(), event.notificationType());
        if (exists) {
            return;
        }

        Notification notification = new Notification();
        notification.setUserId(event.recipientUserId());
        notification.setType(event.notificationType());
        notification.setRefType(event.refType());
        notification.setRefId(event.refId());
        notification.setTriggerUserId(event.triggerUserId());
        notificationRepository.save(notification);
    }

    /** 내 알림 목록 조회 — 배치 패턴으로 N+1 방지 (3~5 쿼리 고정). */
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);

        if (notifications.isEmpty()) {
            return notifications.map(n -> NotificationResponse.of(n, null, null));
        }

        // 1. triggerUser 닉네임 배치 조회
        Set<Long> triggerUserIds = notifications.stream()
                .map(Notification::getTriggerUserId)
                .collect(Collectors.toSet());
        Map<Long, String> nicknameMap = userRepository.findAllById(triggerUserIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getNickname));

        // 2. refIds를 refType별로 그룹핑
        Map<ReferenceType, List<Long>> refIdsByType = notifications.stream()
                .collect(Collectors.groupingBy(
                        Notification::getRefType,
                        Collectors.mapping(Notification::getRefId, Collectors.toList())));

        // 3. targetTitle 배치 조회
        Map<Long, String> titleMap = new HashMap<>();

        // QUESTION
        List<Long> questionIds = refIdsByType.getOrDefault(ReferenceType.QUESTION, List.of());
        if (!questionIds.isEmpty()) {
            questionRepository.findAllById(questionIds)
                    .forEach(q -> titleMap.put(q.getId(), q.getTitle()));
        }

        // ANSWER → question title
        List<Long> answerIds = refIdsByType.getOrDefault(ReferenceType.ANSWER, List.of());
        if (!answerIds.isEmpty()) {
            answerRepository.findAllActiveByIds(answerIds)
                    .forEach(a -> titleMap.put(a.getId(), a.getQuestion().getTitle()));
        }

        // CHAT_ROOM → question title
        List<Long> chatRoomIds = refIdsByType.getOrDefault(ReferenceType.CHAT_ROOM, List.of());
        if (!chatRoomIds.isEmpty()) {
            chatRoomRepository.findAllActiveByIds(chatRoomIds)
                    .forEach(r -> {
                        String title = r.getQuestion() != null ? r.getQuestion().getTitle() : null;
                        titleMap.put(r.getId(), title);
                    });
        }

        // 4. 메모리 조합
        return notifications.map(n -> NotificationResponse.of(
                n,
                nicknameMap.get(n.getTriggerUserId()),
                titleMap.get(n.getRefId())
        ));
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!notification.getUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.NOTIFICATION_ACCESS_DENIED);
        }

        notification.setRead(true);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
```

- [ ] **Step 2: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationService.java
git commit -m "feat(notification): NotificationService — 알림 생성, 배치 조회, 읽음처리"
```

---

### Task 7: NotificationEventListener

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationEventListener.java`

- [ ] **Step 1: 이벤트 리스너 생성**

```java
package me.iamhardyha.bugbuddy.notification;

import me.iamhardyha.bugbuddy.notification.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(NotificationEvent event) {
        try {
            notificationService.create(event);
        } catch (Exception e) {
            log.error("알림 생성 실패: type={}, triggerUser={}, recipient={}, ref={}/{}",
                    event.notificationType(), event.triggerUserId(),
                    event.recipientUserId(), event.refType(), event.refId(), e);
        }
    }
}
```

Spring Framework 6.2+ (Boot 3.4.13)에서는 인터페이스 타입 리스너가 구현체 이벤트를 모두 수신함.

- [ ] **Step 2: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationEventListener.java
git commit -m "feat(notification): 이벤트 리스너 — AFTER_COMMIT, try-catch 예외 격리"
```

---

### Task 8: NotificationController

**Files:**
- Create: `backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationController.java`

- [ ] **Step 1: Controller 생성**

```java
package me.iamhardyha.bugbuddy.notification;

import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<NotificationResponse> response = notificationService.getNotifications(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal Long userId
    ) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal Long userId
    ) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
```

- [ ] **Step 2: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/notification/NotificationController.java
git commit -m "feat(notification): REST API 4개 엔드포인트"
```

---

### Task 9: 기존 서비스에 이벤트 발행 연결

**Files:**
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/answer/AnswerService.java`
- Modify: `backend/src/main/java/me/iamhardyha/bugbuddy/chat/ChatRoomService.java`

- [ ] **Step 1: AnswerService에 ApplicationEventPublisher 주입**

AnswerService는 **명시적 생성자 주입** 방식 사용 (line 46-60). 생성자에 파라미터 추가:

```java
// 필드 추가
private final ApplicationEventPublisher eventPublisher;

// 생성자 파라미터에 추가
public AnswerService(
        AnswerRepository answerRepository,
        AnswerReactionRepository answerReactionRepository,
        QuestionRepository questionRepository,
        UserRepository userRepository,
        UploadService uploadService,
        XpService xpService,
        ApplicationEventPublisher eventPublisher   // ← 추가
) {
    // ... 기존 할당
    this.eventPublisher = eventPublisher;
}
```

- [ ] **Step 2: AnswerService 3곳에 이벤트 발행 추가**

```java
// create() 메서드 — return 직전 (line 88 부근)
eventPublisher.publishEvent(new AnswerCreatedEvent(userId, question.getAuthor().getId(), questionId));

// addReaction() 메서드 — xpService.grantXp() 이후 (line 223 부근)
eventPublisher.publishEvent(new AnswerHelpfulEvent(userId, answer.getAuthor().getId(), answerId));

// accept() 메서드 — xpService.grantXp() 이후 (line 187 부근)
eventPublisher.publishEvent(new AnswerAcceptedEvent(userId, answer.getAuthor().getId(), answerId));
```

- [ ] **Step 3: ChatRoomService에 ApplicationEventPublisher 주입**

ChatRoomService는 `@RequiredArgsConstructor` 사용. 필드만 추가하면 자동 주입:

```java
private final ApplicationEventPublisher eventPublisher;
```

- [ ] **Step 4: ChatRoomService 2곳에 이벤트 발행 추가**

```java
// proposeChat() — return 직전 (line 70 부근)
eventPublisher.publishEvent(new ChatRequestedEvent(menteeUserId, mentor.getId(), saved.getId()));

// acceptChat() — return 직전 (line 99 부근)
eventPublisher.publishEvent(new ChatAcceptedEvent(mentorUserId, room.getMentee().getId(), roomId));
```

- [ ] **Step 5: 빌드 확인 & 커밋**

```bash
cd backend && ./gradlew compileJava
git add backend/src/main/java/me/iamhardyha/bugbuddy/answer/AnswerService.java \
       backend/src/main/java/me/iamhardyha/bugbuddy/chat/ChatRoomService.java
git commit -m "feat(notification): 기존 서비스에 이벤트 발행 연결 (Answer 3곳, Chat 2곳)"
```

---

### Task 10: 전체 빌드 검증

- [ ] **Step 1: 전체 빌드**

Run: `cd backend && ./gradlew clean build -x test`
Expected: BUILD SUCCESSFUL

- [ ] **Step 2: 서버 기동 확인 (선택)**

Run: `cd backend && ./gradlew bootRun` 으로 정상 기동 확인 후 종료

- [ ] **Step 3: Obsidian 문서 업데이트**

구현 완료 내용으로 `Obsidian Vault/develop/logos/backend/알림 기능 설계.md` 상태를 "구현 완료"로 갱신
