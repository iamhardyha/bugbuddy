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
import type { AdminFeed } from '@/types/admin';
import {
  hideFeed,
  restoreFeed,
  deleteFeed,
} from '@/lib/admin/feeds';
import styles from './FeedDrawer.module.css';

const { Text, Paragraph, Link } = Typography;

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface FeedDrawerProps {
  feed: AdminFeed | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function FeedDrawer({ feed, open, onClose, onActionComplete }: FeedDrawerProps) {
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
      title="피드 상세"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnClose
    >
      {feed ? (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{feed.id}</Descriptions.Item>
            <Descriptions.Item label="제목">{feed.title}</Descriptions.Item>
            <Descriptions.Item label="URL">
              {isSafeUrl(feed.url) ? (
                <Link href={feed.url} target="_blank" rel="noopener noreferrer">{feed.url}</Link>
              ) : (
                <Text type="danger">유효하지 않은 URL</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="카테고리">
              <Tag>{feed.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="좋아요">{feed.likeCount}</Descriptions.Item>
            <Descriptions.Item label="댓글">{feed.commentCount}</Descriptions.Item>
            <Descriptions.Item label="콘텐츠 상태">
              {getContentStatusTag(feed.hidden, feed.deletedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="작성자">{feed.authorNickname} (ID: {feed.authorId})</Descriptions.Item>
            <Descriptions.Item label="작성일">
              {new Date(feed.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            {feed.deletedAt && (
              <Descriptions.Item label="삭제일">
                {new Date(feed.deletedAt).toLocaleString('ko-KR')}
              </Descriptions.Item>
            )}
          </Descriptions>

          {feed.description && (
            <>
              <Typography.Title level={5} className={styles.sectionTitle}>
                설명
              </Typography.Title>
              <div className={styles.bodyContent}>
                <Paragraph ellipsis={{ rows: 5, expandable: true, symbol: '더보기' }}>
                  {feed.description}
                </Paragraph>
              </div>
            </>
          )}

          {feed.comment && (
            <>
              <Typography.Title level={5} className={styles.sectionTitle}>
                작성자 코멘트
              </Typography.Title>
              <div className={styles.bodyContent}>
                <Paragraph ellipsis={{ rows: 5, expandable: true, symbol: '더보기' }}>
                  {feed.comment}
                </Paragraph>
              </div>
            </>
          )}

          <Typography.Title level={5} className={styles.sectionTitle}>
            관리 액션
          </Typography.Title>
          <Space>
            {!feed.hidden && !feed.deletedAt && (
              <Popconfirm
                title="이 피드를 숨기시겠습니까?"
                onConfirm={() => handleAction(() => hideFeed(feed.id), '숨김 처리되었습니다')}
                okText="확인"
                cancelText="취소"
              >
                <Button disabled={actionLoading}>숨김</Button>
              </Popconfirm>
            )}
            {(feed.hidden || feed.deletedAt) && (
              <Popconfirm
                title="이 피드를 복원하시겠습니까?"
                onConfirm={() => handleAction(() => restoreFeed(feed.id), '복원되었습니다')}
                okText="확인"
                cancelText="취소"
              >
                <Button type="primary" disabled={actionLoading}>복원</Button>
              </Popconfirm>
            )}
            {!feed.deletedAt && (
              <Popconfirm
                title="이 피드를 삭제하시겠습니까?"
                onConfirm={() => handleAction(() => deleteFeed(feed.id), '삭제되었습니다')}
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
        <Text type="secondary">피드를 선택해주세요</Text>
      )}
    </Drawer>
  );
}
