package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.FeedCategory;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "tech_feeds", indexes = {
        @Index(name = "idx_feeds_category_created", columnList = "category, created_at"),
        @Index(name = "idx_feeds_author", columnList = "author_user_id, created_at"),
        @Index(name = "idx_feeds_like_count", columnList = "like_count, created_at")
})
@Getter @Setter @NoArgsConstructor
public class TechFeed extends BaseSoftDeleteEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 500)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "og_image_url", length = 500)
    private String ogImageUrl;

    @Column(length = 255)
    private String domain;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FeedCategory category;

    @Column(nullable = false, length = 500)
    private String comment;

    @Column(name = "like_count", nullable = false)
    private int likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    private int commentCount = 0;

    @Column(name = "bookmark_count", nullable = false)
    private int bookmarkCount = 0;
}
