package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.TimestampedEntity;

@Entity
@Table(name = "feed_bookmarks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_feed_bookmarks", columnNames = {"feed_id", "user_id"})
}, indexes = {
        @Index(name = "idx_feed_bookmarks_user", columnList = "user_id, created_at")
})
@Getter @Setter @NoArgsConstructor
public class FeedBookmark extends TimestampedEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feed_id", nullable = false)
    private Long feedId;

    @Column(name = "user_id", nullable = false)
    private Long userId;
}
