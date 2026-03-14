package me.iamhardyha.bugbuddy.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;

import java.util.List;

public record QuestionUpdateRequest(

        @NotBlank(message = "제목을 입력해주세요.")
        @Size(max = 120, message = "제목은 120자 이하입니다.")
        String title,

        @NotBlank(message = "내용을 입력해주세요.")
        String body,

        @NotNull(message = "카테고리를 선택해주세요.")
        QuestionCategory category,

        @NotNull(message = "질문 유형을 선택해주세요.")
        QuestionType questionType,

        @Size(max = 5, message = "태그는 최대 5개입니다.")
        List<String> tags,

        List<Long> uploadIds
) {
}
