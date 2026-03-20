package me.iamhardyha.bugbuddy.upload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.iamhardyha.bugbuddy.config.S3Properties;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Upload;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.upload.dto.UploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private final S3Client s3Client;
    private final S3Properties s3Properties;
    private final UploadRepository uploadRepository;

    @Transactional
    public UploadResponse upload(MultipartFile file, Long uploaderUserId) {
        validateFile(file);

        String fileKey = buildFileKey(uploaderUserId, file.getOriginalFilename());
        String fileUrl = s3Properties.getPublicBaseUrl() + "/" + fileKey;

        // S3 업로드를 먼저 수행하고, 실패 시 DB에 기록하지 않음
        putToS3(file, fileKey);

        try {
            Upload upload = Upload.builder()
                    .uploaderUserId(uploaderUserId)
                    .fileKey(fileKey)
                    .fileUrl(fileUrl)
                    .originalFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image")
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();

            return UploadResponse.from(uploadRepository.save(upload));
        } catch (Exception e) {
            // DB 저장 실패 시 S3 보상 삭제
            deleteFromS3(fileKey);
            throw e;
        }
    }

    /**
     * 질문/답변/채팅 저장 시 호출 — 임시 업로드들을 콘텐츠에 연결한다.
     * uploadIds가 비어 있으면 아무 작업도 하지 않는다.
     * 요청 건수와 실제 연결 건수가 불일치하면 경고 로그를 남긴다.
     */
    @Transactional
    public void linkUploads(List<Long> uploadIds, Long uploaderUserId,
                            ReferenceType refType, Long refId) {
        if (uploadIds == null || uploadIds.isEmpty()) {
            return;
        }
        int linked = uploadRepository.linkUploads(uploadIds, uploaderUserId, refType, refId);
        if (linked != uploadIds.size()) {
            log.warn("업로드 연결 불일치: 요청={}건, 실제={}건, userId={}, refType={}, refId={}",
                    uploadIds.size(), linked, uploaderUserId, refType, refId);
        }
    }

    /** 단일 업로드 삭제 — S3 삭제 + soft-delete. 본인 업로드만 가능. */
    @Transactional
    public void delete(Long uploadId, Long userId) {
        Upload upload = uploadRepository.findByIdAndUploaderUserId(uploadId, userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.UPLOAD_NOT_FOUND));
        deleteFromS3(upload.getFileKey());
        upload.softDelete();
    }

    // ── private ────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BugBuddyException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > s3Properties.getMaxFileSize()) {
            throw new BugBuddyException(ErrorCode.UPLOAD_FILE_TOO_LARGE);
        }
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new BugBuddyException(ErrorCode.UPLOAD_INVALID_TYPE);
        }
        validateMagicBytes(file);
    }

    /** 파일 매직 바이트를 검사하여 Content-Type 위조를 방지한다. */
    private void validateMagicBytes(MultipartFile file) {
        try {
            byte[] header = new byte[12];
            int read = file.getInputStream().read(header);
            if (read < 4) {
                throw new BugBuddyException(ErrorCode.UPLOAD_INVALID_TYPE);
            }
            if (!isValidImageMagic(header)) {
                throw new BugBuddyException(ErrorCode.UPLOAD_INVALID_TYPE);
            }
        } catch (IOException e) {
            throw new BugBuddyException(ErrorCode.UPLOAD_FAILED);
        }
    }

    private boolean isValidImageMagic(byte[] header) {
        // JPEG: FF D8 FF
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47
        if (header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
            return true;
        }
        // GIF: 47 49 46 38
        if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38) {
            return true;
        }
        // WebP: RIFF....WEBP (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                && header.length >= 12
                && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) {
            return true;
        }
        return false;
    }

    private String buildFileKey(Long userId, String originalFilename) {
        String ext = extractExtension(originalFilename);
        return "uploads/" + userId + "/" + UUID.randomUUID() + ext;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    private void deleteFromS3(String fileKey) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(s3Properties.getBucket())
                    .key(fileKey)
                    .build());
        } catch (Exception e) {
            log.warn("S3 삭제 실패: fileKey={}, error={}", fileKey, e.getMessage());
        }
    }

    private void putToS3(MultipartFile file, String fileKey) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(s3Properties.getBucket())
                    .key(fileKey)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
        } catch (IOException e) {
            throw new BugBuddyException(ErrorCode.UPLOAD_FAILED);
        }
    }
}
