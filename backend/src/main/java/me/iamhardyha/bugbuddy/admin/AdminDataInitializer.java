package me.iamhardyha.bugbuddy.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.existsByLoginId("admin")) {
            log.info("Admin account already exists, skipping initialization");
            return;
        }

        AdminEntity admin = AdminEntity.builder()
                .loginId("admin")
                .password(passwordEncoder.encode("1234"))
                .name("관리자")
                .build();

        adminRepository.save(admin);
        log.info("Admin account created: loginId=admin");
    }
}
