package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;

@Entity
@Table(
        name = "tags",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_tags_name", columnNames = {"name"})
        },
        indexes = {
                @Index(name = "idx_tags_official_name", columnList = "is_official, name"),
                @Index(name = "idx_tags_deleted", columnList = "deleted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Tag extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "is_official", nullable = false)
    private boolean official = false;
}
