package me.iamhardyha.bugbuddy.global.exception;

import lombok.Getter;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;

@Getter
public class BugBuddyException extends RuntimeException {

    private final ErrorCode errorCode;

    public BugBuddyException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
