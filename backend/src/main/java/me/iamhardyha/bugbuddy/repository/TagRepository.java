package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query("SELECT t FROM Tag t WHERE t.name = :name")
    Optional<Tag> findActiveByName(@Param("name") String name);

    @Query("SELECT t FROM Tag t ORDER BY t.name ASC")
    List<Tag> findAllActive();

    @Query("SELECT qt.questionId, t.name FROM QuestionTag qt JOIN Tag t ON qt.tagId = t.id WHERE qt.questionId IN :questionIds")
    List<Object[]> findTagNamesByQuestionIds(@Param("questionIds") Collection<Long> questionIds);
}
