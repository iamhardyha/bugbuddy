package me.iamhardyha.bugbuddy.upload;

import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.upload.dto.UploadResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    /**
     * 이미지 업로드
     * POST /api/uploads
     * Content-Type: multipart/form-data
     * 파트명: file
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UploadResponse>> upload(
            @AuthenticationPrincipal Long userId,
            @RequestPart("file") MultipartFile file
    ) {
        UploadResponse response = uploadService.upload(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * 이미지 삭제
     * DELETE /api/uploads/{uploadId}
     */
    @DeleteMapping("/{uploadId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long uploadId
    ) {
        uploadService.delete(uploadId, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
