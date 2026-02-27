package me.iamhardyha.bugbuddy.auth;

import lombok.Getter;
import me.iamhardyha.bugbuddy.model.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@Getter
public class BugBuddyOAuth2User implements OAuth2User {

    private final OAuth2User delegate;
    private final Long userId;
    private final UserRole role;

    public BugBuddyOAuth2User(OAuth2User delegate, Long userId, UserRole role) {
        this.delegate = delegate;
        this.userId = userId;
        this.role = role;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getName() {
        return delegate.getName();
    }
}
