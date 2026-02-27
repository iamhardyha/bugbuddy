package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.QuestionTag;
import me.iamhardyha.bugbuddy.model.entity.QuestionTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionTagRepository extends JpaRepository<QuestionTag, QuestionTagId> {

    @Query("SELECT qt FROM QuestionTag qt WHERE qt.questionId = :questionId")
    List<QuestionTag> findByQuestionId(@Param("questionId") Long questionId);

    void deleteByQuestionId(Long questionId);
}
