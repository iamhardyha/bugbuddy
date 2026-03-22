package me.iamhardyha.bugbuddy.admin;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.admin.dto.AdminLoginRequest;
import me.iamhardyha.bugbuddy.admin.dto.AdminLoginResponse;
import me.iamhardyha.bugbuddy.auth.JwtProvider;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminRepository adminRepository;
    private final JwtProvider jwtProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminEntity admin = adminRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ADMIN_LOGIN_FAILED));

        if (!passwordEncoder.matches(request.password(), admin.getPassword())) {
            throw new BugBuddyException(ErrorCode.ADMIN_LOGIN_FAILED);
        }

        admin.setLastLoginAt(Instant.now());

        String accessToken = jwtProvider.generateAdminAccessToken(admin.getId());
        String refreshToken = jwtProvider.generateAdminRefreshToken(admin.getId());

        return new AdminLoginResponse(accessToken, refreshToken);
    }
}
