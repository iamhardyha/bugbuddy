package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.AnswerReaction;
import me.iamhardyha.bugbuddy.model.enums.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;

public interface AnswerReactionRepository extends JpaRepository<AnswerReaction, Long> {

    @Query("SELECT r FROM AnswerReaction r WHERE r.answerId = :answerId AND r.voterUserId = :userId AND r.reactionType = :reactionType")
    Optional<AnswerReaction> findByAnswerIdAndVoterUserIdAndReactionType(
            @Param("answerId") Long answerId,
            @Param("userId") Long userId,
            @Param("reactionType") ReactionType reactionType
    );

    @Query("SELECT r FROM AnswerReaction r WHERE r.deletedAt IS NULL AND r.answerId = :answerId AND r.voterUserId = :userId AND r.reactionType = :reactionType")
    Optional<AnswerReaction> findActiveByAnswerIdAndVoterUserIdAndReactionType(
            @Param("answerId") Long answerId,
            @Param("userId") Long userId,
            @Param("reactionType") ReactionType reactionType
    );

    @Query("SELECT COUNT(r) FROM AnswerReaction r WHERE r.deletedAt IS NULL AND r.answerId = :answerId AND r.reactionType = :reactionType")
    long countActiveByAnswerIdAndReactionType(@Param("answerId") Long answerId, @Param("reactionType") ReactionType reactionType);

    @Query("SELECT r.answerId FROM AnswerReaction r WHERE r.deletedAt IS NULL AND r.voterUserId = :userId AND r.reactionType = :reactionType AND r.answerId IN :answerIds")
    Set<Long> findReactedAnswerIds(
            @Param("userId") Long userId,
            @Param("reactionType") ReactionType reactionType,
            @Param("answerIds") Collection<Long> answerIds
    );
}
