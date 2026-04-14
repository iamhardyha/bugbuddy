package me.iamhardyha.bugbuddy.ranking;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Tuple;
import me.iamhardyha.bugbuddy.ranking.dto.RankingRowResponse;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Repository
public class RankingQueryRepository {

    @PersistenceContext
    private EntityManager em;

    /** 전체 누적 랭킹 Top 100 */
    @SuppressWarnings("unchecked")
    public List<RankingRowResponse> findAllTimeTop100() {
        String sql = """
                SELECT u.id AS user_id,
                       u.nickname AS nickname,
                       u.level AS level,
                       u.xp AS xp,
                       u.bio AS bio,
                       u.mentor_status AS mentor_status,
                       (SELECT COUNT(*) FROM answers a
                         WHERE a.author_user_id = u.id
                           AND a.is_accepted = 1
                           AND a.deleted_at IS NULL) AS accepted_cnt,
                       (SELECT COUNT(*) FROM answers a
                         WHERE a.author_user_id = u.id
                           AND a.deleted_at IS NULL) AS answer_cnt,
                       (SELECT COUNT(*) FROM questions q
                         WHERE q.author_user_id = u.id
                           AND q.deleted_at IS NULL) AS question_cnt
                  FROM users u
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                 ORDER BY u.xp DESC, u.id ASC
                 LIMIT 100
                """;
        List<Tuple> rows = em.createNativeQuery(sql, Tuple.class).getResultList();
        return mapRows(rows, false);
    }

    /** 기간 XP 합산 Top 100 (weekly/monthly, 현재/이전) */
    @SuppressWarnings("unchecked")
    public List<RankingRowResponse> findPeriodTop100(LocalDateTime start, LocalDateTime end) {
        String sql = """
                WITH period_xp AS (
                  SELECT user_id, SUM(delta_xp) AS period_xp
                    FROM xp_events
                   WHERE created_at BETWEEN :start AND :end
                   GROUP BY user_id
                  HAVING SUM(delta_xp) > 0
                   ORDER BY period_xp DESC, user_id ASC
                   LIMIT 100
                )
                SELECT u.id AS user_id,
                       u.nickname AS nickname,
                       u.level AS level,
                       u.xp AS xp,
                       p.period_xp AS period_xp,
                       u.bio AS bio,
                       u.mentor_status AS mentor_status,
                       (SELECT COUNT(*) FROM answers a
                         WHERE a.author_user_id = u.id
                           AND a.is_accepted = 1
                           AND a.deleted_at IS NULL
                           AND a.created_at BETWEEN :start AND :end) AS accepted_cnt,
                       (SELECT COUNT(*) FROM answers a
                         WHERE a.author_user_id = u.id
                           AND a.deleted_at IS NULL
                           AND a.created_at BETWEEN :start AND :end) AS answer_cnt,
                       (SELECT COUNT(*) FROM questions q
                         WHERE q.author_user_id = u.id
                           AND q.deleted_at IS NULL
                           AND q.created_at BETWEEN :start AND :end) AS question_cnt
                  FROM period_xp p
                  JOIN users u ON u.id = p.user_id
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                 ORDER BY p.period_xp DESC, p.user_id ASC
                """;
        List<Tuple> rows = em.createNativeQuery(sql, Tuple.class)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getResultList();
        return mapRows(rows, true);
    }

    /** 전체 랭킹에서 내 순위 (누적 xp 기준). */
    public int countUsersAboveXp(int myXp) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COUNT(*)
                  FROM users u
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                   AND u.xp > :myXp
                """)
                .setParameter("myXp", myXp)
                .getSingleResult();
        return n.intValue();
    }

    /** 100위 유저의 xp (xpToTop100 계산용). 100명 미만이면 null. */
    public Integer findHundredthXp() {
        List<?> rs = em.createNativeQuery("""
                SELECT u.xp
                  FROM users u
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                 ORDER BY u.xp DESC, u.id ASC
                 LIMIT 1 OFFSET 99
                """).getResultList();
        return rs.isEmpty() ? null : ((Number) rs.get(0)).intValue();
    }

    /** 내 기간 XP 합산. */
    public int sumPeriodXp(Long userId, LocalDateTime start, LocalDateTime end) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COALESCE(SUM(delta_xp), 0)
                  FROM xp_events
                 WHERE user_id = :userId
                   AND created_at BETWEEN :start AND :end
                """)
                .setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult();
        return n.intValue();
    }

    /** 기간 랭킹에서 내 순위 (내 기간 XP 이상인 유저 수). */
    public int countUsersAbovePeriodXp(int myPeriodXp, LocalDateTime start, LocalDateTime end) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM (
                  SELECT user_id, SUM(delta_xp) AS s
                    FROM xp_events
                   WHERE created_at BETWEEN :start AND :end
                   GROUP BY user_id
                  HAVING SUM(delta_xp) > :myPeriodXp
                ) t
                  JOIN users u ON u.id = t.user_id
                 WHERE u.deleted_at IS NULL
                   AND u.deactivated_at IS NULL
                   AND (u.suspended_until IS NULL OR u.suspended_until < NOW())
                """)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .setParameter("myPeriodXp", myPeriodXp)
                .getSingleResult();
        return n.intValue();
    }

    /** 누적 랭킹에서 내 활동 카운트 (accepted/answer/question). */
    public long[] countMyActivityAllTime(Long userId) {
        long accepted = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND is_accepted = 1 AND deleted_at IS NULL
                """).setParameter("userId", userId).getSingleResult()).longValue();
        long answers = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                """).setParameter("userId", userId).getSingleResult()).longValue();
        long questions = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM questions
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                """).setParameter("userId", userId).getSingleResult()).longValue();
        return new long[]{accepted, answers, questions};
    }

    /** 기간 랭킹에서 내 활동 카운트. */
    public long[] countMyActivityInPeriod(Long userId, LocalDateTime start, LocalDateTime end) {
        long accepted = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND is_accepted = 1
                   AND deleted_at IS NULL AND created_at BETWEEN :start AND :end
                """).setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult()).longValue();
        long answers = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM answers
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                   AND created_at BETWEEN :start AND :end
                """).setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult()).longValue();
        long questions = ((Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM questions
                 WHERE author_user_id = :userId AND deleted_at IS NULL
                   AND created_at BETWEEN :start AND :end
                """).setParameter("userId", userId)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end", Timestamp.valueOf(end))
                .getSingleResult()).longValue();
        return new long[]{accepted, answers, questions};
    }

    private List<RankingRowResponse> mapRows(List<Tuple> rows, boolean hasPeriodXp) {
        List<RankingRowResponse> out = new ArrayList<>(rows.size());
        int rank = 1;
        for (Tuple t : rows) {
            Integer periodXp = hasPeriodXp ? ((Number) t.get("period_xp")).intValue() : null;
            out.add(new RankingRowResponse(
                    rank++,
                    ((Number) t.get("user_id")).longValue(),
                    (String) t.get("nickname"),
                    ((Number) t.get("level")).intValue(),
                    ((Number) t.get("xp")).intValue(),
                    periodXp,
                    (String) t.get("bio"),
                    (String) t.get("mentor_status"),
                    ((Number) t.get("accepted_cnt")).longValue(),
                    ((Number) t.get("answer_cnt")).longValue(),
                    ((Number) t.get("question_cnt")).longValue(),
                    false
            ));
        }
        return Collections.unmodifiableList(out);
    }
}
