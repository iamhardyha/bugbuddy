package me.iamhardyha.bugbuddy.ranking;

import me.iamhardyha.bugbuddy.config.CacheConfig;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.ranking.dto.MyRankResponse;
import me.iamhardyha.bugbuddy.ranking.dto.RankingResponse;
import me.iamhardyha.bugbuddy.ranking.dto.RankingRowResponse;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class RankingService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final RankingQueryRepository rankingQueryRepository;
    private final UserRepository userRepository;

    public RankingService(RankingQueryRepository rankingQueryRepository,
                          UserRepository userRepository) {
        this.rankingQueryRepository = rankingQueryRepository;
        this.userRepository = userRepository;
    }

    public RankingResponse getRanking(RankingPeriod period, RankingOffset offset, Long currentUserId) {
        if (period == RankingPeriod.ALL) {
            return buildAllRanking(currentUserId);
        }
        return buildPeriodRanking(period, offset, currentUserId);
    }

    // --- 전체 누적 ---

    private RankingResponse buildAllRanking(Long currentUserId) {
        List<RankingRowResponse> top100 = getCachedAllTimeTop100();
        MyRankResponse myRank = computeAllTimeMyRank(currentUserId);
        List<RankingRowResponse> marked = markCurrentUser(top100, currentUserId);
        return new RankingResponse("all", "current", null, null, marked, myRank);
    }

    @Cacheable(cacheNames = CacheConfig.CACHE_RANKING_CURRENT, key = "'all'", sync = true)
    public List<RankingRowResponse> getCachedAllTimeTop100() {
        return rankingQueryRepository.findAllTimeTop100();
    }

    private MyRankResponse computeAllTimeMyRank(Long currentUserId) {
        if (currentUserId == null) return null;
        Optional<UserEntity> me = userRepository.findById(currentUserId);
        if (me.isEmpty()) return null;
        int myXp = me.get().getXp();
        int rank = rankingQueryRepository.countUsersAboveXp(myXp) + 1;
        boolean inTop100 = rank <= 100;
        Integer hundredthXp = rankingQueryRepository.findHundredthXp();
        int xpToTop100 = (hundredthXp == null || myXp >= hundredthXp) ? 0 : (hundredthXp - myXp + 1);
        long[] counts = rankingQueryRepository.countMyActivityAllTime(currentUserId);
        return new MyRankResponse(rank, myXp, null, xpToTop100, inTop100,
                counts[0], counts[1], counts[2]);
    }

    // --- 기간 (주간/월간) ---

    private RankingResponse buildPeriodRanking(RankingPeriod period, RankingOffset offset, Long currentUserId) {
        LocalDateTime[] range = computeRange(period, offset);
        LocalDateTime start = range[0];
        LocalDateTime end = range[1];

        List<RankingRowResponse> top100 = (offset == RankingOffset.PREVIOUS)
                ? getCachedPreviousPeriodTop100(period, start, end)
                : getCachedCurrentPeriodTop100(period, start, end);

        MyRankResponse myRank = computePeriodMyRank(currentUserId, start, end);
        List<RankingRowResponse> marked = markCurrentUser(top100, currentUserId);

        return new RankingResponse(
                period.name().toLowerCase(),
                offset.name().toLowerCase(),
                start.atZone(KST).toOffsetDateTime(),
                end.atZone(KST).toOffsetDateTime(),
                marked,
                myRank
        );
    }

    @Cacheable(cacheNames = CacheConfig.CACHE_RANKING_CURRENT,
               key = "'period-current-' + #period.name()", sync = true)
    public List<RankingRowResponse> getCachedCurrentPeriodTop100(
            RankingPeriod period, LocalDateTime start, LocalDateTime end) {
        return rankingQueryRepository.findPeriodTop100(start, end);
    }

    @Cacheable(cacheNames = CacheConfig.CACHE_RANKING_PREVIOUS,
               key = "'period-prev-' + #period.name() + '-' + #start.toLocalDate()", sync = true)
    public List<RankingRowResponse> getCachedPreviousPeriodTop100(
            RankingPeriod period, LocalDateTime start, LocalDateTime end) {
        return rankingQueryRepository.findPeriodTop100(start, end);
    }

    private MyRankResponse computePeriodMyRank(Long currentUserId, LocalDateTime start, LocalDateTime end) {
        if (currentUserId == null) return null;
        Optional<UserEntity> me = userRepository.findById(currentUserId);
        if (me.isEmpty()) return null;
        int myPeriodXp = rankingQueryRepository.sumPeriodXp(currentUserId, start, end);
        if (myPeriodXp <= 0) return null;
        int rank = rankingQueryRepository.countUsersAbovePeriodXp(myPeriodXp, start, end) + 1;
        boolean inTop100 = rank <= 100;
        long[] counts = rankingQueryRepository.countMyActivityInPeriod(currentUserId, start, end);
        return new MyRankResponse(rank, me.get().getXp(), myPeriodXp, 0, inTop100,
                counts[0], counts[1], counts[2]);
    }

    // --- 기간 경계 계산 ---

    private LocalDateTime[] computeRange(RankingPeriod period, RankingOffset offset) {
        LocalDate today = LocalDate.now(KST);
        LocalDate startDate;
        LocalDate endDate;

        if (period == RankingPeriod.WEEKLY) {
            LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            if (offset == RankingOffset.PREVIOUS) monday = monday.minusWeeks(1);
            startDate = monday;
            endDate = monday.plusDays(6);
        } else { // MONTHLY
            LocalDate first = today.withDayOfMonth(1);
            if (offset == RankingOffset.PREVIOUS) first = first.minusMonths(1);
            startDate = first;
            endDate = first.with(TemporalAdjusters.lastDayOfMonth());
        }
        return new LocalDateTime[]{
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.of(23, 59, 59))
        };
    }

    // --- isCurrentUser 플래그 마킹 ---

    private List<RankingRowResponse> markCurrentUser(List<RankingRowResponse> rows, Long currentUserId) {
        if (currentUserId == null) return rows;
        List<RankingRowResponse> out = new ArrayList<>(rows.size());
        for (RankingRowResponse r : rows) {
            if (r.userId().equals(currentUserId)) {
                out.add(new RankingRowResponse(
                        r.rank(), r.userId(), r.nickname(), r.level(), r.xp(),
                        r.periodXp(), r.bio(), r.mentorStatus(),
                        r.acceptedAnswerCount(), r.answerCount(), r.questionCount(),
                        true
                ));
            } else {
                out.add(r);
            }
        }
        return out;
    }
}
