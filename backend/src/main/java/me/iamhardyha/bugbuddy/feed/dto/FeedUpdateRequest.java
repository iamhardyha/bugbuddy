package me.iamhardyha.bugbuddy.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.iamhardyha.bugbuddy.model.enums.FeedCategory;

public record FeedUpdateRequest(
        @NotNull FeedCategory category,
        @NotBlank @Size(max = 2000) String comment
) {}
