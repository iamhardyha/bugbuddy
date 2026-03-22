package me.iamhardyha.bugbuddy.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${app.jwt.refresh-token-expiration}") long refreshTokenExpiration
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(Long userId) {
        return buildToken(userId, "user", accessTokenExpiration, "access");
    }

    public String generateRefreshToken(Long userId) {
        return buildToken(userId, "user", refreshTokenExpiration, "refresh");
    }

    public String generateAdminAccessToken(Long adminId) {
        return buildToken(adminId, "admin", accessTokenExpiration, "access");
    }

    public String generateAdminRefreshToken(Long adminId) {
        return buildToken(adminId, "admin", refreshTokenExpiration, "refresh");
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long getUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    public String getJwtType(String token) {
        return getClaims(token).get("jwtType", String.class);
    }

    public String getTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }

    private String buildToken(Long id, String jwtType, long expiration, String tokenType) {
        Date now = new Date();
        return Jwts.builder()
                .subject(id.toString())
                .claim("jwtType", jwtType)
                .claim("type", tokenType)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key)
                .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
