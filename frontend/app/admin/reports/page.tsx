'use client';

import { useCallback, useEffect, useState } from 'react';
import { message, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import ReportDrawer from '@/components/admin/ReportDrawer';
import type { AdminReport } from '@/types/admin';
import { getAdminReports } from '@/lib/admin/reports';
import styles from './page.module.css';

const REASON_CODE_LABEL: Record<string, string> = {
  SPAM: '스팸',
  ABUSE: '욕설/비하',
  AD: '광고',
  IRRELEVANT: '무관',
  PERSONAL_INFO: '개인정보',
  LOW_QUALITY: '저품질',
  OTHER: '기타',
};

const REASON_CODE_COLOR: Record<string, string> = {
  SPAM: 'red',
  ABUSE: 'volcano',
  AD: 'orange',
  IRRELEVANT: 'default',
  PERSONAL_INFO: 'purple',
  LOW_QUALITY: 'gold',
  OTHER: 'default',
};

const TARGET_TYPE_COLOR: Record<string, string> = {
  QUESTION: 'blue',
  ANSWER: 'green',
  CHAT_MESSAGE: 'purple',
  USER: 'orange',
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'blue',
  REVIEWING: 'orange',
  RESOLVED: 'green',
  REJECTED: 'default',
};

const STATUS_TABS = [
  { key: '', label: '전체' },
  { key: 'OPEN', label: '대기' },
  { key: 'REVIEWING', label: '검토중' },
  { key: 'RESOLVED', label: '처리완료' },
  { key: 'REJECTED', label: '기각' },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReports(status || undefined, page - 1, 20);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setReports(res.data.content);
      setTotal(res.data.totalElements);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setStatus(key);
    setPage(1);
  };

  const handleActionComplete = () => {
    setDrawerOpen(false);
    setSelectedReport(null);
    fetchData();
  };

  const columns: ColumnsType<AdminReport> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '대상 타입',
      dataIndex: 'targetType',
      key: 'targetType',
      render: (type: string) => (
        <Tag color={TARGET_TYPE_COLOR[type] ?? 'default'}>{type}</Tag>
      ),
    },
    {
      title: '대상 ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 80,
    },
    {
      title: '사유',
      dataIndex: 'reasonCode',
      key: 'reasonCode',
      render: (code: string) => (
        <Tag color={REASON_CODE_COLOR[code] ?? 'default'}>
          {REASON_CODE_LABEL[code] ?? code}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>
      ),
    },
    {
      title: '신고일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <AdminLayout>
      <Tabs
        activeKey={status}
        onChange={handleTabChange}
        items={STATUS_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
        className={styles.tabs}
      />

      <Table<AdminReport>
        columns={columns}
        dataSource={reports}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          showSizeChanger: false,
          onChange: (p) => setPage(p),
        }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedReport(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
      />

      <ReportDrawer
        report={selectedReport}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onActionComplete={handleActionComplete}
      />
    </AdminLayout>
  );
}
