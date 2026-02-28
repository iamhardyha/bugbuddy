package me.iamhardyha.bugbuddy.question.dto;

import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;

import java.time.Instant;
import java.util.List;

public record QuestionSummaryResponse(
        Long id,
        Long authorUserId,
        String authorNickname,
        String title,
        QuestionCategory category,
        QuestionType questionType,
        QuestionStatus status,
        boolean allowOneToOne,
        int viewCount,
        List<String> tags,
        Instant createdAt
) {
    public static QuestionSummaryResponse of(Question question, List<String> tags, String authorNickname) {
        return new QuestionSummaryResponse(
                question.getId(),
                question.getAuthorUserId(),
                authorNickname,
                question.getTitle(),
                question.getCategory(),
                question.getQuestionType(),
                question.getStatus(),
                question.isAllowOneToOne(),
                question.getViewCount(),
                tags,
                question.getCreatedAt()
        );
    }
}
