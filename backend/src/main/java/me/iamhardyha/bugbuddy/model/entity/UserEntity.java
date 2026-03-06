package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.*;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.UserRole;

import java.time.Instant;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_nickname", columnNames = {"nickname"}),
                @UniqueConstraint(name = "uk_users_email", columnNames = {"email"}),
                @UniqueConstraint(name = "uk_users_oauth", columnNames = {"oauth_provider", "oauth_subject"})
        },
        indexes = {
                @Index(name = "idx_users_mentor_status", columnList = "mentor_status"),
                @Index(name = "idx_users_xp", columnList = "xp"),
                @Index(name = "idx_users_deactivated", columnList = "deactivated_at"),
                @Index(name = "idx_users_deleted", columnList = "deleted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserEntity extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String email;

    @Column(name = "oauth_provider", length = 50)
    private String oauthProvider;

    @Column(name = "oauth_subject", length = 255)
    private String oauthSubject;

    @Column(nullable = false, length = 40)
    private String nickname;

    @Column(length = 280)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "mentor_status", nullable = false, length = 20)
    @Builder.Default
    private MentorStatus mentorStatus = MentorStatus.NONE;

    @Column(nullable = false)
    @Builder.Default
    private int xp = 0;

    @Column(nullable = false)
    @Builder.Default
    private int level = 1;

    /** 멘토 별점 평균 (멘티 → 멘토). 별점 없으면 null. */
    @Column(name = "mentor_avg_rating", precision = 3, scale = 2)
    private java.math.BigDecimal mentorAvgRating;

    /** 멘토 별점 수 (멘티 → 멘토). */
    @Column(name = "mentor_rating_count", nullable = false)
    @Builder.Default
    private int mentorRatingCount = 0;

    /** 멘티 별점 평균 (멘토 → 멘티). 별점 없으면 null. */
    @Column(name = "mentee_avg_rating", precision = 3, scale = 2)
    private java.math.BigDecimal menteeAvgRating;

    /** 멘티 별점 수 (멘토 → 멘티). */
    @Column(name = "mentee_rating_count", nullable = false)
    @Builder.Default
    private int menteeRatingCount = 0;

    /** 운영자 승인 신고 누적 카운트. */
    @Column(name = "report_count", nullable = false)
    @Builder.Default
    private int reportCount = 0;

    /** 일시정지 기간. null이면 정지 없음. */
    @Column(name = "suspended_until")
    private Instant suspendedUntil;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;
}
