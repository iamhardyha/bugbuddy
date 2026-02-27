package me.iamhardyha.bugbuddy.question.dto;

import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;

import java.time.Instant;
import java.util.List;

public record QuestionDetailResponse(
        Long id,
        Long authorUserId,
        String title,
        String body,
        QuestionCategory category,
        QuestionType questionType,
        QuestionStatus status,
        boolean allowOneToOne,
        int viewCount,
        List<String> tags,
        Instant createdAt,
        Instant updatedAt
) {
    public static QuestionDetailResponse of(Question question, List<String> tags) {
        return new QuestionDetailResponse(
                question.getId(),
                question.getAuthorUserId(),
                question.getTitle(),
                question.getBody(),
                question.getCategory(),
                question.getQuestionType(),
                question.getStatus(),
                question.isAllowOneToOne(),
                question.getViewCount(),
                tags,
                question.getCreatedAt(),
                question.getUpdatedAt()
        );
    }
}
