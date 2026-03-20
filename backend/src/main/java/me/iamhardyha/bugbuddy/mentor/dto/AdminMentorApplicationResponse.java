package me.iamhardyha.bugbuddy.mentor.dto;

import me.iamhardyha.bugbuddy.model.entity.MentorApplication;
import me.iamhardyha.bugbuddy.model.entity.MentorApplicationLink;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationStatus;

import java.time.Instant;
import java.util.List;

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
) {
    public static AdminMentorApplicationResponse of(
            MentorApplication app, List<MentorApplicationLink> links, UserEntity user) {
        return new AdminMentorApplicationResponse(
                app.getId(), app.getStatus(),
                app.getQ1Answer(), app.getQ2Answer(),
                links.stream().map(MentorLinkResponse::from).toList(),
                app.getRejectionReason(),
                app.getCreatedAt(), app.getReviewedAt(),
                user.getId(), user.getNickname(), user.getEmail()
        );
    }
}
