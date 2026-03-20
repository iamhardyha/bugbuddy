'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getAccessToken } from '@/lib/auth';
import { getMyApplication } from '@/lib/mentor';
import MentorApplyForm from '@/components/mentor/MentorApplyForm';
import MentorStatusCard from '@/components/mentor/MentorStatusCard';
import type { MentorApplication } from '@/types/mentor';
import layoutStyles from '@/components/common/Layout.module.css';
import styles from '@/components/mentor/MentorApply.module.css';

const { Text } = Typography;

export default function MentorApplyPage() {
  const router = useRouter();
  const [application, setApplication] = useState<MentorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    getMyApplication().then((res) => {
      if (res.success) {
        setApplication(res.data ?? null);
      }
      setLoading(false);
    });
  }, [router]);

  function handleSuccess(app: MentorApplication) {
    setApplication(app);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className={layoutStyles.pageRoot}>
        <Flex align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
      </div>
    );
  }

  const isRejected = application?.status === 'REJECTED';
  const canReapply = isRejected && application.reviewedAt
    ? new Date(application.reviewedAt).getTime() + 7 * 24 * 60 * 60 * 1000 < Date.now()
    : false;

  return (
    <div className={layoutStyles.pageRoot}>
      <header className={layoutStyles.pageHeader}>
        <div style={{ margin: '0 auto', maxWidth: '640px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button
            type="link"
            onClick={() => router.back()}
            style={{ padding: 0, height: 'auto', fontSize: '13px', color: 'var(--text-tertiary)' }}
          >
            ← 돌아가기
          </Button>
          <span style={{ color: 'var(--border)', fontSize: '16px' }}>|</span>
          <h1 className={layoutStyles.pageTitle}>멘토 신청</h1>
        </div>
      </header>

      <main className={styles.pageLayout}>
        <div className={styles.container}>
          {/* No application → show form */}
          {!application && <MentorApplyForm onSuccess={handleSuccess} />}

          {/* PENDING */}
          {application?.status === 'PENDING' && (
            <MentorStatusCard application={application} />
          )}

          {/* APPROVED */}
          {application?.status === 'APPROVED' && (
            <MentorStatusCard application={application} />
          )}

          {/* REJECTED */}
          {isRejected && canReapply && showForm && (
            <Flex vertical gap={16}>
              <MentorStatusCard application={application} compact />
              <MentorApplyForm onSuccess={handleSuccess} />
            </Flex>
          )}

          {isRejected && canReapply && !showForm && (
            <MentorStatusCard
              application={application}
              onReapply={() => setShowForm(true)}
            />
          )}

          {isRejected && !canReapply && (
            <MentorStatusCard application={application} />
          )}
        </div>
      </main>
    </div>
  );
}
