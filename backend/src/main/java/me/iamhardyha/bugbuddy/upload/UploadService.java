package me.iamhardyha.bugbuddy.upload;

import lombok.RequiredArgsConstructor;
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
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

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

        putToS3(file, fileKey);

        Upload upload = Upload.builder()
                .uploaderUserId(uploaderUserId)
                .fileKey(fileKey)
                .fileUrl(fileUrl)
                .originalFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image")
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        return UploadResponse.from(uploadRepository.save(upload));
    }

    /**
     * 질문/답변/채팅 저장 시 호출 — 임시 업로드들을 콘텐츠에 연결한다.
     * uploadIds가 비어 있으면 아무 작업도 하지 않는다.
     */
    @Transactional
    public void linkUploads(List<Long> uploadIds, Long uploaderUserId,
                            ReferenceType refType, Long refId) {
        if (uploadIds == null || uploadIds.isEmpty()) {
            return;
        }
        uploadRepository.linkUploads(uploadIds, uploaderUserId, refType, refId);
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
    }

    private String buildFileKey(Long userId, String originalFilename) {
        String ext = extractExtension(originalFilename);
        return "uploads/" + userId + "/" + UUID.randomUUID() + ext;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
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
