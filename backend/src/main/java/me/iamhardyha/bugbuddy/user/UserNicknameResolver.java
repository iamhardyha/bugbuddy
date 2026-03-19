package me.iamhardyha.bugbuddy.user;

import me.iamhardyha.bugbuddy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserNicknameResolver {

    private final UserRepository userRepository;

    public String resolve(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getNickname())
                .orElse("알 수 없는 사용자");
    }

    public Map<Long, String> resolveAll(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        user -> user.getId(),
                        user -> user.getNickname()
                ));
    }
}
