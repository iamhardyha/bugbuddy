package me.iamhardyha.bugbuddy.auth

import me.iamhardyha.bugbuddy.model.entity.UserEntity
import me.iamhardyha.bugbuddy.repository.UserRepository
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CustomOAuth2UserService(
    private val userRepository: UserRepository,
) : DefaultOAuth2UserService() {

    @Transactional
    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
        val oAuth2User = super.loadUser(userRequest)
        val userInfo = GitHubOAuth2UserInfo(oAuth2User.attributes)

        val user = userRepository.findByOauthProviderAndOauthSubject("github", userInfo.subject)
            .orElseGet { createUser(userInfo) }

        user.email = userInfo.email ?: user.email

        return BugBuddyOAuth2User(oAuth2User, user.id!!, user.role)
    }

    private fun createUser(userInfo: GitHubOAuth2UserInfo): UserEntity {
        val nickname = generateUniqueNickname(userInfo.login)
        return userRepository.save(
            UserEntity(
                oauthProvider = "github",
                oauthSubject = userInfo.subject,
                email = userInfo.email,
                nickname = nickname,
            )
        )
    }

    private fun generateUniqueNickname(base: String): String {
        val sanitized = base.take(30)
        if (!userRepository.existsByNickname(sanitized)) return sanitized
        repeat(10) {
            val candidate = "$sanitized${(1000..9999).random()}"
            if (!userRepository.existsByNickname(candidate)) return candidate
        }
        return "$sanitized${System.currentTimeMillis() % 10000}"
    }
}
