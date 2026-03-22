package me.iamhardyha.bugbuddy.auth;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        GitHubOAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(oAuth2User.getAttributes());

        UserEntity user = userRepository.findByOauthProviderAndOauthSubject("github", userInfo.getSubject())
                .orElseGet(() -> createUser(userInfo));

        if (userInfo.getEmail() != null) {
            user.setEmail(userInfo.getEmail());
        }

        return new BugBuddyOAuth2User(oAuth2User, user.getId());
    }

    private UserEntity createUser(GitHubOAuth2UserInfo userInfo) {
        String nickname = generateUniqueNickname(userInfo.getLogin());
        UserEntity user = UserEntity.builder()
                .oauthProvider("github")
                .oauthSubject(userInfo.getSubject())
                .email(userInfo.getEmail())
                .nickname(nickname)
                .build();
        return userRepository.save(user);
    }

    private String generateUniqueNickname(String base) {
        String sanitized = base.length() > 30 ? base.substring(0, 30) : base;
        if (!userRepository.existsByNickname(sanitized)) return sanitized;
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            String candidate = sanitized + (1000 + random.nextInt(9000));
            if (!userRepository.existsByNickname(candidate)) return candidate;
        }
        return sanitized + (System.currentTimeMillis() % 10000);
    }
}
