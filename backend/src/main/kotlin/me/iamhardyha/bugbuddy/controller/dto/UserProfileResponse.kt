package me.iamhardyha.bugbuddy.controller.dto

import me.iamhardyha.bugbuddy.model.entity.UserEntity

data class UserProfileResponse(
    val id: Long,
    val nickname: String,
    val email: String?,
    val bio: String?,
    val role: String,
    val mentorStatus: String,
    val xp: Int,
    val level: Int,
) {
    companion object {
        fun from(user: UserEntity) = UserProfileResponse(
            id = user.id!!,
            nickname = user.nickname,
            email = user.email,
            bio = user.bio,
            role = user.role.name,
            mentorStatus = user.mentorStatus.name,
            xp = user.xp,
            level = user.level,
        )
    }
}
