package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByOauthProviderAndOauthSubject(String provider, String subject);

    boolean existsByNickname(String nickname);
}
