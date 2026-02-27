package me.iamhardyha.bugbuddy.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final String frontendUrl;

    public OAuth2SuccessHandler(
            JwtProvider jwtProvider,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.jwtProvider = jwtProvider;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        BugBuddyOAuth2User principal = (BugBuddyOAuth2User) authentication.getPrincipal();
        String accessToken = jwtProvider.generateAccessToken(principal.getUserId(), principal.getRole());
        String refreshToken = jwtProvider.generateRefreshToken(principal.getUserId(), principal.getRole());

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }
}
