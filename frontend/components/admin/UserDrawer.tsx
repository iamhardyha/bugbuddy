'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { AdminUserDetail } from '@/types/admin';
import {
  getAdminUserDetail,
  suspendUser,
  unsuspendUser,
  deactivateUser,
  changeNickname,
  adjustXp,
  changeMentorStatus,
} from '@/lib/admin/users';
import styles from './UserDrawer.module.css';

const { Text } = Typography;

const MENTOR_STATUS_OPTIONS = [
  { value: 'NONE', label: 'NONE' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
];

const MENTOR_TAG_COLOR: Record<string, string> = {
  APPROVED: 'green',
  PENDING: 'orange',
  REJECTED: 'red',
  SUSPENDED: 'volcano',
  NONE: 'default',
};

interface UserDrawerProps {
  userId: number | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function UserDrawer({ userId, open, onClose, onActionComplete }: UserDrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState<string | number>(520);
  useEffect(() => {
    const update = () => setDrawerWidth(window.innerWidth < 640 ? '100%' : 520);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState<number>(1);

  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [deltaXp, setDeltaXp] = useState<number>(0);
  const [xpReason, setXpReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (userId === null) return;
    setLoading(true);
    try {
      const res = await getAdminUserDetail(userId);
      if (!res.success || !res.data) throw new Error(res.error?.message);
      setDetail(res.data);
    } catch {
      message.error('사용자 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId !== null && open) {
      fetchDetail();
    }
  }, [userId, open, fetchDetail]);

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setActionLoading(true);
    try {
      await action();
      message.success(successMsg);
      onActionComplete();
      await fetchDetail();
    } catch {
      message.error('처리 중 오류가 발생했습니다');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (userId === null) return;
    await handleAction(() => suspendUser(userId, suspendDays), '정지 처리되었습니다');
    setSuspendModalOpen(false);
    setSuspendDays(1);
  };

  const handleUnsuspend = async () => {
    if (userId === null) return;
    await handleAction(() => unsuspendUser(userId), '정지가 해제되었습니다');
  };

  const handleChangeNickname = async () => {
    if (userId === null || !newNickname.trim()) return;
    await handleAction(() => changeNickname(userId, newNickname.trim()), '닉네임이 변경되었습니다');
    setNicknameModalOpen(false);
    setNewNickname('');
  };

  const handleAdjustXp = async () => {
    if (userId === null || !xpReason.trim()) return;
    await handleAction(() => adjustXp(userId, deltaXp, xpReason.trim()), 'XP가 조정되었습니다');
    setXpModalOpen(false);
    setDeltaXp(0);
    setXpReason('');
  };

  const handleChangeMentorStatus = async (status: string) => {
    if (userId === null) return;
    await handleAction(() => changeMentorStatus(userId, status), '멘토 상태가 변경되었습니다');
  };

  const handleDeactivate = async () => {
    if (userId === null) return;
    await handleAction(() => deactivateUser(userId), '강제 탈퇴 처리되었습니다');
  };

  const isSuspended =
    detail?.suspendedUntil !== null &&
    detail?.suspendedUntil !== undefined &&
    new Date(detail.suspendedUntil) > new Date();

  return (
    <>
      <Drawer
        title="사용자 상세"
        open={open}
        onClose={onClose}
        width={drawerWidth}
        destroyOnClose
      >
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : detail ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="닉네임">{detail.nickname}</Descriptions.Item>
              <Descriptions.Item label="이메일">{detail.email}</Descriptions.Item>
              <Descriptions.Item label="멘토 상태">
                <Tag color={MENTOR_TAG_COLOR[detail.mentorStatus] ?? 'default'}>
                  {detail.mentorStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="XP">{detail.xp}</Descriptions.Item>
              <Descriptions.Item label="레벨">{detail.level}</Descriptions.Item>
              <Descriptions.Item label="신고 횟수">{detail.reportCount}</Descriptions.Item>
              <Descriptions.Item label="정지 여부">
                {isSuspended ? (
                  <Tag color="red">
                    정지중 (~{new Date(detail.suspendedUntil!).toLocaleDateString('ko-KR')})
                  </Tag>
                ) : (
                  <Tag color="green">미정지</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="가입일">
                {new Date(detail.createdAt).toLocaleDateString('ko-KR')}
              </Descriptions.Item>
              <Descriptions.Item label="Bio">{detail.bio ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="OAuth">{detail.oauthProvider}</Descriptions.Item>
              {detail.deactivatedAt && (
                <Descriptions.Item label="탈퇴일">
                  {new Date(detail.deactivatedAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Typography.Title level={5} className={styles.sectionTitle}>
              최근 신고 내역
            </Typography.Title>
            <List
              size="small"
              bordered
              dataSource={detail.recentReports}
              locale={{ emptyText: '신고 내역이 없습니다' }}
              renderItem={(report) => (
                <List.Item>
                  <Space>
                    <Tag>{report.targetType}</Tag>
                    <Text>{report.reasonCode}</Text>
                    <Tag
                      color={
                        report.status === 'OPEN'
                          ? 'blue'
                          : report.status === 'REVIEWING'
                            ? 'orange'
                            : report.status === 'RESOLVED'
                              ? 'green'
                              : 'default'
                      }
                    >
                      {report.status}
                    </Tag>
                    <Text type="secondary">
                      {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />

            <Typography.Title level={5} className={styles.sectionTitle}>
              관리 액션
            </Typography.Title>
            <Space direction="vertical" className={styles.fullWidth}>
              <Space wrap>
                <Button onClick={() => setSuspendModalOpen(true)} disabled={actionLoading}>
                  정지
                </Button>
                {isSuspended && (
                  <Popconfirm
                    title="정지를 해제하시겠습니까?"
                    onConfirm={handleUnsuspend}
                    okText="확인"
                    cancelText="취소"
                  >
                    <Button disabled={actionLoading}>정지 해제</Button>
                  </Popconfirm>
                )}
                <Button onClick={() => setNicknameModalOpen(true)} disabled={actionLoading}>
                  닉네임 변경
                </Button>
                <Button onClick={() => setXpModalOpen(true)} disabled={actionLoading}>
                  XP 조정
                </Button>
              </Space>

              <Space align="center">
                <Text>멘토 상태:</Text>
                <Select
                  value={detail.mentorStatus}
                  options={MENTOR_STATUS_OPTIONS}
                  onChange={handleChangeMentorStatus}
                  className={styles.mentorSelect}
                  disabled={actionLoading}
                />
              </Space>

              <Popconfirm
                title="강제 탈퇴"
                description="정말 이 사용자를 강제 탈퇴시키겠습니까? 이 작업은 되돌릴 수 없습니다."
                onConfirm={handleDeactivate}
                okText="탈퇴"
                cancelText="취소"
                okButtonProps={{ danger: true }}
              >
                <Button danger disabled={actionLoading}>
                  강제 탈퇴
                </Button>
              </Popconfirm>
            </Space>
          </>
        ) : (
          <Text type="secondary">사용자를 선택해주세요</Text>
        )}
      </Drawer>

      {/* 정지 Modal */}
      <Modal
        title="사용자 정지"
        open={suspendModalOpen}
        onOk={handleSuspend}
        onCancel={() => setSuspendModalOpen(false)}
        confirmLoading={actionLoading}
        okText="정지"
        cancelText="취소"
      >
        <Space direction="vertical" className={styles.fullWidth}>
          <Text>정지 기간 (일):</Text>
          <InputNumber
            min={1}
            max={365}
            value={suspendDays}
            onChange={(v) => setSuspendDays(v ?? 1)}
            className={styles.fullWidth}
          />
        </Space>
      </Modal>

      {/* 닉네임 변경 Modal */}
      <Modal
        title="닉네임 변경"
        open={nicknameModalOpen}
        onOk={handleChangeNickname}
        onCancel={() => setNicknameModalOpen(false)}
        confirmLoading={actionLoading}
        okText="변경"
        cancelText="취소"
      >
        <Space direction="vertical" className={styles.fullWidth}>
          <Text>새 닉네임:</Text>
          <Input
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="새 닉네임 입력"
          />
        </Space>
      </Modal>

      {/* XP 조정 Modal */}
      <Modal
        title="XP 조정"
        open={xpModalOpen}
        onOk={handleAdjustXp}
        onCancel={() => setXpModalOpen(false)}
        confirmLoading={actionLoading}
        okText="조정"
        cancelText="취소"
      >
        <Space direction="vertical" className={styles.fullWidth}>
          <Text>XP 변동량 (음수 가능):</Text>
          <InputNumber
            value={deltaXp}
            onChange={(v) => setDeltaXp(v ?? 0)}
            className={styles.fullWidth}
          />
          <Text>사유:</Text>
          <Input
            value={xpReason}
            onChange={(e) => setXpReason(e.target.value)}
            placeholder="XP 조정 사유 입력"
          />
        </Space>
      </Modal>
    </>
  );
}
