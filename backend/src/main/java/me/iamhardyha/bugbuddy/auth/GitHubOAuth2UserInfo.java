package me.iamhardyha.bugbuddy.auth;

import java.util.Map;

public class GitHubOAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GitHubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public String getSubject() {
        Object id = attributes.get("id");
        if (id == null) throw new IllegalStateException("GitHub OAuth2: id missing");
        return id.toString();
    }

    public String getEmail() {
        Object email = attributes.get("email");
        return email instanceof String ? (String) email : null;
    }

    public String getLogin() {
        Object login = attributes.get("login");
        if (!(login instanceof String)) throw new IllegalStateException("GitHub OAuth2: login missing");
        return (String) login;
    }
}
