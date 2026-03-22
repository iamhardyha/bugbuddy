package me.iamhardyha.bugbuddy.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
    Optional<AdminEntity> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
}
