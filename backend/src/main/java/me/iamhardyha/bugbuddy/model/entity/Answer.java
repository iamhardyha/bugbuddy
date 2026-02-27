package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;

@Entity
@Table(
        name = "answers",
        indexes = {
                @Index(name = "idx_answers_question_created", columnList = "question_id, created_at"),
                @Index(name = "idx_answers_author_created", columnList = "author_user_id, created_at"),
                @Index(name = "idx_answers_accepted", columnList = "question_id, is_accepted, created_at"),
                @Index(name = "idx_answers_deleted", columnList = "deleted_at"),
                @Index(name = "idx_answers_active_question", columnList = "question_id, deleted_at, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Answer extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_snapshot_role", nullable = false, length = 20)
    private SnapshotRole authorSnapshotRole = SnapshotRole.USER;

    @Column(name = "is_accepted", nullable = false)
    private boolean accepted = false;
}
