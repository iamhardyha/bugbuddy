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
    CHAT_ROOM_NOT_PENDING(HttpStatus.BAD_REQUEST, "수락 대기 중인 채팅방이 아닙니다."),
    CHAT_ROOM_NOT_OPEN(HttpStatus.BAD_REQUEST, "진행 중인 채팅방이 아닙니다."),
    CHAT_ROOM_DUPLICATE(HttpStatus.CONFLICT, "이미 동일한 멘토/멘티/질문 조합의 채팅방이 존재합니다."),
    CHAT_ANSWER_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "1:1 멘토링이 허용되지 않은 답변입니다."),
    CHAT_NOT_QUESTION_AUTHOR(HttpStatus.FORBIDDEN, "질문 작성자만 채팅을 신청할 수 있습니다."),
    CHAT_FEEDBACK_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 피드백을 제출했습니다."),

    // 멘토 신청
    MENTOR_APPLICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "멘토 신청을 찾을 수 없습니다."),
    MENTOR_ALREADY_PENDING(HttpStatus.CONFLICT, "이미 심사 중인 멘토 신청이 있습니다."),
    MENTOR_ALREADY_APPROVED(HttpStatus.CONFLICT, "이미 인증 멘토입니다."),
    MENTOR_REAPPLY_TOO_EARLY(HttpStatus.BAD_REQUEST, "재신청 대기 기간입니다. 7일 후 다시 시도해주세요."),
    MENTOR_APPLICATION_NOT_PENDING(HttpStatus.BAD_REQUEST, "심사 대기 중인 신청이 아닙니다."),

    // 신고
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고를 찾을 수 없습니다."),
    REPORT_SELF(HttpStatus.BAD_REQUEST, "자기 자신은 신고할 수 없습니다."),
    REPORT_DUPLICATE(HttpStatus.CONFLICT, "이미 신고한 대상입니다."),
    REPORT_NOT_RESOLVABLE(HttpStatus.BAD_REQUEST, "처리할 수 없는 신고 상태입니다."),

    // 파일 업로드
    UPLOAD_NOT_FOUND(HttpStatus.NOT_FOUND, "업로드 파일을 찾을 수 없습니다."),
    UPLOAD_INVALID_TYPE(HttpStatus.BAD_REQUEST, "허용되지 않는 파일 형식입니다. (jpeg, png, gif, webp만 허용)"),
    UPLOAD_FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "파일 크기가 초과되었습니다."),
    UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),

    // 알림
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."),
    NOTIFICATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "알림 접근 권한이 없습니다."),

    // 테크피드
    FEED_NOT_FOUND(HttpStatus.NOT_FOUND, "피드를 찾을 수 없습니다."),
    FEED_FORBIDDEN(HttpStatus.FORBIDDEN, "피드 삭제 권한이 없습니다."),
    FEED_ALREADY_LIKED(HttpStatus.CONFLICT, "이미 추천한 피드입니다."),
    FEED_LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "추천 기록을 찾을 수 없습니다."),
    FEED_ALREADY_BOOKMARKED(HttpStatus.CONFLICT, "이미 북마크한 피드입니다."),
    FEED_BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "북마크를 찾을 수 없습니다."),
    FEED_COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    FEED_COMMENT_FORBIDDEN(HttpStatus.FORBIDDEN, "댓글 삭제 권한이 없습니다."),
    FEED_OG_PARSE_FAILED(HttpStatus.BAD_REQUEST, "URL에서 정보를 가져올 수 없습니다."),
    FEED_SELF_LIKE(HttpStatus.BAD_REQUEST, "자신의 피드는 추천할 수 없습니다."),

    // 관리자
    ADMIN_NOT_FOUND(HttpStatus.NOT_FOUND, "관리자를 찾을 수 없습니다."),
    ADMIN_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 일치하지 않습니다."),
    ADMIN_CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "관리 대상 콘텐츠를 찾을 수 없습니다."),
    ADMIN_ALREADY_UNSUSPENDED(HttpStatus.BAD_REQUEST, "이미 정지 해제된 사용자입니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
