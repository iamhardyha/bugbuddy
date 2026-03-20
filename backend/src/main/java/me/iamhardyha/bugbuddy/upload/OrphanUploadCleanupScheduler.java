package me.iamhardyha.bugbuddy.upload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.iamhardyha.bugbuddy.config.S3Properties;
import me.iamhardyha.bugbuddy.model.entity.Upload;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrphanUploadCleanupScheduler {

    private static final int ORPHAN_TTL_HOURS = 24;

    private final UploadRepository uploadRepository;
    private final S3Client s3Client;
    private final S3Properties s3Properties;

    /**
     * 매 시간 실행: 24시간 이상 연결되지 않은 임시 업로드를 S3에서 삭제하고 soft-delete 처리.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupOrphanUploads() {
        Instant cutoff = Instant.now().minus(ORPHAN_TTL_HOURS, ChronoUnit.HOURS);
        List<Upload> orphans = uploadRepository.findOrphansBefore(cutoff);

        if (orphans.isEmpty()) {
            return;
        }

        log.info("고아 업로드 정리 시작: {}건", orphans.size());

        int deleted = 0;
        int failed = 0;

        for (Upload orphan : orphans) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(s3Properties.getBucket())
                        .key(orphan.getFileKey())
                        .build());
                orphan.softDelete();
                deleted++;
            } catch (Exception e) {
                log.warn("S3 삭제 실패: fileKey={}, error={}", orphan.getFileKey(), e.getMessage());
                failed++;
            }
        }

        log.info("고아 업로드 정리 완료: 삭제={}건, 실패={}건", deleted, failed);
    }
}
