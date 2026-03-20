package me.iamhardyha.bugbuddy.mentor.dto;

import me.iamhardyha.bugbuddy.model.entity.MentorApplicationLink;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationLinkType;

public record MentorLinkResponse(
        MentorApplicationLinkType linkType,
        String url
) {
    public static MentorLinkResponse from(MentorApplicationLink link) {
        return new MentorLinkResponse(link.getLinkType(), link.getUrl());
    }
}
