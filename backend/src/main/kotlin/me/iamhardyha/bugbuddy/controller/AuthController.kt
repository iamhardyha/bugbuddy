package me.iamhardyha.bugbuddy.controller

import me.iamhardyha.bugbuddy.auth.JwtProvider
import me.iamhardyha.bugbuddy.auth.dto.TokenResponse
import me.iamhardyha.bugbuddy.controller.dto.UserProfileResponse
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException
import me.iamhardyha.bugbuddy.global.response.ApiResponse
import me.iamhardyha.bugbuddy.global.response.ErrorCode
import me.iamhardyha.bugbuddy.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val jwtProvider: JwtProvider,
    private val userService: UserService,
) {

    @PostMapping("/refresh")
    fun refresh(@RequestBody body: Map<String, String>): ResponseEntity<ApiResponse<TokenResponse>> {
        val refreshToken = body["refreshToken"] ?: throw BugBuddyException(ErrorCode.INVALID_INPUT)
        if (!jwtProvider.validateToken(refreshToken) || jwtProvider.getTokenType(refreshToken) != "refresh") {
            throw BugBuddyException(ErrorCode.UNAUTHORIZED)
        }

        val userId = jwtProvider.getUserId(refreshToken)
        val user = userService.findById(userId)
        val newAccessToken = jwtProvider.generateAccessToken(userId, user.role)
        val newRefreshToken = jwtProvider.generateRefreshToken(userId, user.role)

        return ResponseEntity.ok(ApiResponse.ok(TokenResponse(newAccessToken, newRefreshToken)))
    }

    @GetMapping("/me")
    fun me(authentication: Authentication): ResponseEntity<ApiResponse<UserProfileResponse>> {
        val userId = authentication.principal as Long
        val user = userService.findById(userId)
        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(user)))
    }
}
