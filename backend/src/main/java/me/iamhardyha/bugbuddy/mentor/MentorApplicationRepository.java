package me.iamhardyha.bugbuddy.mentor;

import me.iamhardyha.bugbuddy.model.entity.MentorApplication;
import me.iamhardyha.bugbuddy.model.enums.MentorApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MentorApplicationRepository extends JpaRepository<MentorApplication, Long> {

    Optional<MentorApplication> findByUserId(Long userId);

    Page<MentorApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<MentorApplication> findAllByStatusOrderByCreatedAtDesc(
            MentorApplicationStatus status, Pageable pageable);

    @Query(value = """
            SELECT * FROM mentor_applications
            WHERE user_id = :userId AND status = 'REJECTED' AND reviewed_at IS NOT NULL
            ORDER BY reviewed_at DESC LIMIT 1
            """, nativeQuery = true)
    Optional<MentorApplication> findLatestRejected(@Param("userId") Long userId);
}
