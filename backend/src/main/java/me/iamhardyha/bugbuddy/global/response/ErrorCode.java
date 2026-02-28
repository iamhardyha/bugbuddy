package me.iamhardyha.bugbuddy.global.response;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다."),

    // 유저
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),

    // 질문
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "질문을 찾을 수 없습니다."),
    QUESTION_FORBIDDEN(HttpStatus.FORBIDDEN, "질문 수정/삭제 권한이 없습니다."),
    QUESTION_ALREADY_CLOSED(HttpStatus.BAD_REQUEST, "이미 마감된 질문입니다."),
    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "태그를 찾을 수 없습니다."),

    // 답변
    ANSWER_NOT_FOUND(HttpStatus.NOT_FOUND, "답변을 찾을 수 없습니다."),
    ANSWER_FORBIDDEN(HttpStatus.FORBIDDEN, "답변 수정/삭제 권한이 없습니다."),
    ANSWER_ACCEPT_FORBIDDEN(HttpStatus.FORBIDDEN, "답변 채택은 질문 작성자만 가능합니다."),
    ANSWER_SELF_REACTION(HttpStatus.BAD_REQUEST, "자신의 답변에는 반응할 수 없습니다."),
    ANSWER_REACTION_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 반응한 답변입니다."),
    ANSWER_REACTION_NOT_FOUND(HttpStatus.NOT_FOUND, "반응을 찾을 수 없습니다."),
    QUESTION_ALREADY_SOLVED(HttpStatus.BAD_REQUEST, "이미 채택된 답변이 있는 질문입니다."),

    // 채팅
    CHAT_ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."),
    CHAT_ROOM_ACCESS_DENIED(HttpStatus.FORBIDDEN, "채팅방 접근 권한이 없습니다."),

    // 멘토 신청
    MENTOR_APPLICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "멘토 신청을 찾을 수 없습니다."),
    MENTOR_APPLICATION_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 멘토 신청이 존재합니다."),

    // 신고
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고를 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
