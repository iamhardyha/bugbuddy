package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ReactionType;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(
        name = "answer_reactions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_answer_reactions_unique", columnNames = {"answer_id", "voter_user_id", "reaction_type"})
        },
        indexes = {
                @Index(name = "idx_answer_reactions_answer", columnList = "answer_id, created_at"),
                @Index(name = "idx_answer_reactions_voter", columnList = "voter_user_id, created_at"),
                @Index(name = "idx_answer_reactions_deleted", columnList = "deleted_at"),
                @Index(name = "idx_answer_reactions_answer_type", columnList = "answer_id, reaction_type, deleted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class AnswerReaction extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "answer_id", nullable = false)
    private Long answerId;

    @Column(name = "voter_user_id", nullable = false)
    private Long voterUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction_type", nullable = false, length = 20)
    private ReactionType reactionType = ReactionType.HELPFUL;
}
