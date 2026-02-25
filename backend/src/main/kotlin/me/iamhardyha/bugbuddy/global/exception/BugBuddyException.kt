package me.iamhardyha.bugbuddy.global.exception

import me.iamhardyha.bugbuddy.global.response.ErrorCode

class BugBuddyException(val errorCode: ErrorCode) : RuntimeException(errorCode.message)
