'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { AdminReport } from '@/types/admin';
import { reviewReport, resolveReport, rejectReport } from '@/lib/admin/reports';
import styles from './ReportDrawer.module.css';

const { Text } = Typography;

const TARGET_TYPE_COLOR: Record<string, string> = {
  QUESTION: 'blue',
  ANSWER: 'green',
  CHAT_MESSAGE: 'purple',
  USER: 'orange',
};

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

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'blue',
  REVIEWING: 'orange',
  RESOLVED: 'green',
  REJECTED: 'default',
};

interface ReportDrawerProps {
  report: AdminReport | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function ReportDrawer({ report, open, onClose, onActionComplete }: ReportDrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState<string | number>(520);
  useEffect(() => {
    const update = () => setDrawerWidth(window.innerWidth < 640 ? '100%' : 520);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [suspend, setSuspend] = useState(false);
  const [suspendDays, setSuspendDays] = useState<number>(1);

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

  const handleReview = async () => {
    if (!report) return;
    await handleAction(() => reviewReport(report.id), '검토 상태로 변경되었습니다');
  };

  const handleReject = async () => {
    if (!report) return;
    await handleAction(() => rejectReport(report.id), '신고가 기각되었습니다');
  };

  const handleResolve = async () => {
    if (!report) return;
    await handleAction(
      () => resolveReport(report.id, suspend, suspend ? suspendDays : 0),
      '신고가 처리 완료되었습니다',
    );
    setResolveModalOpen(false);
    setSuspend(false);
    setSuspendDays(1);
  };

  return (
    <>
      <Drawer
        title="신고 상세"
        open={open}
        onClose={onClose}
        width={drawerWidth}
        destroyOnClose
      >
        {report ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="신고 ID">{report.id}</Descriptions.Item>
              <Descriptions.Item label="대상 타입">
                <Tag color={TARGET_TYPE_COLOR[report.targetType] ?? 'default'}>
                  {report.targetType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="대상 ID">{report.targetId}</Descriptions.Item>
              <Descriptions.Item label="사유 코드">
                <Tag color={REASON_CODE_COLOR[report.reasonCode] ?? 'default'}>
                  {REASON_CODE_LABEL[report.reasonCode] ?? report.reasonCode}
                </Tag>
              </Descriptions.Item>
              {report.reasonDetail && (
                <Descriptions.Item label="사유 상세">{report.reasonDetail}</Descriptions.Item>
              )}
              <Descriptions.Item label="신고자 ID">{report.reporterUserId}</Descriptions.Item>
              <Descriptions.Item label="상태">
                <Tag color={STATUS_COLOR[report.status] ?? 'default'}>{report.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="신고일">
                {new Date(report.createdAt).toLocaleDateString('ko-KR')}
              </Descriptions.Item>
              {report.resolvedAt && (
                <Descriptions.Item label="처리일">
                  {new Date(report.resolvedAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              )}
              {report.resolverUserId !== null && (
                <Descriptions.Item label="처리자 ID">{report.resolverUserId}</Descriptions.Item>
              )}
            </Descriptions>

            {(report.status === 'OPEN' || report.status === 'REVIEWING') && (
              <>
                <Typography.Title level={5} className={styles.sectionTitle}>
                  관리 액션
                </Typography.Title>
                <Space>
                  {report.status === 'OPEN' && (
                    <Popconfirm
                      title="검토를 시작하시겠습니까?"
                      onConfirm={handleReview}
                      okText="확인"
                      cancelText="취소"
                    >
                      <Button type="primary" disabled={actionLoading}>
                        검토 시작
                      </Button>
                    </Popconfirm>
                  )}
                  {report.status === 'REVIEWING' && (
                    <Button
                      type="primary"
                      disabled={actionLoading}
                      onClick={() => setResolveModalOpen(true)}
                    >
                      처리 완료
                    </Button>
                  )}
                  <Popconfirm
                    title="이 신고를 기각하시겠습니까?"
                    onConfirm={handleReject}
                    okText="기각"
                    cancelText="취소"
                  >
                    <Button disabled={actionLoading}>기각</Button>
                  </Popconfirm>
                </Space>
              </>
            )}
          </>
        ) : (
          <Text type="secondary">신고를 선택해주세요</Text>
        )}
      </Drawer>

      <Modal
        title="신고 처리 완료"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => {
          setResolveModalOpen(false);
          setSuspend(false);
          setSuspendDays(1);
        }}
        confirmLoading={actionLoading}
        okText="처리 완료"
        cancelText="취소"
      >
        <Space direction="vertical" className={styles.fullWidth}>
          <Checkbox checked={suspend} onChange={(e) => setSuspend(e.target.checked)}>
            사용자 정지
          </Checkbox>
          {suspend && (
            <>
              <Text>정지 기간 (일):</Text>
              <InputNumber
                min={1}
                max={365}
                value={suspendDays}
                onChange={(v) => setSuspendDays(v ?? 1)}
                className={styles.fullWidth}
              />
            </>
          )}
        </Space>
      </Modal>
    </>
  );
}
