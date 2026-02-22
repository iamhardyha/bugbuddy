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
import me.iamhardyha.bugbuddy.model.common.TimestampedEntity
import me.iamhardyha.bugbuddy.model.enum.MentorApplicationLinkType

@Entity
@Table(
    name = "mentor_application_links",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_mentor_app_links", columnNames = ["mentor_application_id", "link_type", "url"])
    ],
    indexes = [
        Index(name = "idx_mentor_app_links_app", columnList = "mentor_application_id")
    ]
)
class MentorApplicationLink(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "mentor_application_id", nullable = false)
    var mentorApplicationId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false, length = 30)
    var linkType: MentorApplicationLinkType,

    @Column(nullable = false, length = 500)
    var url: String
) : TimestampedEntity()