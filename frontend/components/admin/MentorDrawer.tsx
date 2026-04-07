'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { AdminMentorApp } from '@/types/admin';
import { getAdminMentorApp, approveMentor, rejectMentor } from '@/lib/admin/mentors';
import styles from './MentorDrawer.module.css';

const { Text } = Typography;
const { TextArea } = Input;

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

const LINK_TYPE_LABEL: Record<string, string> = {
  GITHUB: 'GitHub',
  BLOG: '블로그',
  PORTFOLIO: '포트폴리오',
  LINKEDIN: 'LinkedIn',
  OTHER: '기타',
};

interface MentorDrawerProps {
  applicationId: number | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function MentorDrawer({ applicationId, open, onClose, onActionComplete }: MentorDrawerProps) {
  const [detail, setDetail] = useState<AdminMentorApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDetail = useCallback(async () => {
    if (applicationId === null) return;
    setLoading(true);
    try {
      const res = await getAdminMentorApp(applicationId);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setDetail(res.data);
    } catch {
      message.error('멘토 신청 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId !== null && open) {
      fetchDetail();
    }
  }, [applicationId, open, fetchDetail]);

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

  const handleApprove = async () => {
    if (applicationId === null) return;
    await handleAction(() => approveMentor(applicationId), '멘토 신청이 승인되었습니다');
  };

  const handleReject = async () => {
    if (applicationId === null || !rejectionReason.trim()) return;
    await handleAction(
      () => rejectMentor(applicationId, rejectionReason.trim()),
      '멘토 신청이 거절되었습니다',
    );
    setRejectModalOpen(false);
    setRejectionReason('');
  };

  return (
    <>
      <Drawer
        title="멘토 신청 상세"
        open={open}
        onClose={onClose}
        width={560}
        destroyOnClose
      >
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : detail ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="신청자 닉네임">{detail.nickname}</Descriptions.Item>
              <Descriptions.Item label="상태">
                <Tag color={STATUS_COLOR[detail.status] ?? 'default'}>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="신청일">
                {new Date(detail.createdAt).toLocaleDateString('ko-KR')}
              </Descriptions.Item>
              {detail.reviewerUserId !== null && (
                <Descriptions.Item label="심사자 ID">{detail.reviewerUserId}</Descriptions.Item>
              )}
              {detail.reviewedAt && (
                <Descriptions.Item label="심사일">
                  {new Date(detail.reviewedAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              )}
              {detail.rejectionReason && (
                <Descriptions.Item label="거절 사유">{detail.rejectionReason}</Descriptions.Item>
              )}
            </Descriptions>

            <Card title="질문 1 답변" size="small" className={styles.q1Card}>
              <Text className={styles.preWrap}>{detail.q1Answer}</Text>
            </Card>

            <Card title="질문 2 답변" size="small" className={styles.q2Card}>
              <Text className={styles.preWrap}>{detail.q2Answer}</Text>
            </Card>

            {detail.links.length > 0 && (
              <>
                <Typography.Title level={5} className={styles.sectionTitle}>
                  포트폴리오 링크
                </Typography.Title>
                <List
                  size="small"
                  bordered
                  dataSource={detail.links}
                  renderItem={(link) => (
                    <List.Item>
                      <Space>
                        <Tag>{LINK_TYPE_LABEL[link.linkType] ?? link.linkType}</Tag>
                        {isSafeUrl(link.url) ? (
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.url}
                          </a>
                        ) : (
                          <Text type="danger">유효하지 않은 URL</Text>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              </>
            )}

            {detail.status === 'PENDING' && (
              <>
                <Typography.Title level={5} className={styles.sectionTitle}>
                  관리 액션
                </Typography.Title>
                <Space>
                  <Popconfirm
                    title="이 멘토 신청을 승인하시겠습니까?"
                    onConfirm={handleApprove}
                    okText="승인"
                    cancelText="취소"
                  >
                    <Button type="primary" disabled={actionLoading}>
                      승인
                    </Button>
                  </Popconfirm>
                  <Button
                    danger
                    disabled={actionLoading}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    거절
                  </Button>
                </Space>
              </>
            )}
          </>
        ) : (
          <Text type="secondary">멘토 신청을 선택해주세요</Text>
        )}
      </Drawer>

      <Modal
        title="멘토 신청 거절"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectionReason('');
        }}
        confirmLoading={actionLoading}
        okText="거절"
        cancelText="취소"
        okButtonProps={{ danger: true, disabled: !rejectionReason.trim() }}
      >
        <Space direction="vertical" className={styles.fullWidth}>
          <Text>거절 사유:</Text>
          <TextArea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="거절 사유를 입력해주세요"
          />
        </Space>
      </Modal>
    </>
  );
}
