package me.iamhardyha.bugbuddy.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationLinkType;

public record MentorLinkRequest(
        @NotNull MentorApplicationLinkType linkType,
        @NotBlank @Size(max = 500) String url
) {}
