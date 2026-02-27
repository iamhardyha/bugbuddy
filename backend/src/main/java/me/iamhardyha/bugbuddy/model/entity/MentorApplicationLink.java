package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.TimestampedEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationLinkType;

@Entity
@Table(
        name = "mentor_application_links",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_mentor_app_links", columnNames = {"mentor_application_id", "link_type", "url"})
        },
        indexes = {
                @Index(name = "idx_mentor_app_links_app", columnList = "mentor_application_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class MentorApplicationLink extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mentor_application_id", nullable = false)
    private Long mentorApplicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false, length = 30)
    private MentorApplicationLinkType linkType;

    @Column(nullable = false, length = 500)
    private String url;
}
