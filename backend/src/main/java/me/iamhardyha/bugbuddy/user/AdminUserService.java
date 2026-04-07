package me.iamhardyha.bugbuddy.user;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Report;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.report.ReportRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.user.dto.AdminMentorStatusRequest;
import me.iamhardyha.bugbuddy.user.dto.AdminNicknameRequest;
import me.iamhardyha.bugbuddy.user.dto.AdminSuspendRequest;
import me.iamhardyha.bugbuddy.user.dto.AdminUserDetailResponse;
import me.iamhardyha.bugbuddy.user.dto.AdminUserListResponse;
import me.iamhardyha.bugbuddy.user.dto.AdminXpAdjustRequest;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final XpService xpService;

    public Page<AdminUserListResponse> listUsers(String keyword, MentorStatus mentorStatus,
                                                  Boolean suspended, Pageable pageable) {
        Page<UserEntity> users = userRepository.findAllForAdmin(keyword, mentorStatus, suspended, pageable);
        return users.map(AdminUserListResponse::from);
    }

    public AdminUserDetailResponse getDetail(Long userId) {
        UserEntity user = findUserOrThrow(userId);

        List<Report> reports = reportRepository.findRecentByTargetUserId(userId, PageRequest.of(0, 5));
        List<AdminUserDetailResponse.ReportSummary> reportSummaries = reports.stream()
                .map(r -> new AdminUserDetailResponse.ReportSummary(
                        r.getId(),
                        r.getTargetType().name(),
                        r.getReasonCode().name(),
                        r.getStatus().name(),
                        r.getCreatedAt()
                ))
                .toList();

        return AdminUserDetailResponse.from(user, reportSummaries);
    }

    @Transactional
    public void suspend(Long userId, AdminSuspendRequest request) {
        UserEntity user = findUserOrThrow(userId);
        user.setSuspendedUntil(Instant.now().plus(request.suspendDays(), ChronoUnit.DAYS));
        if (user.getMentorStatus() == MentorStatus.APPROVED) {
            user.setMentorStatus(MentorStatus.SUSPENDED);
        }
    }

    @Transactional
    public void unsuspend(Long userId) {
        UserEntity user = findUserOrThrow(userId);
        if (user.getSuspendedUntil() == null || user.getSuspendedUntil().isBefore(Instant.now())) {
            throw new BugBuddyException(ErrorCode.ADMIN_ALREADY_UNSUSPENDED);
        }
        user.setSuspendedUntil(null);
        if (user.getMentorStatus() == MentorStatus.SUSPENDED) {
            user.setMentorStatus(MentorStatus.APPROVED);
        }
    }

    @Transactional
    public void deactivate(Long userId) {
        UserEntity user = findUserOrThrow(userId);
        user.setDeactivatedAt(Instant.now());
    }

    @Transactional
    public void changeNickname(Long userId, AdminNicknameRequest request) {
        UserEntity user = findUserOrThrow(userId);
        if (userRepository.existsByNickname(request.nickname())) {
            throw new BugBuddyException(ErrorCode.DUPLICATE_NICKNAME);
        }
        user.setNickname(request.nickname());
    }

    @Transactional
    public void adjustXp(Long userId, AdminXpAdjustRequest request) {
        findUserOrThrow(userId);
        xpService.grantXp(userId, XpEventType.ADMIN_ADJUST, ReferenceType.USER, userId, request.deltaXp());
    }

    @Transactional
    public void changeMentorStatus(Long userId, AdminMentorStatusRequest request) {
        UserEntity user = findUserOrThrow(userId);
        user.setMentorStatus(request.mentorStatus());
    }

    private UserEntity findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
    }
}
