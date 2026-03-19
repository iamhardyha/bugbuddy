package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query(value = "SELECT q FROM Question q JOIN FETCH q.author ORDER BY q.createdAt DESC",
           countQuery = "SELECT COUNT(q) FROM Question q")
    Page<Question> findAllActive(Pageable pageable);

    @Query(value = "SELECT q FROM Question q JOIN FETCH q.author WHERE q.category = :category ORDER BY q.createdAt DESC",
           countQuery = "SELECT COUNT(q) FROM Question q WHERE q.category = :category")
    Page<Question> findAllActiveByCategory(@Param("category") QuestionCategory category, Pageable pageable);

    @Query(value = "SELECT q FROM Question q JOIN FETCH q.author WHERE q.questionType = :type ORDER BY q.createdAt DESC",
           countQuery = "SELECT COUNT(q) FROM Question q WHERE q.questionType = :type")
    Page<Question> findAllActiveByType(@Param("type") QuestionType type, Pageable pageable);

    @Query(value = "SELECT q FROM Question q JOIN FETCH q.author WHERE q.status = :status ORDER BY q.createdAt DESC",
           countQuery = "SELECT COUNT(q) FROM Question q WHERE q.status = :status")
    Page<Question> findAllActiveByStatus(@Param("status") QuestionStatus status, Pageable pageable);

    @Query(value = "SELECT q FROM Question q JOIN FETCH q.author WHERE q.category = :category AND q.questionType = :type ORDER BY q.createdAt DESC",
           countQuery = "SELECT COUNT(q) FROM Question q WHERE q.category = :category AND q.questionType = :type")
    Page<Question> findAllActiveByCategoryAndType(@Param("category") QuestionCategory category, @Param("type") QuestionType type, Pageable pageable);

    @Query("SELECT q FROM Question q JOIN FETCH q.author WHERE q.id = :id")
    Optional<Question> findActiveById(@Param("id") Long id);

    @Query(value = "SELECT q FROM Question q JOIN FETCH q.author WHERE q.author.id = :authorUserId ORDER BY q.createdAt DESC",
           countQuery = "SELECT COUNT(q) FROM Question q WHERE q.author.id = :authorUserId")
    Page<Question> findAllActiveByAuthorUserId(@Param("authorUserId") Long authorUserId, Pageable pageable);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.author.id = :authorUserId")
    long countAllActiveByAuthorUserId(@Param("authorUserId") Long authorUserId);

    @Modifying
    @Query("UPDATE Question q SET q.viewCount = q.viewCount + 1 WHERE q.id = :id")
    void incrementViewCount(@Param("id") Long id);
}
