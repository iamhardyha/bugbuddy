'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, message, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminQuestion } from '@/types/admin';
import {
  getAdminQuestions,
  hideQuestion,
  restoreQuestion,
  deleteQuestion,
} from '@/lib/admin/questions';

const { Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'blue',
  SOLVED: 'green',
  CLOSED: 'default',
};

function getContentStatusTag(hidden: boolean, deletedAt: string | null) {
  if (deletedAt) return <Tag color="default">삭제됨</Tag>;
  if (hidden) return <Tag color="red">숨김</Tag>;
  return <Tag color="green">정상</Tag>;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminQuestions(page - 1, 20);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setQuestions(res.data.content);
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

  const columns: ColumnsType<AdminQuestion> = [
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
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
      ),
    },
    {
      title: '콘텐츠 상태',
      key: 'contentStatus',
      render: (_: unknown, record: AdminQuestion) =>
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
      render: (_: unknown, record: AdminQuestion) => (
        <Space>
          {!record.hidden && !record.deletedAt && (
            <Popconfirm
              title="이 질문을 숨기시겠습니까?"
              onConfirm={() => handleAction(() => hideQuestion(record.id), '숨김 처리되었습니다')}
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">숨김</Button>
            </Popconfirm>
          )}
          {record.hidden && (
            <Popconfirm
              title="이 질문을 복원하시겠습니까?"
              onConfirm={() =>
                handleAction(() => restoreQuestion(record.id), '복원되었습니다')
              }
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">복원</Button>
            </Popconfirm>
          )}
          {record.deletedAt && (
            <Popconfirm
              title="이 질문을 복원하시겠습니까?"
              onConfirm={() =>
                handleAction(() => restoreQuestion(record.id), '복원되었습니다')
              }
              okText="확인"
              cancelText="취소"
            >
              <Button size="small">복원</Button>
            </Popconfirm>
          )}
          {!record.deletedAt && (
            <Popconfirm
              title="이 질문을 삭제하시겠습니까?"
              onConfirm={() =>
                handleAction(() => deleteQuestion(record.id), '삭제되었습니다')
              }
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
      <Title level={3}>질문 관리</Title>
      <Table<AdminQuestion>
        columns={columns}
        dataSource={questions}
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
