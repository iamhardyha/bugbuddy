package me.iamhardyha.bugbuddy.auth

class GitHubOAuth2UserInfo(private val attributes: Map<String, Any>) {
    val subject: String
        get() = attributes["id"]?.toString() ?: error("GitHub OAuth2: id missing")

    val email: String?
        get() = attributes["email"] as? String

    val login: String
        get() = attributes["login"] as? String ?: error("GitHub OAuth2: login missing")
}
