package me.iamhardyha.bugbuddy.model.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity
import me.iamhardyha.bugbuddy.model.enum.MentorStatus
import me.iamhardyha.bugbuddy.model.enum.UserRole
import java.time.Instant

@Entity
@Table(
    name = "users",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_users_nickname", columnNames = ["nickname"]),
        UniqueConstraint(name = "uk_users_email", columnNames = ["email"]),
        UniqueConstraint(name = "uk_users_oauth", columnNames = ["oauth_provider", "oauth_subject"])
    ],
    indexes = [
        Index(name = "idx_users_mentor_status", columnList = "mentor_status"),
        Index(name = "idx_users_xp", columnList = "xp"),
        Index(name = "idx_users_deactivated", columnList = "deactivated_at"),
        Index(name = "idx_users_deleted", columnList = "deleted_at")
    ]
)
class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = true, length = 255)
    var email: String? = null,

    @Column(name = "oauth_provider", length = 50)
    var oauthProvider: String? = null,

    @Column(name = "oauth_subject", length = 255)
    var oauthSubject: String? = null,

    @Column(nullable = false, length = 40)
    var nickname: String,

    @Column(length = 280)
    var bio: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var role: UserRole = UserRole.USER,

    @Enumerated(EnumType.STRING)
    @Column(name = "mentor_status", nullable = false, length = 20)
    var mentorStatus: MentorStatus = MentorStatus.NONE,

    @Column(nullable = false)
    var xp: Int = 0,

    @Column(nullable = false)
    var level: Int = 1,

    @Column(name = "deactivated_at")
    var deactivatedAt: Instant? = null
) : BaseSoftDeleteEntity()