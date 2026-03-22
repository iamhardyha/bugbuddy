package me.iamhardyha.bugbuddy.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.admin.dto.AdminLoginRequest;
import me.iamhardyha.bugbuddy.admin.dto.AdminLoginResponse;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AdminLoginResponse>> login(
            @RequestBody @Valid AdminLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminAuthService.login(request)));
    }
}
