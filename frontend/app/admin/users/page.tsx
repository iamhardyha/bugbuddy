'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import UserDrawer from '@/components/admin/UserDrawer';
import type { AdminUser } from '@/types/admin';
import { getAdminUsers } from '@/lib/admin/users';

const { Title } = Typography;

const MENTOR_TAG_COLOR: Record<string, string> = {
  APPROVED: 'green',
  PENDING: 'orange',
  REJECTED: 'red',
  SUSPENDED: 'volcano',
  NONE: 'default',
};

const MENTOR_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'NONE', label: 'NONE' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
];

const SUSPENDED_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'true', label: '정지중' },
  { value: 'false', label: '미정지' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [mentorStatus, setMentorStatus] = useState('');
  const [suspended, setSuspended] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        keyword?: string;
        mentorStatus?: string;
        suspended?: boolean;
        page: number;
        size: number;
      } = {
        page: page - 1,
        size: 20,
      };
      if (keyword) params.keyword = keyword;
      if (mentorStatus) params.mentorStatus = mentorStatus;
      if (suspended) params.suspended = suspended === 'true';

      const res = await getAdminUsers(params);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setUsers(res.data.content);
      setTotal(res.data.totalElements);
    } catch {
      // error handled silently; table shows empty
    } finally {
      setLoading(false);
    }
  }, [page, keyword, mentorStatus, suspended]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleMentorStatusChange = (value: string) => {
    setMentorStatus(value);
    setPage(1);
  };

  const handleSuspendedChange = (value: string) => {
    setSuspended(value);
    setPage(1);
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: '닉네임',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '멘토 상태',
      dataIndex: 'mentorStatus',
      key: 'mentorStatus',
      render: (status: string) => (
        <Tag color={MENTOR_TAG_COLOR[status] ?? 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'XP / 레벨',
      key: 'xpLevel',
      render: (_: unknown, record: AdminUser) => `${record.xp} / Lv.${record.level}`,
    },
    {
      title: '신고 횟수',
      dataIndex: 'reportCount',
      key: 'reportCount',
    },
    {
      title: '정지 여부',
      key: 'suspended',
      render: (_: unknown, record: AdminUser) => {
        const isSuspended =
          record.suspendedUntil !== null && new Date(record.suspendedUntil) > new Date();
        return isSuspended ? <Tag color="red">정지중</Tag> : <Tag color="green">미정지</Tag>;
      },
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <AdminLayout>
      <Title level={3}>사용자 관리</Title>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="닉네임 또는 이메일 검색"
          onSearch={handleSearch}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          value={mentorStatus}
          onChange={handleMentorStatusChange}
          options={MENTOR_STATUS_OPTIONS}
          style={{ width: 150 }}
          placeholder="멘토 상태"
        />
        <Select
          value={suspended}
          onChange={handleSuspendedChange}
          options={SUSPENDED_OPTIONS}
          style={{ width: 130 }}
          placeholder="정지 여부"
        />
      </div>

      <Table<AdminUser>
        columns={columns}
        dataSource={users}
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
            setSelectedUserId(record.id);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
      />

      <UserDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onActionComplete={fetchData}
      />
    </AdminLayout>
  );
}
