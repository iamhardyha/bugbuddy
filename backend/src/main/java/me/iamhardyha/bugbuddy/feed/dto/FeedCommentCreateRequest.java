package me.iamhardyha.bugbuddy.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FeedCommentCreateRequest(
        @NotBlank @Size(max = 2000) String body
) {}
