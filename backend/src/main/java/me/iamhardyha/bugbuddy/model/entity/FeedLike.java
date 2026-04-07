package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "feed_likes", uniqueConstraints = {
        @UniqueConstraint(name = "uk_feed_likes", columnNames = {"feed_id", "user_id"})
}, indexes = {
        @Index(name = "idx_feed_likes_user_feed", columnList = "user_id, feed_id")
})
@Getter @Setter @NoArgsConstructor
public class FeedLike extends BaseSoftDeleteEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feed_id", nullable = false)
    private Long feedId;

    @Column(name = "user_id", nullable = false)
    private Long userId;
}
