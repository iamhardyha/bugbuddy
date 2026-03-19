package me.iamhardyha.bugbuddy.answer.dto;

import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;

import java.time.Instant;

public record AnswerResponse(
        Long id,
        Long questionId,
        Long authorUserId,
        String authorNickname,
        String body,
        SnapshotRole authorSnapshotRole,
        boolean accepted,
        boolean allowOneToOne,
        long helpfulCount,
        boolean myHelpful,
        Instant createdAt,
        Instant updatedAt
) {
    public static AnswerResponse of(Answer answer, long helpfulCount, boolean myHelpful) {
        return new AnswerResponse(
                answer.getId(),
                answer.getQuestion().getId(),
                answer.getAuthor().getId(),
                answer.getAuthor().getNickname(),
                answer.getBody(),
                answer.getAuthorSnapshotRole(),
                answer.isAccepted(),
                answer.isAllowOneToOne(),
                helpfulCount,
                myHelpful,
                answer.getCreatedAt(),
                answer.getUpdatedAt()
        );
    }
}
