'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import TrendChart from '@/components/admin/TrendChart';
import {
  getDashboardSummary,
  getTrends,
  getActiveUsers,
  getReportSummary,
  getTagRanking,
  getXpDistribution,
} from '@/lib/admin/dashboard';
import type {
  DashboardSummary,
  TrendPoint,
  ActiveUsers,
  ReportSummary,
  TagCount,
  LevelCount,
} from '@/types/admin';
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Select,
  Table,
  List,
  Badge,
  Typography,
  theme,
} from 'antd';
import {
  UserOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
  ReadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import styles from './page.module.css';

const { Text } = Typography;

const TREND_TYPE_OPTIONS = [
  { label: '사용자', value: 'USERS' },
  { label: '질문', value: 'QUESTIONS' },
  { label: '답변', value: 'ANSWERS' },
  { label: '피드', value: 'FEEDS' },
];

const TREND_PERIOD_OPTIONS = [
  { label: '일간', value: 'DAILY' },
  { label: '주간', value: 'WEEKLY' },
  { label: '월간', value: 'MONTHLY' },
];

const XP_COLUMNS: TableColumnsType<LevelCount> = [
  { title: '레벨', dataIndex: 'level', key: 'level', width: 100 },
  { title: '사용자 수', dataIndex: 'userCount', key: 'userCount' },
];

const PRIMARY_COLOR = '#5548e0';

export default function AdminDashboardPage() {
  const { token } = theme.useToken();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUsers | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [xpDist, setXpDist] = useState<LevelCount[]>([]);

  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  const [trendType, setTrendType] = useState('USERS');
  const [trendPeriod, setTrendPeriod] = useState('DAILY');

  // Fetch all dashboard data except trends
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const [summaryRes, activeRes, reportRes, tagRes, xpRes] = await Promise.all([
        getDashboardSummary(),
        getActiveUsers(),
        getReportSummary(),
        getTagRanking(10),
        getXpDistribution(),
      ]);

      if (cancelled) return;

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (activeRes.success && activeRes.data) setActiveUsers(activeRes.data);
      if (reportRes.success && reportRes.data) setReportSummary(reportRes.data);
      if (tagRes.success && tagRes.data) setTags(tagRes.data.tags);
      if (xpRes.success && xpRes.data) setXpDist(xpRes.data.levels);

      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // Fetch trends when type or period changes
  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);
    getTrends(trendType, trendPeriod).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setTrendPoints(res.data.points);
      }
      setTrendLoading(false);
    });
    return () => { cancelled = true; };
  }, [trendType, trendPeriod]);

  return (
    <AdminLayout>
      {/* Summary stat cards */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="총 사용자"
              value={summary?.totalUsers ?? 0}
              icon={<UserOutlined />}
              loading={loading}
              color="#5548e0"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="총 질문"
              value={summary?.totalQuestions ?? 0}
              icon={<QuestionCircleOutlined />}
              loading={loading}
              color="#0891b2"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="총 답변"
              value={summary?.totalAnswers ?? 0}
              icon={<MessageOutlined />}
              loading={loading}
              color="#059669"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="총 피드"
              value={summary?.totalFeeds ?? 0}
              icon={<ReadOutlined />}
              loading={loading}
              color="#d97706"
            />
          </Col>
        </Row>

        {summary && (
          <div className={styles.todaySignups}>
            <UserAddOutlined className={styles.todaySignupsIcon} />
            <Text type="secondary">
              오늘 가입자: <strong>{summary.todaySignups}명</strong>
            </Text>
          </div>
        )}
      </Spin>

      {/* Trend chart */}
      <Card
        title="트렌드"
        className={styles.trendCard}
        extra={
          <div className={styles.trendSelects}>
            <Select
              value={trendType}
              onChange={setTrendType}
              options={TREND_TYPE_OPTIONS}
              className={styles.trendSelect}
            />
            <Select
              value={trendPeriod}
              onChange={setTrendPeriod}
              options={TREND_PERIOD_OPTIONS}
              className={styles.trendSelect}
            />
          </div>
        }
      >
        <TrendChart data={trendPoints} loading={trendLoading} />
      </Card>

      {/* Active users + Report summary */}
      <Row gutter={[16, 16]} className={styles.sectionRow}>
        <Col xs={24} lg={12}>
          <Card title="활성 사용자" loading={loading}>
            {activeUsers && (
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="일간" value={activeUsers.daily} suffix="명" />
                </Col>
                <Col span={8}>
                  <Statistic title="주간" value={activeUsers.weekly} suffix="명" />
                </Col>
                <Col span={8}>
                  <Statistic title="월간" value={activeUsers.monthly} suffix="명" />
                </Col>
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="신고 현황" loading={loading}>
            {reportSummary && (
              <>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="접수"
                      value={reportSummary.openCount}
                      valueStyle={{ color: token.colorError }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="검토 중"
                      value={reportSummary.reviewingCount}
                      valueStyle={{ color: token.colorWarning }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="처리 완료"
                      value={reportSummary.resolvedCount}
                      valueStyle={{ color: token.colorSuccess }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="반려"
                      value={reportSummary.rejectedCount}
                      valueStyle={{ color: token.colorTextTertiary }}
                    />
                  </Col>
                </Row>
                <div className={styles.pendingMentors}>
                  <Text type="secondary">
                    대기 중 멘토 신청: {reportSummary.pendingMentorApps}건
                  </Text>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Tag ranking + XP distribution */}
      <Row gutter={[16, 16]} className={styles.sectionRow}>
        <Col xs={24} lg={12}>
          <Card title="인기 태그 Top 10" loading={loading}>
            <List
              dataSource={tags}
              renderItem={(tag, index) => (
                <List.Item>
                  <Text>{index + 1}. {tag.tagName}</Text>
                  <Badge count={tag.count} showZero style={{ backgroundColor: PRIMARY_COLOR }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="XP / 레벨 분포" loading={loading}>
            <Table
              dataSource={xpDist}
              columns={XP_COLUMNS}
              rowKey="level"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
