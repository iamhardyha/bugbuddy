'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, message, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminAnswer } from '@/types/admin';
import {
  getAdminAnswers,
  hideAnswer,
  restoreAnswer,
  deleteAnswer,
} from '@/lib/admin/answers';

const { Title } = Typography;

function getContentStatusTag(hidden: boolean, deletedAt: string | null) {
  if (deletedAt) return <Tag color="default">삭제됨</Tag>;
  if (hidden) return <Tag color="red">숨김</Tag>;
  return <Tag color="green">정상</Tag>;
}

export default function AdminAnswersPage() {
  const [answers, setAnswers] = useState<AdminAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminAnswers(page - 1, 20);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setAnswers(res.data.content);
      setTotal(res.data.totalElements);
    } catch {
      // handled silently
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

  const columns: ColumnsType<AdminAnswer> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '질문 제목',
      dataIndex: 'questionTitle',
      key: 'questionTitle',
      ellipsis: true,
      render: (title: string) => (title.length > 50 ? `${title.slice(0, 50)}...` : title),
    },
    {
      title: '본문',
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
      render: (body: string) => (body.length > 30 ? `${body.slice(0, 30)}...` : body),
    },
    {
      title: '채택 여부',
      dataIndex: 'accepted',
      key: 'accepted',
      render: (accepted: boolean) =>
        accepted ? <Tag color="green">채택됨</Tag> : <Tag color="default">미채택</Tag>,
    },
    {
      title: '콘텐츠 상태',
      key: 'contentStatus',
      render: (_: unknown, record: AdminAnswer) =>
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
      render: (_: unknown, record: AdminAnswer) => (
        <Space>
          {!record.hidden && !record.deletedAt && (
            <Popconfirm
              title="이 답변을 숨기시겠습니까?"
              onConfirm={() => handleAction(() => hideAnswer(record.id), '숨김 처리되었습니다')}
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">숨김</Button>
            </Popconfirm>
          )}
          {record.hidden && (
            <Popconfirm
              title="이 답변을 복원하시겠습니까?"
              onConfirm={() => handleAction(() => restoreAnswer(record.id), '복원되었습니다')}
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">복원</Button>
            </Popconfirm>
          )}
          {record.deletedAt && (
            <Popconfirm
              title="이 답변을 복원하시겠습니까?"
              onConfirm={() => handleAction(() => restoreAnswer(record.id), '복원되었습니다')}
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">복원</Button>
            </Popconfirm>
          )}
          {!record.deletedAt && (
            <Popconfirm
              title="이 답변을 삭제하시겠습니까?"
              onConfirm={() => handleAction(() => deleteAnswer(record.id), '삭제되었습니다')}
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
      <Title level={3}>답변 관리</Title>
      <Table<AdminAnswer>
        columns={columns}
        dataSource={answers}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          showSizeChanger: false,
          onChange: (p) => setPage(p),
        }}
      />
    </AdminLayout>
  );
}
