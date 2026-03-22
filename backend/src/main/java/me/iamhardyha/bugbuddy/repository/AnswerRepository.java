package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query(value = "SELECT a FROM Answer a JOIN FETCH a.author WHERE a.hidden = false AND a.question.id = :questionId ORDER BY a.accepted DESC, a.createdAt ASC",
           countQuery = "SELECT COUNT(a) FROM Answer a WHERE a.hidden = false AND a.question.id = :questionId")
    Page<Answer> findAllActiveByQuestionId(@Param("questionId") Long questionId, Pageable pageable);

    @Query("SELECT a FROM Answer a JOIN FETCH a.author WHERE a.id = :id")
    Optional<Answer> findActiveById(@Param("id") Long id);

    @Query("SELECT a FROM Answer a JOIN FETCH a.author WHERE a.question.id = :questionId AND a.accepted = true")
    Optional<Answer> findAcceptedByQuestionId(@Param("questionId") Long questionId);

    @Query(value = "SELECT a FROM Answer a JOIN FETCH a.author WHERE a.author.id = :authorUserId ORDER BY a.createdAt DESC",
           countQuery = "SELECT COUNT(a) FROM Answer a WHERE a.author.id = :authorUserId")
    Page<Answer> findAllActiveByAuthorUserId(@Param("authorUserId") Long authorUserId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.author.id = :authorUserId")
    long countAllActiveByAuthorUserId(@Param("authorUserId") Long authorUserId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.author.id = :authorUserId AND a.accepted = true")
    long countAllAcceptedByAuthorUserId(@Param("authorUserId") Long authorUserId);

    @Query("SELECT a FROM Answer a JOIN FETCH a.question WHERE a.id IN :ids")
    List<Answer> findAllActiveByIds(@Param("ids") List<Long> ids);

    // ── Admin native queries (bypass @SQLRestriction) ──

    @Query(value = "SELECT a.id, a.question_id, q.title AS question_title, " +
                   "a.body, a.is_accepted, a.hidden, a.deleted_at, a.created_at, " +
                   "a.author_user_id, u.nickname AS author_nickname " +
                   "FROM answers a " +
                   "JOIN users u ON a.author_user_id = u.id " +
                   "JOIN questions q ON a.question_id = q.id " +
                   "ORDER BY a.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM answers",
           nativeQuery = true)
    Page<Object[]> findAllForAdmin(Pageable pageable);

    @Modifying
    @Query(value = "UPDATE answers SET hidden = :hidden WHERE id = :id", nativeQuery = true)
    void updateHidden(@Param("id") Long id, @Param("hidden") boolean hidden);

    @Modifying
    @Query(value = "UPDATE answers SET hidden = false, deleted_at = NULL WHERE id = :id", nativeQuery = true)
    void restoreById(@Param("id") Long id);

    @Modifying
    @Query(value = "UPDATE answers SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL", nativeQuery = true)
    void softDeleteById(@Param("id") Long id);
}
