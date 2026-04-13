package me.iamhardyha.bugbuddy.mentor;

import lombok.RequiredArgsConstructor;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.mentor.dto.MentorCardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MentorExploreController {

    private final MentorService mentorService;

    @GetMapping("/api/mentors")
    public ResponseEntity<ApiResponse<Page<MentorCardResponse>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "RATING") String sort,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<MentorCardResponse> response = mentorService.listMentors(keyword, sort, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
