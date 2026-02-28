package me.iamhardyha.bugbuddy.upload.dto;

import me.iamhardyha.bugbuddy.model.entity.Upload;

public record UploadResponse(
        Long uploadId,
        String fileUrl,
        String originalFilename,
        String mimeType,
        long fileSize
) {
    public static UploadResponse from(Upload upload) {
        return new UploadResponse(
                upload.getId(),
                upload.getFileUrl(),
                upload.getOriginalFilename(),
                upload.getMimeType(),
                upload.getFileSize()
        );
    }
}
