package me.iamhardyha.bugbuddy.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import me.iamhardyha.bugbuddy.model.enum.UserRole
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtProvider(
    @param:Value("\${app.jwt.secret}") private val secret: String,
    @param:Value("\${app.jwt.access-token-expiration}") private val accessTokenExpiration: Long,
    @param:Value("\${app.jwt.refresh-token-expiration}") private val refreshTokenExpiration: Long,
) {
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray())
    }

    fun generateAccessToken(userId: Long, role: UserRole): String =
        buildToken(userId, role, accessTokenExpiration, "access")

    fun generateRefreshToken(userId: Long, role: UserRole): String =
        buildToken(userId, role, refreshTokenExpiration, "refresh")

    fun validateToken(token: String): Boolean =
        runCatching { getClaims(token) }.isSuccess

    fun getUserId(token: String): Long =
        getClaims(token).subject.toLong()

    fun getRole(token: String): UserRole =
        UserRole.valueOf(getClaims(token).get("role", String::class.java))

    fun getTokenType(token: String): String =
        getClaims(token).get("type", String::class.java)

    private fun buildToken(userId: Long, role: UserRole, expiration: Long, tokenType: String): String {
        val now = Date()
        return Jwts.builder()
            .subject(userId.toString())
            .claim("role", role.name)
            .claim("type", tokenType)
            .issuedAt(now)
            .expiration(Date(now.time + expiration))
            .signWith(key)
            .compact()
    }

    private fun getClaims(token: String): Claims =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
}
