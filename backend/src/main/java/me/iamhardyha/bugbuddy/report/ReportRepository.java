package me.iamhardyha.bugbuddy.report;

import me.iamhardyha.bugbuddy.model.entity.Report;
import me.iamhardyha.bugbuddy.model.enums.ReportStatus;
import me.iamhardyha.bugbuddy.model.enums.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterUserIdAndTargetTypeAndTargetIdAndDeletedAtIsNull(
            Long reporterUserId, ReportTargetType targetType, Long targetId);

    @Query("SELECT r FROM Report r WHERE r.status = :status AND r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    Page<Report> findAllByStatus(@Param("status") ReportStatus status, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    Page<Report> findAllActive(Pageable pageable);
}
