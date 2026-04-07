package me.iamhardyha.bugbuddy.admin;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import me.iamhardyha.bugbuddy.admin.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final Map<String, String> TYPE_TO_TABLE = Map.of(
            "USERS", "users",
            "QUESTIONS", "questions",
            "ANSWERS", "answers",
            "FEEDS", "tech_feeds"
    );

    private static final Set<String> VALID_PERIODS = Set.of("DAILY", "WEEKLY", "MONTHLY");

    @PersistenceContext
    private EntityManager em;

    public DashboardSummaryResponse getSummary() {
        long totalUsers = countFrom("users");
        long totalQuestions = countFrom("questions");
        long totalAnswers = countFrom("answers");
        long totalFeeds = countFrom("tech_feeds");

        long todaySignups = ((Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND DATE(created_at) = CURDATE()"
        ).getSingleResult()).longValue();

        return new DashboardSummaryResponse(
                totalUsers, totalQuestions, totalAnswers, totalFeeds, todaySignups
        );
    }

    public TrendResponse getTrends(String type, String period, int days) {
        String upperType = type.toUpperCase();
        String upperPeriod = period.toUpperCase();

        String table = TYPE_TO_TABLE.get(upperType);
        if (table == null) {
            throw new IllegalArgumentException("Invalid type: " + type + ". Must be one of: USERS, QUESTIONS, ANSWERS, FEEDS");
        }
        if (!VALID_PERIODS.contains(upperPeriod)) {
            throw new IllegalArgumentException("Invalid period: " + period + ". Must be one of: DAILY, WEEKLY, MONTHLY");
        }
        if (days < 1 || days > 365) {
            throw new IllegalArgumentException("days must be between 1 and 365");
        }

        String dateExpr = switch (upperPeriod) {
            case "DAILY" -> "DATE(created_at)";
            case "WEEKLY" -> "YEARWEEK(created_at, 1)";
            case "MONTHLY" -> "DATE_FORMAT(created_at, '%Y-%m')";
            default -> throw new IllegalArgumentException("Unexpected period: " + upperPeriod);
        };

        String sql = "SELECT " + dateExpr + " AS d, COUNT(*) AS cnt " +
                "FROM " + table + " " +
                "WHERE created_at >= NOW() - INTERVAL :days DAY AND deleted_at IS NULL " +
                "GROUP BY d ORDER BY d";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("days", days)
                .getResultList();

        List<TrendResponse.TrendPoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            String date = String.valueOf(row[0]);
            long count = ((Number) row[1]).longValue();
            points.add(new TrendResponse.TrendPoint(date, count));
        }

        return new TrendResponse(upperType, upperPeriod, List.copyOf(points));
    }

    public ActiveUsersResponse getActiveUsers() {
        long daily = countActiveUsers(1);
        long weekly = countActiveUsers(7);
        long monthly = countActiveUsers(30);
        return new ActiveUsersResponse(daily, weekly, monthly);
    }

    public ReportSummaryResponse getReportSummary() {
        String sql = "SELECT status, COUNT(*) FROM reports WHERE deleted_at IS NULL GROUP BY status";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        long openCount = 0;
        long reviewingCount = 0;
        long resolvedCount = 0;
        long rejectedCount = 0;

        for (Object[] row : rows) {
            String status = (String) row[0];
            long count = ((Number) row[1]).longValue();
            switch (status) {
                case "OPEN" -> openCount = count;
                case "REVIEWING" -> reviewingCount = count;
                case "RESOLVED" -> resolvedCount = count;
                case "REJECTED" -> rejectedCount = count;
                default -> { /* ignore unknown statuses */ }
            }
        }

        long pendingMentorApps = ((Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM mentor_applications WHERE status = 'PENDING' AND deleted_at IS NULL"
        ).getSingleResult()).longValue();

        return new ReportSummaryResponse(openCount, reviewingCount, resolvedCount, rejectedCount, pendingMentorApps);
    }

    public CategoryDistributionResponse getCategoryDistribution() {
        String sql = "SELECT category, COUNT(*) AS cnt FROM questions WHERE deleted_at IS NULL GROUP BY category ORDER BY cnt DESC";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        long total = 0;
        List<long[]> rawCounts = new ArrayList<>();
        List<String> categoryNames = new ArrayList<>();

        for (Object[] row : rows) {
            String category = (String) row[0];
            long count = ((Number) row[1]).longValue();
            categoryNames.add(category);
            rawCounts.add(new long[]{count});
            total += count;
        }

        List<CategoryDistributionResponse.CategoryCount> categories = new ArrayList<>();
        for (int i = 0; i < categoryNames.size(); i++) {
            long count = rawCounts.get(i)[0];
            double percentage = total > 0 ? Math.round(count * 10000.0 / total) / 100.0 : 0.0;
            categories.add(new CategoryDistributionResponse.CategoryCount(categoryNames.get(i), count, percentage));
        }

        return new CategoryDistributionResponse(List.copyOf(categories));
    }

    public TagRankingResponse getTagRanking(int limit) {
        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("limit must be between 1 and 100");
        }

        String sql = "SELECT t.name, COUNT(qt.question_id) AS cnt " +
                "FROM question_tags qt " +
                "JOIN tags t ON qt.tag_id = t.id " +
                "JOIN questions q ON qt.question_id = q.id " +
                "WHERE q.deleted_at IS NULL AND t.deleted_at IS NULL " +
                "GROUP BY t.name ORDER BY cnt DESC";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setMaxResults(limit)
                .getResultList();

        List<TagRankingResponse.TagCount> tags = new ArrayList<>();
        for (Object[] row : rows) {
            tags.add(new TagRankingResponse.TagCount((String) row[0], ((Number) row[1]).longValue()));
        }

        return new TagRankingResponse(List.copyOf(tags));
    }

    public XpDistributionResponse getXpDistribution() {
        String sql = "SELECT level, COUNT(*) AS cnt FROM users WHERE deleted_at IS NULL GROUP BY level ORDER BY level";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        List<XpDistributionResponse.LevelCount> levels = new ArrayList<>();
        for (Object[] row : rows) {
            int level = ((Number) row[0]).intValue();
            long userCount = ((Number) row[1]).longValue();
            levels.add(new XpDistributionResponse.LevelCount(level, userCount));
        }

        return new XpDistributionResponse(List.copyOf(levels));
    }

    public FeedStatsResponse getFeedStats() {
        long totalFeeds = countFrom("tech_feeds");

        String categorySql = "SELECT category, COUNT(*) AS cnt FROM tech_feeds WHERE deleted_at IS NULL GROUP BY category ORDER BY cnt DESC";

        @SuppressWarnings("unchecked")
        List<Object[]> categoryRows = em.createNativeQuery(categorySql).getResultList();

        List<FeedStatsResponse.FeedCategoryCount> categories = new ArrayList<>();
        for (Object[] row : categoryRows) {
            categories.add(new FeedStatsResponse.FeedCategoryCount(
                    (String) row[0], ((Number) row[1]).longValue()
            ));
        }

        String avgSql = "SELECT AVG(like_count), AVG(comment_count) FROM tech_feeds WHERE deleted_at IS NULL";
        Object[] avgRow = (Object[]) em.createNativeQuery(avgSql).getSingleResult();

        double avgLikes = avgRow[0] != null ? ((Number) avgRow[0]).doubleValue() : 0.0;
        double avgComments = avgRow[1] != null ? ((Number) avgRow[1]).doubleValue() : 0.0;

        return new FeedStatsResponse(totalFeeds, List.copyOf(categories), avgLikes, avgComments);
    }

    // ── private helpers ──

    private long countFrom(String table) {
        if (!TYPE_TO_TABLE.containsValue(table)) {
            throw new IllegalArgumentException("Invalid table name: " + table);
        }
        return ((Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + table + " WHERE deleted_at IS NULL"
        ).getSingleResult()).longValue();
    }

    private long countActiveUsers(int days) {
        String sql = "SELECT COUNT(DISTINCT author_user_id) FROM (" +
                "  SELECT author_user_id FROM questions WHERE created_at >= NOW() - INTERVAL :days DAY AND deleted_at IS NULL" +
                "  UNION ALL" +
                "  SELECT author_user_id FROM answers WHERE created_at >= NOW() - INTERVAL :days DAY AND deleted_at IS NULL" +
                "  UNION ALL" +
                "  SELECT author_user_id FROM tech_feeds WHERE created_at >= NOW() - INTERVAL :days DAY AND deleted_at IS NULL" +
                ") t";

        return ((Number) em.createNativeQuery(sql)
                .setParameter("days", days)
                .getSingleResult()).longValue();
    }
}
