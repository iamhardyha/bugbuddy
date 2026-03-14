package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;

@Entity
@Table(
        name = "questions",
        indexes = {
                @Index(name = "idx_questions_author_created", columnList = "author_user_id, created_at"),
                @Index(name = "idx_questions_category_created", columnList = "category, created_at"),
                @Index(name = "idx_questions_status_created", columnList = "status, created_at"),
                @Index(name = "idx_questions_type_created", columnList = "question_type, created_at"),
                @Index(name = "idx_questions_active_list", columnList = "deleted_at, status, created_at"),
                @Index(name = "idx_questions_deleted", columnList = "deleted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Question extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuestionCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionStatus status = QuestionStatus.OPEN;

    @Column(name = "view_count", nullable = false)
    private int viewCount = 0;
}
