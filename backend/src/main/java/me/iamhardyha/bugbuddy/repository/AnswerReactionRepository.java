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

    /** 소프트 삭제된 레코드도 포함하여 조회 (이전에 삭제된 반응 복원 등에 사용). */
    @Query(value = "SELECT * FROM answer_reactions r WHERE r.answer_id = :answerId AND r.voter_user_id = :userId AND r.reaction_type = :#{#reactionType.name()}", nativeQuery = true)
    Optional<AnswerReaction> findByAnswerIdAndVoterUserIdAndReactionType(
            @Param("answerId") Long answerId,
            @Param("userId") Long userId,
            @Param("reactionType") ReactionType reactionType
    );

    @Query("SELECT r FROM AnswerReaction r WHERE r.answerId = :answerId AND r.voterUserId = :userId AND r.reactionType = :reactionType")
    Optional<AnswerReaction> findActiveByAnswerIdAndVoterUserIdAndReactionType(
            @Param("answerId") Long answerId,
            @Param("userId") Long userId,
            @Param("reactionType") ReactionType reactionType
    );

    @Query("SELECT COUNT(r) FROM AnswerReaction r WHERE r.answerId = :answerId AND r.reactionType = :reactionType")
    long countActiveByAnswerIdAndReactionType(@Param("answerId") Long answerId, @Param("reactionType") ReactionType reactionType);

    @Query("SELECT r.answerId FROM AnswerReaction r WHERE r.voterUserId = :userId AND r.reactionType = :reactionType AND r.answerId IN :answerIds")
    Set<Long> findReactedAnswerIds(
            @Param("userId") Long userId,
            @Param("reactionType") ReactionType reactionType,
            @Param("answerIds") Collection<Long> answerIds
    );

    @Query("SELECT COUNT(r) FROM AnswerReaction r WHERE r.reactionType = :reactionType AND r.answerId IN (SELECT a.id FROM Answer a WHERE a.authorUserId = :authorUserId)")
    long countHelpfulReceivedByAuthorUserId(@Param("authorUserId") Long authorUserId, @Param("reactionType") ReactionType reactionType);
}
