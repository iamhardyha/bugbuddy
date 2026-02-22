package me.iamhardyha.bugbuddy.model.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity

@Entity
@Table(
    name = "tags",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_tags_name", columnNames = ["name"])
    ],
    indexes = [
        Index(name = "idx_tags_official_name", columnList = "is_official, name"),
        Index(name = "idx_tags_deleted", columnList = "deleted_at")
    ]
)
class Tag(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, length = 60)
    var name: String,

    @Column(name = "is_official", nullable = false)
    var isOfficial: Boolean = false
) : BaseSoftDeleteEntity()