package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query("SELECT a FROM Answer a WHERE a.deletedAt IS NULL AND a.questionId = :questionId ORDER BY a.accepted DESC, a.createdAt ASC")
    Page<Answer> findAllActiveByQuestionId(@Param("questionId") Long questionId, Pageable pageable);

    @Query("SELECT a FROM Answer a WHERE a.deletedAt IS NULL AND a.id = :id")
    Optional<Answer> findActiveById(@Param("id") Long id);

    @Query("SELECT a FROM Answer a WHERE a.deletedAt IS NULL AND a.questionId = :questionId AND a.accepted = true")
    Optional<Answer> findAcceptedByQuestionId(@Param("questionId") Long questionId);
}
