package me.iamhardyha.bugbuddy.user.dto;

public record UserStatsResponse(
        long questionCount,
        long answerCount,
        long helpfulReceivedCount,
        long acceptedAnswerCount
) {
    public static UserStatsResponse of(long questionCount, long answerCount,
                                       long helpfulReceivedCount, long acceptedAnswerCount) {
        return new UserStatsResponse(questionCount, answerCount, helpfulReceivedCount, acceptedAnswerCount);
    }
}
