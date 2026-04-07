'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, message, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import FeedDrawer from '@/components/admin/FeedDrawer';
import type { AdminFeed } from '@/types/admin';
import {
  getAdminFeeds,
  hideFeed,
  restoreFeed,
  deleteFeed,
} from '@/lib/admin/feeds';

function getContentStatusTag(hidden: boolean, deletedAt: string | null) {
  if (deletedAt) return <Tag color="default">삭제됨</Tag>;
  if (hidden) return <Tag color="red">숨김</Tag>;
  return <Tag color="green">정상</Tag>;
}

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<AdminFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedFeed, setSelectedFeed] = useState<AdminFeed | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminFeeds(page - 1, 20);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setFeeds(res.data.content);
      setTotal(res.data.totalElements);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      message.success(successMsg);
      await fetchData();
    } catch {
      message.error('처리 중 오류가 발생했습니다');
    }
  };

  const columns: ColumnsType<AdminFeed> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => (title.length > 50 ? `${title.slice(0, 50)}...` : title),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: '좋아요 / 댓글',
      key: 'likeComment',
      render: (_: unknown, record: AdminFeed) => `${record.likeCount} / ${record.commentCount}`,
    },
    {
      title: '콘텐츠 상태',
      key: 'contentStatus',
      render: (_: unknown, record: AdminFeed) =>
        getContentStatusTag(record.hidden, record.deletedAt),
    },
    {
      title: '작성자',
      dataIndex: 'authorNickname',
      key: 'authorNickname',
    },
    {
      title: '작성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '액션',
      key: 'action',
      render: (_: unknown, record: AdminFeed) => (
        <Space>
          {!record.hidden && !record.deletedAt && (
            <Popconfirm
              title="이 피드를 숨기시겠습니까?"
              onConfirm={() => handleAction(() => hideFeed(record.id), '숨김 처리되었습니다')}
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">숨김</Button>
            </Popconfirm>
          )}
          {(record.hidden || record.deletedAt) && (
            <Popconfirm
              title="이 피드를 복원하시겠습니까?"
              onConfirm={() => handleAction(() => restoreFeed(record.id), '복원되었습니다')}
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">복원</Button>
            </Popconfirm>
          )}
          {!record.deletedAt && (
            <Popconfirm
              title="이 피드를 삭제하시겠습니까?"
              onConfirm={() => handleAction(() => deleteFeed(record.id), '삭제되었습니다')}
              okText="삭제"
              cancelText="취소"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>
                삭제
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Table<AdminFeed>
        columns={columns}
        dataSource={feeds}
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
            setSelectedFeed(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
      />

      <FeedDrawer
        feed={selectedFeed}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onActionComplete={() => {
          setDrawerOpen(false);
          setSelectedFeed(null);
          fetchData();
        }}
      />
    </AdminLayout>
  );
}
