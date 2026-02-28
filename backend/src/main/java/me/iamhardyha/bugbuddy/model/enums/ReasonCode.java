package me.iamhardyha.bugbuddy.model.enums;

public enum ReasonCode {
    SPAM,            // 스팸 / 도배
    ABUSE,           // 욕설 / 비하 발언
    AD,              // 광고 / 홍보성 게시물
    IRRELEVANT,      // 질문/답변과 무관한 내용
    PERSONAL_INFO,   // 개인정보 노출
    LOW_QUALITY,     // 저품질 (하위호환)
    OTHER
}
