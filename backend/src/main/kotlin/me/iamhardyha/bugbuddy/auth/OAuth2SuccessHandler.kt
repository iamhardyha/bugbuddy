package me.iamhardyha.bugbuddy.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder

@Component
class OAuth2SuccessHandler(
    private val jwtProvider: JwtProvider,
    @param:Value("\${app.frontend-url}") private val frontendUrl: String,
) : AuthenticationSuccessHandler {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        val principal = authentication.principal as BugBuddyOAuth2User
        val accessToken = jwtProvider.generateAccessToken(principal.userId, principal.role)
        val refreshToken = jwtProvider.generateRefreshToken(principal.userId, principal.role)

        val redirectUrl = UriComponentsBuilder.fromUriString("$frontendUrl/oauth/callback")
            .queryParam("accessToken", accessToken)
            .queryParam("refreshToken", refreshToken)
            .build().toUriString()

        response.sendRedirect(redirectUrl)
    }
}
