package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import me.iamhardyha.bugbuddy.model.common.BaseSoftDeleteEntity;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;

@Entity
@Table(
        name = "uploads",
        indexes = {
                @Index(name = "idx_uploads_ref", columnList = "ref_type, ref_id"),
                @Index(name = "idx_uploads_uploader", columnList = "uploader_user_id, created_at"),
                @Index(name = "idx_uploads_pending", columnList = "uploader_user_id, ref_type, created_at"),
                @Index(name = "idx_uploads_deleted", columnList = "deleted_at")
        }
)
@Getter
@NoArgsConstructor
public class Upload extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uploader_user_id", nullable = false)
    private Long uploaderUserId;

    /** 연결된 콘텐츠 타입. 저장 전(임시 상태)에는 NULL. */
    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", length = 30)
    private ReferenceType refType;

    /** 연결된 콘텐츠 ID. 저장 전(임시 상태)에는 NULL. */
    @Column(name = "ref_id")
    private Long refId;

    /** S3/R2 버킷 내 object key */
    @Column(name = "file_key", nullable = false, length = 500)
    private String fileKey;

    /** 접근 가능한 URL */
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    /** image/jpeg, image/png, image/webp 등 */
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    /** 파일 크기 (bytes) */
    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Builder
    public Upload(Long uploaderUserId, String fileKey, String fileUrl,
                  String originalFilename, String mimeType, long fileSize) {
        this.uploaderUserId = uploaderUserId;
        this.fileKey = fileKey;
        this.fileUrl = fileUrl;
        this.originalFilename = originalFilename;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
    }

    public void linkTo(ReferenceType refType, Long refId) {
        this.refType = refType;
        this.refId = refId;
    }
}
