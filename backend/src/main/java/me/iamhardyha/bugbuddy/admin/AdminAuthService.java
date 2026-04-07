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

    private static final String DUMMY_HASH = "$2a$10$dummyhashfortimingatk000000000000000000000000000000";

    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminEntity admin = adminRepository.findByLoginId(request.loginId()).orElse(null);

        // 타이밍 어택 방지: 계정이 없어도 동일한 BCrypt 연산 수행
        boolean passwordMatches = passwordEncoder.matches(
                request.password(),
                admin != null ? admin.getPassword() : DUMMY_HASH
        );

        if (admin == null || !passwordMatches) {
            throw new BugBuddyException(ErrorCode.ADMIN_LOGIN_FAILED);
        }

        admin.setLastLoginAt(Instant.now());

        String accessToken = jwtProvider.generateAdminAccessToken(admin.getId());

        return new AdminLoginResponse(accessToken);
    }
}
