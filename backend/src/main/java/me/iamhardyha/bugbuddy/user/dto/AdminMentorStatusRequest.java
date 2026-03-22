package me.iamhardyha.bugbuddy.user.dto;

import jakarta.validation.constraints.NotNull;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;

public record AdminMentorStatusRequest(
        @NotNull MentorStatus mentorStatus
) {}
