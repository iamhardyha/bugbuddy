package me.iamhardyha.bugbuddy.mentor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MentorApplyRequest(
        @NotEmpty List<@Valid MentorLinkRequest> links,
        @NotBlank @Size(max = 5000) String q1Answer,
        @NotBlank @Size(max = 5000) String q2Answer
) {}
