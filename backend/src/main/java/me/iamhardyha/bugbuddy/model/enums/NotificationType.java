package me.iamhardyha.bugbuddy.model.enums;

public enum NotificationType {
    ANSWER_CREATED,       // 내 질문에 새 답변
    HELPFUL_RECEIVED,     // 내 답변에 도움됐어요
    ANSWER_ACCEPTED,      // 내 답변이 채택됨
    CHAT_REQUESTED,       // 1:1 채팅 신청 (멘토에게)
    CHAT_ACCEPTED,        // 채팅 신청 수락
    CHAT_REJECTED         // 채팅 신청 거절 (타입만 선언, 거절 기능 구현 시 연결)
}
