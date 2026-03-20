package me.iamhardyha.bugbuddy.upload;

import me.iamhardyha.bugbuddy.model.entity.Upload;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UploadRepository extends JpaRepository<Upload, Long> {

    Optional<Upload> findByIdAndUploaderUserId(Long id, Long uploaderUserId);

    List<Upload> findAllByRefTypeAndRefId(ReferenceType refType, Long refId);

    /** 생성 후 cutoff 이전이고 아직 연결되지 않은 임시 업로드 조회 (고아 파일 정리용) */
    @Query("SELECT u FROM Upload u WHERE u.refType IS NULL AND u.createdAt < :cutoff")
    List<Upload> findOrphansBefore(@Param("cutoff") java.time.Instant cutoff);

    /** 질문/답변/채팅 저장 시 임시 업로드들을 한 번에 연결 */
    @Modifying
    @Query("""
            UPDATE Upload u
            SET u.refType = :refType, u.refId = :refId
            WHERE u.id IN :ids
              AND u.uploaderUserId = :uploaderUserId
              AND u.refType IS NULL
            """)
    int linkUploads(@Param("ids") List<Long> ids,
                    @Param("uploaderUserId") Long uploaderUserId,
                    @Param("refType") ReferenceType refType,
                    @Param("refId") Long refId);
}
