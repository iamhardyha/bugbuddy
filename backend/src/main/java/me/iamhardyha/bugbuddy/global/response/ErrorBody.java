package me.iamhardyha.bugbuddy.global.response;

import lombok.Getter;

@Getter
public class ErrorBody {

    private final String code;
    private final String message;

    public ErrorBody(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
