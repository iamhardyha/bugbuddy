'use client';

import { useRouter } from 'next/navigation';
import { Button, Typography, Flex } from 'antd';
import type { MentorApplication } from '@/types/mentor';
import styles from './MentorApply.module.css';

const { Text } = Typography;

interface Props {
  application: MentorApplication;
  compact?: boolean;
  onReapply?: () => void;
}

export default function MentorStatusCard({ application, compact, onReapply }: Props) {
  const router = useRouter();
  const { status, rejectionReason, createdAt, reviewedAt } = application;

  if (status === 'PENDING') {
    return (
      <div className={compact ? styles.compactCard : styles.statusCard}>
        <div className={styles.statusIcon} style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
          ⏳
        </div>
        <Text
          style={{
            display: 'block',
            fontSize: compact ? 14 : 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: compact ? 4 : 8,
          }}
        >
          심사 진행 중
        </Text>
        {!compact && (
          <Text
            style={{
              display: 'block',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            멘토 신청서가 접수되었습니다. 심사 결과는 알림으로 안내드릴게요.
          </Text>
        )}
        <Text style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          신청일: {new Date(createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className={compact ? styles.compactCard : styles.statusCard}>
        <div className={styles.statusIcon} style={{ background: 'rgba(34, 197, 94, 0.12)' }}>
          🎓
        </div>
        <Text
          style={{
            display: 'block',
            fontSize: compact ? 14 : 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: compact ? 4 : 8,
          }}
        >
          인증 멘토입니다
        </Text>
        {!compact && (
          <Button
            type="primary"
            onClick={() => router.push('/settings/profile')}
            style={{ marginTop: 8 }}
          >
            프로필 보기
          </Button>
        )}
      </div>
    );
  }

  // REJECTED
  const reapplyDate = reviewedAt
    ? new Date(new Date(reviewedAt).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const canReapply = reapplyDate ? reapplyDate.getTime() < Date.now() : false;
  const daysLeft = reapplyDate
    ? Math.max(0, Math.ceil((reapplyDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <div className={compact ? styles.compactCard : styles.statusCard}>
      <div className={styles.statusIcon} style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
        ❌
      </div>
      <Text
        style={{
          display: 'block',
          fontSize: compact ? 14 : 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: compact ? 4 : 8,
        }}
      >
        신청이 반려되었습니다
      </Text>

      {!compact && rejectionReason && (
        <div className={styles.reasonBox}>
          <Text style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {rejectionReason}
          </Text>
        </div>
      )}

      {canReapply ? (
        <Button type="primary" onClick={onReapply}>
          재신청하기
        </Button>
      ) : (
        <Button disabled>
          재신청 ({daysLeft}일 후)
        </Button>
      )}
    </div>
  );
}
