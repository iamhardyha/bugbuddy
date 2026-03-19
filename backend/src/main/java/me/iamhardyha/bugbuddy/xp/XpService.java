package me.iamhardyha.bugbuddy.xp;

import me.iamhardyha.bugbuddy.model.entity.XpEvent;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.xp.dto.XpEventResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class XpService {

    /** 레벨 기준 XP 임계값 (인덱스 = 레벨 - 1). Lv.1~10 */
    private static final int[] LEVEL_THRESHOLDS = {0, 100, 250, 500, 900, 1500, 2500, 4000, 6000, 10000};

    private final XpEventRepository xpEventRepository;
    private final UserRepository userRepository;

    public XpService(XpEventRepository xpEventRepository, UserRepository userRepository) {
        this.xpEventRepository = xpEventRepository;
        this.userRepository = userRepository;
    }

    /**
     * XP 지급: 이벤트 기록 + UserEntity.xp 원자적 갱신 + 레벨 재계산.
     * <p>
     * 1) XpEvent 저장
     * 2) atomic UPDATE (addXp) — 동시 호출 시에도 xp 유실 없음
     * 3) 레벨이 변경된 경우에만 추가 save
     */
    @Transactional
    public void grantXp(Long userId, XpEventType eventType,
                        ReferenceType refType, Long refId, int deltaXp) {
        XpEvent event = new XpEvent();
        event.setUserId(userId);
        event.setEventType(eventType);
        event.setRefType(refType);
        event.setRefId(refId);
        event.setDeltaXp(deltaXp);
        xpEventRepository.save(event);

        // 원자적 XP 증감
        userRepository.addXp(userId, deltaXp);

        // 레벨 재계산 — 변경된 경우에만 save
        userRepository.findById(userId).ifPresent(user -> {
            int newLevel = calculateLevel(user.getXp());
            if (newLevel != user.getLevel()) {
                user.setLevel(newLevel);
            }
        });
    }

    /** 특정 이벤트 타입 + deltaXp 조합의 누적 건수 반환. */
    public long countEvents(Long userId, XpEventType eventType, int deltaXp) {
        return xpEventRepository.countByUserIdAndEventTypeAndDeltaXp(userId, eventType, deltaXp);
    }

    public Page<XpEventResponse> getXpEvents(Long userId, Pageable pageable) {
        return xpEventRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(XpEventResponse::of);
    }

    private int calculateLevel(int xp) {
        int level = 1;
        for (int i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_THRESHOLDS[i]) {
                level = i + 1;
                break;
            }
        }
        return level;
    }
}
