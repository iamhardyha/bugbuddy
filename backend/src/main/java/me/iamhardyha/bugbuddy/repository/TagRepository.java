package me.iamhardyha.bugbuddy.repository;

import me.iamhardyha.bugbuddy.model.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query("SELECT t FROM Tag t WHERE t.deletedAt IS NULL AND t.name = :name")
    Optional<Tag> findActiveByName(String name);

    @Query("SELECT t FROM Tag t WHERE t.deletedAt IS NULL ORDER BY t.name ASC")
    List<Tag> findAllActive();
}
