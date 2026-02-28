package me.iamhardyha.bugbuddy.answer.dto;

import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;

import java.time.Instant;

public record AnswerResponse(
        Long id,
        Long questionId,
        Long authorUserId,
        String body,
        SnapshotRole authorSnapshotRole,
        boolean accepted,
        long helpfulCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static AnswerResponse of(Answer answer, long helpfulCount) {
        return new AnswerResponse(
                answer.getId(),
                answer.getQuestionId(),
                answer.getAuthorUserId(),
                answer.getBody(),
                answer.getAuthorSnapshotRole(),
                answer.isAccepted(),
                helpfulCount,
                answer.getCreatedAt(),
                answer.getUpdatedAt()
        );
    }
}
