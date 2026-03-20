package me.iamhardyha.bugbuddy.mentor.dto;

import me.iamhardyha.bugbuddy.model.entity.MentorApplication;
import me.iamhardyha.bugbuddy.model.entity.MentorApplicationLink;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationStatus;

import java.time.Instant;
import java.util.List;

public record MentorApplicationResponse(
        Long id,
        MentorApplicationStatus status,
        String q1Answer,
        String q2Answer,
        List<MentorLinkResponse> links,
        String rejectionReason,
        Instant createdAt,
        Instant reviewedAt
) {
    public static MentorApplicationResponse of(
            MentorApplication app, List<MentorApplicationLink> links) {
        return new MentorApplicationResponse(
                app.getId(), app.getStatus(),
                app.getQ1Answer(), app.getQ2Answer(),
                links.stream().map(MentorLinkResponse::from).toList(),
                app.getRejectionReason(),
                app.getCreatedAt(), app.getReviewedAt()
        );
    }
}
