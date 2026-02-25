package me.iamhardyha.bugbuddy.repository

import me.iamhardyha.bugbuddy.model.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByOauthProviderAndOauthSubject(provider: String, subject: String): Optional<UserEntity>
    fun existsByNickname(nickname: String): Boolean
}
