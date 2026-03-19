package me.iamhardyha.bugbuddy.global.util;

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import org.springframework.data.domain.Pageable;

public final class PaginationValidator {

    private static final int MAX_PAGE_SIZE = 100;

    private PaginationValidator() {}

    public static void validate(Pageable pageable) {
        if (pageable.getPageNumber() < 0) {
            throw new BugBuddyException(ErrorCode.INVALID_INPUT);
        }
        if (pageable.getPageSize() < 1 || pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BugBuddyException(ErrorCode.INVALID_INPUT);
        }
    }
}
