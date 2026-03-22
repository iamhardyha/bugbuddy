package me.iamhardyha.bugbuddy.report;

import me.iamhardyha.bugbuddy.model.entity.Report;
import me.iamhardyha.bugbuddy.model.enums.ReportStatus;
import me.iamhardyha.bugbuddy.model.enums.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterUserIdAndTargetTypeAndTargetId(
            Long reporterUserId, ReportTargetType targetType, Long targetId);

    @Query("SELECT r FROM Report r WHERE r.status = :status ORDER BY r.createdAt DESC")
    Page<Report> findAllByStatus(@Param("status") ReportStatus status, Pageable pageable);

    @Query("SELECT r FROM Report r ORDER BY r.createdAt DESC")
    Page<Report> findAllActive(Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.targetType = 'USER' AND r.targetId = :userId ORDER BY r.createdAt DESC")
    List<Report> findRecentByTargetUserId(@Param("userId") Long userId, Pageable pageable);
}
