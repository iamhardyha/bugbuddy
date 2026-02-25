package me.iamhardyha.bugbuddy.auth

import me.iamhardyha.bugbuddy.model.enum.UserRole
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.user.OAuth2User

class BugBuddyOAuth2User(
    private val delegate: OAuth2User,
    val userId: Long,
    val role: UserRole,
) : OAuth2User by delegate {

    override fun getAuthorities(): Collection<GrantedAuthority> =
        listOf(SimpleGrantedAuthority("ROLE_${role.name}"))
}
