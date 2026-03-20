package me.iamhardyha.bugbuddy.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MentorRejectRequest(
        @NotBlank @Size(max = 500) String rejectionReason
) {}
