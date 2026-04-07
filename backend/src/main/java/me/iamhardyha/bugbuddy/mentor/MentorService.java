package me.iamhardyha.bugbuddy.mentor;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.mentor.dto.AdminMentorApplicationResponse;
import me.iamhardyha.bugbuddy.mentor.dto.MentorApplicationResponse;
import me.iamhardyha.bugbuddy.mentor.dto.MentorApplyRequest;
import me.iamhardyha.bugbuddy.mentor.dto.MentorRejectRequest;
import me.iamhardyha.bugbuddy.model.entity.MentorApplication;
import me.iamhardyha.bugbuddy.model.entity.MentorApplicationLink;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationStatus;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.notification.event.MentorApprovedEvent;
import me.iamhardyha.bugbuddy.notification.event.MentorRejectedEvent;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorService {

    private final MentorApplicationRepository mentorApplicationRepository;
    private final MentorApplicationLinkRepository mentorApplicationLinkRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MentorApplicationResponse apply(Long userId, MentorApplyRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));

        if (user.getMentorStatus() == MentorStatus.PENDING) {
            throw new BugBuddyException(ErrorCode.MENTOR_ALREADY_PENDING);
        }
        if (user.getMentorStatus() == MentorStatus.APPROVED) {
            throw new BugBuddyException(ErrorCode.MENTOR_ALREADY_APPROVED);
        }

        // 7일 재신청 대기 체크
        mentorApplicationRepository.findLatestRejected(userId).ifPresent(rejected -> {
            if (rejected.getReviewedAt() != null
                    && rejected.getReviewedAt().plus(7, ChronoUnit.DAYS).isAfter(Instant.now())) {
                throw new BugBuddyException(ErrorCode.MENTOR_REAPPLY_TOO_EARLY);
            }
        });

        // 기존 활성 신청이 있으면 soft-delete (재신청 시)
        mentorApplicationRepository.findByUserId(userId).ifPresent(existing -> existing.softDelete());

        // 신청 생성
        MentorApplication app = new MentorApplication();
        app.setUserId(userId);
        app.setStatus(MentorApplicationStatus.PENDING);
        app.setQ1Answer(request.q1Answer());
        app.setQ2Answer(request.q2Answer());
        MentorApplication saved = mentorApplicationRepository.save(app);

        // 링크 저장
        List<MentorApplicationLink> links = request.links().stream().map(linkReq -> {
            MentorApplicationLink link = new MentorApplicationLink();
            link.setMentorApplicationId(saved.getId());
            link.setLinkType(linkReq.linkType());
            link.setUrl(linkReq.url());
            return link;
        }).toList();
        List<MentorApplicationLink> savedLinks = mentorApplicationLinkRepository.saveAll(links);

        // 유저 상태 변경
        user.setMentorStatus(MentorStatus.PENDING);

        return MentorApplicationResponse.of(saved, savedLinks);
    }

    public MentorApplicationResponse getMyApplication(Long userId) {
        return mentorApplicationRepository.findByUserId(userId)
                .map(app -> {
                    List<MentorApplicationLink> links =
                            mentorApplicationLinkRepository.findAllByMentorApplicationId(app.getId());
                    return MentorApplicationResponse.of(app, links);
                })
                .orElse(null);
    }

    public Page<AdminMentorApplicationResponse> getApplications(
            MentorApplicationStatus status, Pageable pageable) {
        Page<MentorApplication> page = (status != null)
                ? mentorApplicationRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable)
                : mentorApplicationRepository.findAllByOrderByCreatedAtDesc(pageable);

        if (page.isEmpty()) {
            return page.map(app -> AdminMentorApplicationResponse.of(app, List.of(), null));
        }

        // N+1 방지: batch user + batch links 조회
        List<Long> userIds = page.stream().map(MentorApplication::getUserId).distinct().toList();
        Map<Long, UserEntity> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        List<Long> appIds = page.stream().map(MentorApplication::getId).toList();
        Map<Long, List<MentorApplicationLink>> linksMap = mentorApplicationLinkRepository
                .findAllByMentorApplicationIdIn(appIds).stream()
                .collect(Collectors.groupingBy(MentorApplicationLink::getMentorApplicationId));

        return page.map(app -> {
            List<MentorApplicationLink> links = linksMap.getOrDefault(app.getId(), List.of());
            UserEntity user = userMap.get(app.getUserId());
            return AdminMentorApplicationResponse.of(app, links, user);
        });
    }

    public AdminMentorApplicationResponse getApplicationDetail(Long applicationId) {
        MentorApplication app = mentorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.MENTOR_APPLICATION_NOT_FOUND));
        List<MentorApplicationLink> links =
                mentorApplicationLinkRepository.findAllByMentorApplicationId(applicationId);
        UserEntity user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
        return AdminMentorApplicationResponse.of(app, links, user);
    }

    @Transactional
    public void approve(Long applicationId, Long adminUserId) {
        MentorApplication app = mentorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.MENTOR_APPLICATION_NOT_FOUND));

        if (app.getStatus() != MentorApplicationStatus.PENDING) {
            throw new BugBuddyException(ErrorCode.MENTOR_APPLICATION_NOT_PENDING);
        }

        app.setStatus(MentorApplicationStatus.APPROVED);
        app.setReviewerUserId(adminUserId);
        app.setReviewedAt(Instant.now());

        UserEntity user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
        user.setMentorStatus(MentorStatus.APPROVED);

        eventPublisher.publishEvent(new MentorApprovedEvent(adminUserId, app.getUserId(), app.getId()));
    }

    @Transactional
    public void reject(Long applicationId, Long adminUserId, MentorRejectRequest request) {
        MentorApplication app = mentorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.MENTOR_APPLICATION_NOT_FOUND));

        if (app.getStatus() != MentorApplicationStatus.PENDING) {
            throw new BugBuddyException(ErrorCode.MENTOR_APPLICATION_NOT_PENDING);
        }

        app.setStatus(MentorApplicationStatus.REJECTED);
        app.setReviewerUserId(adminUserId);
        app.setReviewedAt(Instant.now());
        app.setRejectionReason(request.rejectionReason());

        UserEntity user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
        user.setMentorStatus(MentorStatus.NONE);

        eventPublisher.publishEvent(new MentorRejectedEvent(adminUserId, app.getUserId(), app.getId()));
    }
}
