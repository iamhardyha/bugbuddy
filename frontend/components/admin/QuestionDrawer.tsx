'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { AdminQuestion } from '@/types/admin';
import {
  hideQuestion,
  restoreQuestion,
  deleteQuestion,
} from '@/lib/admin/questions';
import styles from './QuestionDrawer.module.css';

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'blue',
  SOLVED: 'green',
  CLOSED: 'default',
};

interface QuestionDrawerProps {
  question: AdminQuestion | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function QuestionDrawer({ question, open, onClose, onActionComplete }: QuestionDrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState<string | number>(600);
  useEffect(() => {
    const update = () => setDrawerWidth(window.innerWidth < 640 ? '100%' : 600);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setActionLoading(true);
    try {
      await action();
      message.success(successMsg);
      onActionComplete();
    } catch {
      message.error('처리 중 오류가 발생했습니다');
    } finally {
      setActionLoading(false);
    }
  };

  function getContentStatusTag(hidden: boolean, deletedAt: string | null) {
    if (deletedAt) return <Tag color="default">삭제됨</Tag>;
    if (hidden) return <Tag color="red">숨김</Tag>;
    return <Tag color="green">정상</Tag>;
  }

  return (
    <Drawer
      title="질문 상세"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnClose
    >
      {question ? (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{question.id}</Descriptions.Item>
            <Descriptions.Item label="제목">{question.title}</Descriptions.Item>
            <Descriptions.Item label="카테고리">
              <Tag>{question.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="상태">
              <Tag color={STATUS_COLOR[question.status] ?? 'default'}>{question.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="질문 유형">{question.questionType}</Descriptions.Item>
            <Descriptions.Item label="조회수">{question.viewCount}</Descriptions.Item>
            <Descriptions.Item label="콘텐츠 상태">
              {getContentStatusTag(question.hidden, question.deletedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="작성자">{question.authorNickname} (ID: {question.authorId})</Descriptions.Item>
            <Descriptions.Item label="작성일">
              {new Date(question.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            {question.deletedAt && (
              <Descriptions.Item label="삭제일">
                {new Date(question.deletedAt).toLocaleString('ko-KR')}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Typography.Title level={5} className={styles.sectionTitle}>
            본문
          </Typography.Title>
          <div className={styles.bodyContent}>
            <Paragraph ellipsis={{ rows: 15, expandable: true, symbol: '더보기' }}>
              {question.body}
            </Paragraph>
          </div>

          <Typography.Title level={5} className={styles.sectionTitle}>
            관리 액션
          </Typography.Title>
          <Space>
            {!question.hidden && !question.deletedAt && (
              <Popconfirm
                title="이 질문을 숨기시겠습니까?"
                onConfirm={() => handleAction(() => hideQuestion(question.id), '숨김 처리되었습니다')}
                okText="확인"
                cancelText="취소"
              >
                <Button disabled={actionLoading}>숨김</Button>
              </Popconfirm>
            )}
            {(question.hidden || question.deletedAt) && (
              <Popconfirm
                title="이 질문을 복원하시겠습니까?"
                onConfirm={() => handleAction(() => restoreQuestion(question.id), '복원되었습니다')}
                okText="확인"
                cancelText="취소"
              >
                <Button type="primary" disabled={actionLoading}>복원</Button>
              </Popconfirm>
            )}
            {!question.deletedAt && (
              <Popconfirm
                title="이 질문을 삭제하시겠습니까?"
                onConfirm={() => handleAction(() => deleteQuestion(question.id), '삭제되었습니다')}
                okText="삭제"
                cancelText="취소"
                okButtonProps={{ danger: true }}
              >
                <Button danger disabled={actionLoading}>삭제</Button>
              </Popconfirm>
            )}
          </Space>
        </>
      ) : (
        <Text type="secondary">질문을 선택해주세요</Text>
      )}
    </Drawer>
  );
}
