'use client';

import { useCallback, useEffect, useState } from 'react';
import { Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import MentorDrawer from '@/components/admin/MentorDrawer';
import type { AdminMentorApp } from '@/types/admin';
import { getAdminMentorApps } from '@/lib/admin/mentors';

const { Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

const STATUS_TABS = [
  { key: '', label: '전체' },
  { key: 'PENDING', label: '대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '거절' },
];

export default function AdminMentorsPage() {
  const [apps, setApps] = useState<AdminMentorApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminMentorApps(status || undefined, page - 1, 20);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setApps(res.data.content);
      setTotal(res.data.totalElements);
    } catch {
      // handled silently
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
    setSelectedAppId(null);
    fetchData();
  };

  const columns: ColumnsType<AdminMentorApp> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '신청자',
      dataIndex: 'nickname',
      key: 'nickname',
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
      title: '신청일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <AdminLayout>
      <Title level={3}>멘토 신청 관리</Title>

      <Tabs
        activeKey={status}
        onChange={handleTabChange}
        items={STATUS_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
        style={{ marginBottom: 16 }}
      />

      <Table<AdminMentorApp>
        columns={columns}
        dataSource={apps}
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
            setSelectedAppId(record.id);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
      />

      <MentorDrawer
        applicationId={selectedAppId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onActionComplete={handleActionComplete}
      />
    </AdminLayout>
  );
}
