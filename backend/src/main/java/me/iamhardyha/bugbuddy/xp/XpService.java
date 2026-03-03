package me.iamhardyha.bugbuddy.xp;

import me.iamhardyha.bugbuddy.model.entity.UserEntity;
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

    /** 레벨 기준 XP 임계값 (인덱스 = 레벨 - 1). Lv.1~5 */
    private static final int[] LEVEL_THRESHOLDS = {0, 50, 150, 300, 600};

    private final XpEventRepository xpEventRepository;
    private final UserRepository userRepository;

    public XpService(XpEventRepository xpEventRepository, UserRepository userRepository) {
        this.xpEventRepository = xpEventRepository;
        this.userRepository = userRepository;
    }

    /**
     * XP 지급: 이벤트 기록 + UserEntity.xp / level 갱신.
     * 트랜잭션은 호출 측에서 열려 있다고 가정하므로 @Transactional 없이 동작.
     * 단독 호출 시에도 안전하게 동작하도록 @Transactional 선언.
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

        userRepository.findById(userId).ifPresent(user -> {
            int newXp = user.getXp() + deltaXp;
            user.setXp(newXp);
            user.setLevel(calculateLevel(newXp));
        });
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
