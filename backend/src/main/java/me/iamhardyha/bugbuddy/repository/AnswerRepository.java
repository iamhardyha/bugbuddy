package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query(value = "SELECT a FROM Answer a JOIN FETCH a.author WHERE a.question.id = :questionId ORDER BY a.accepted DESC, a.createdAt ASC",
           countQuery = "SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId")
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
}
