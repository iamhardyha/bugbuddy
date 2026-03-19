package me.iamhardyha.bugbuddy.report;

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Report;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.ReportStatus;
import me.iamhardyha.bugbuddy.model.enums.ReportTargetType;
import me.iamhardyha.bugbuddy.report.dto.AdminResolveRequest;
import me.iamhardyha.bugbuddy.report.dto.ReportCreateRequest;
import me.iamhardyha.bugbuddy.report.dto.ReportResponse;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.chat.ChatMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ReportService(ReportRepository reportRepository,
                         UserRepository userRepository,
                         QuestionRepository questionRepository,
                         AnswerRepository answerRepository,
                         ChatMessageRepository chatMessageRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    /** 신고 접수. */
    @Transactional
    public ReportResponse createReport(Long reporterUserId, ReportCreateRequest request) {
        // 자기 자신 신고 방지 (USER 타입)
        if (request.targetType() == ReportTargetType.USER
                && request.targetId().equals(reporterUserId)) {
            throw new BugBuddyException(ErrorCode.REPORT_SELF);
        }

        // 중복 신고 방지
        if (reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(
                reporterUserId, request.targetType(), request.targetId())) {
            throw new BugBuddyException(ErrorCode.REPORT_DUPLICATE);
        }

        Report report = new Report();
        report.setReporterUserId(reporterUserId);
        report.setTargetType(request.targetType());
        report.setTargetId(request.targetId());
        report.setReasonCode(request.reasonCode());
        report.setReasonDetail(request.reasonDetail());
        report.setStatus(ReportStatus.OPEN);

        return ReportResponse.from(reportRepository.save(report));
    }

    /** 관리자 — 신고 목록 조회. status가 null이면 전체 조회. */
    public Page<ReportResponse> listReports(ReportStatus status, Pageable pageable) {
        if (status != null) {
            return reportRepository.findAllByStatus(status, pageable).map(ReportResponse::from);
        }
        return reportRepository.findAllActive(pageable).map(ReportResponse::from);
    }

    /** 관리자 — 검토 시작 (OPEN → REVIEWING). */
    @Transactional
    public ReportResponse reviewReport(Long reportId, Long adminUserId) {
        Report report = findActiveReport(reportId);
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BugBuddyException(ErrorCode.REPORT_NOT_RESOLVABLE);
        }
        report.setStatus(ReportStatus.REVIEWING);
        return ReportResponse.from(report);
    }

    /** 관리자 — 신고 처리 완료 (REVIEWING → RESOLVED). 제재 포함. */
    @Transactional
    public ReportResponse resolveReport(Long reportId, Long adminUserId, AdminResolveRequest request) {
        Report report = findActiveReport(reportId);
        if (report.getStatus() != ReportStatus.REVIEWING) {
            throw new BugBuddyException(ErrorCode.REPORT_NOT_RESOLVABLE);
        }

        report.setStatus(ReportStatus.RESOLVED);
        report.setResolvedAt(Instant.now());
        report.setResolverUserId(adminUserId);

        // 피신고자 식별 및 제재
        Long targetUserId = resolveTargetUserId(report.getTargetType(), report.getTargetId());
        if (targetUserId != null) {
            UserEntity targetUser = userRepository.findById(targetUserId)
                    .orElse(null);
            if (targetUser != null) {
                targetUser.setReportCount(targetUser.getReportCount() + 1);
                if (request.suspend() && request.suspendDays() > 0) {
                    Instant suspendUntil = Instant.now().plusSeconds((long) request.suspendDays() * 86400);
                    targetUser.setSuspendedUntil(suspendUntil);
                    if (targetUser.getMentorStatus() == MentorStatus.APPROVED) {
                        targetUser.setMentorStatus(MentorStatus.SUSPENDED);
                    }
                }
            }
        }

        return ReportResponse.from(report);
    }

    /** 관리자 — 신고 기각 (OPEN/REVIEWING → REJECTED). */
    @Transactional
    public ReportResponse rejectReport(Long reportId, Long adminUserId) {
        Report report = findActiveReport(reportId);
        if (report.getStatus() == ReportStatus.RESOLVED
                || report.getStatus() == ReportStatus.REJECTED) {
            throw new BugBuddyException(ErrorCode.REPORT_NOT_RESOLVABLE);
        }

        report.setStatus(ReportStatus.REJECTED);
        report.setResolvedAt(Instant.now());
        report.setResolverUserId(adminUserId);

        return ReportResponse.from(report);
    }

    private Report findActiveReport(Long reportId) {
        return reportRepository.findById(reportId)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.REPORT_NOT_FOUND));
    }

    private Long resolveTargetUserId(ReportTargetType targetType, Long targetId) {
        return switch (targetType) {
            case QUESTION -> questionRepository.findActiveById(targetId)
                    .map(q -> q.getAuthorUserId())
                    .orElse(null);
            case ANSWER -> answerRepository.findActiveById(targetId)
                    .map(a -> a.getAuthorUserId())
                    .orElse(null);
            case CHAT_MESSAGE -> chatMessageRepository.findById(targetId)
                    .filter(m -> !m.isDeleted())
                    .map(m -> m.getSenderUserId())
                    .orElse(null);
            case USER -> targetId;
        };
    }
}
