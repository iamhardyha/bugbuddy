package me.iamhardyha.bugbuddy.report.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.iamhardyha.bugbuddy.model.enums.ReasonCode;
import me.iamhardyha.bugbuddy.model.enums.ReportTargetType;

public record ReportCreateRequest(
        @NotNull ReportTargetType targetType,
        @NotNull Long targetId,
        @NotNull ReasonCode reasonCode,
        @Size(max = 500) String reasonDetail
) {}
