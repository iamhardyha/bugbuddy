package me.iamhardyha.bugbuddy.controller;

import me.iamhardyha.bugbuddy.auth.JwtProvider;
import me.iamhardyha.bugbuddy.auth.dto.TokenResponse;
import me.iamhardyha.bugbuddy.controller.dto.UserProfileResponse;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtProvider jwtProvider;
    private final UserService userService;

    public AuthController(JwtProvider jwtProvider, UserService userService) {
        this.jwtProvider = jwtProvider;
        this.userService = userService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null) throw new BugBuddyException(ErrorCode.INVALID_INPUT);
        if (!jwtProvider.validateToken(refreshToken) || !"refresh".equals(jwtProvider.getTokenType(refreshToken))) {
            throw new BugBuddyException(ErrorCode.UNAUTHORIZED);
        }

        Long userId = jwtProvider.getUserId(refreshToken);
        UserEntity user = userService.findById(userId);
        String newAccessToken = jwtProvider.generateAccessToken(userId, user.getRole());
        String newRefreshToken = jwtProvider.generateRefreshToken(userId, user.getRole());

        return ResponseEntity.ok(ApiResponse.ok(new TokenResponse(newAccessToken, newRefreshToken)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        UserEntity user = userService.findById(userId);
        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(user)));
    }
}
