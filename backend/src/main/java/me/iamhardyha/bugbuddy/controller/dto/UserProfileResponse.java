package me.iamhardyha.bugbuddy.controller.dto;

import lombok.Getter;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;

@Getter
public class UserProfileResponse {

    private final Long id;
    private final String nickname;
    private final String email;
    private final String bio;
    private final String role;
    private final String mentorStatus;
    private final int xp;
    private final int level;

    private UserProfileResponse(UserEntity user) {
        this.id = user.getId();
        this.nickname = user.getNickname();
        this.email = user.getEmail();
        this.bio = user.getBio();
        this.role = user.getRole().name();
        this.mentorStatus = user.getMentorStatus().name();
        this.xp = user.getXp();
        this.level = user.getLevel();
    }

    public static UserProfileResponse from(UserEntity user) {
        return new UserProfileResponse(user);
    }
}
