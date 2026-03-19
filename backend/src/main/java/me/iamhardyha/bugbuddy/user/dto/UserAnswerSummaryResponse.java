package me.iamhardyha.bugbuddy.user.dto;

import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;

import java.time.Instant;

public record UserAnswerSummaryResponse(
        Long id,
        Long questionId,
        String body,
        SnapshotRole authorSnapshotRole,
        boolean accepted,
        long helpfulCount,
        Instant createdAt
) {
    public static UserAnswerSummaryResponse of(Answer answer, long helpfulCount) {
        String preview = answer.getBody().length() > 200
                ? answer.getBody().substring(0, 200) + "..."
                : answer.getBody();
        return new UserAnswerSummaryResponse(
                answer.getId(),
                answer.getQuestion().getId(),
                preview,
                answer.getAuthorSnapshotRole(),
                answer.isAccepted(),
                helpfulCount,
                answer.getCreatedAt()
        );
    }
}
