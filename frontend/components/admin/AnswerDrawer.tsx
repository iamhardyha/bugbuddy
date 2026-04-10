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
import type { AdminAnswer } from '@/types/admin';
import {
  hideAnswer,
  restoreAnswer,
  deleteAnswer,
} from '@/lib/admin/answers';
import styles from './AnswerDrawer.module.css';

const { Text, Paragraph } = Typography;

interface AnswerDrawerProps {
  answer: AdminAnswer | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function AnswerDrawer({ answer, open, onClose, onActionComplete }: AnswerDrawerProps) {
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
      title="답변 상세"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnClose
    >
      {answer ? (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{answer.id}</Descriptions.Item>
            <Descriptions.Item label="질문 ID">{answer.questionId}</Descriptions.Item>
            <Descriptions.Item label="질문 제목">{answer.questionTitle}</Descriptions.Item>
            <Descriptions.Item label="채택 여부">
              {answer.accepted
                ? <Tag color="green">채택됨</Tag>
                : <Tag color="default">미채택</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="콘텐츠 상태">
              {getContentStatusTag(answer.hidden, answer.deletedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="작성자">{answer.authorNickname} (ID: {answer.authorId})</Descriptions.Item>
            <Descriptions.Item label="작성일">
              {new Date(answer.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            {answer.deletedAt && (
              <Descriptions.Item label="삭제일">
                {new Date(answer.deletedAt).toLocaleString('ko-KR')}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Typography.Title level={5} className={styles.sectionTitle}>
            본문
          </Typography.Title>
          <div className={styles.bodyContent}>
            <Paragraph ellipsis={{ rows: 15, expandable: true, symbol: '더보기' }}>
              {answer.body}
            </Paragraph>
          </div>

          <Typography.Title level={5} className={styles.sectionTitle}>
            관리 액션
          </Typography.Title>
          <Space>
            {!answer.hidden && !answer.deletedAt && (
              <Popconfirm
                title="이 답변을 숨기시겠습니까?"
                onConfirm={() => handleAction(() => hideAnswer(answer.id), '숨김 처리되었습니다')}
                okText="확인"
                cancelText="취소"
              >
                <Button disabled={actionLoading}>숨김</Button>
              </Popconfirm>
            )}
            {(answer.hidden || answer.deletedAt) && (
              <Popconfirm
                title="이 답변을 복원하시겠습니까?"
                onConfirm={() => handleAction(() => restoreAnswer(answer.id), '복원되었습니다')}
                okText="확인"
                cancelText="취소"
              >
                <Button type="primary" disabled={actionLoading}>복원</Button>
              </Popconfirm>
            )}
            {!answer.deletedAt && (
              <Popconfirm
                title="이 답변을 삭제하시겠습니까?"
                onConfirm={() => handleAction(() => deleteAnswer(answer.id), '삭제되었습니다')}
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
        <Text type="secondary">답변을 선택해주세요</Text>
      )}
    </Drawer>
  );
}
