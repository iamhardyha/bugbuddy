package me.iamhardyha.bugbuddy.answer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AnswerCreateRequest(
        @NotBlank(message = "답변 내용은 필수입니다.")
        @Size(min = 10, message = "답변은 최소 10자 이상이어야 합니다.")
        String body,

        boolean allowOneToOne,

        List<Long> uploadIds
) {}
