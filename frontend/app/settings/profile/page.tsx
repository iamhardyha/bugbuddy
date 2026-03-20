'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Input, Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { apiFetch } from '@/lib/api';
import { getAccessToken, clearTokens } from '@/lib/auth';
import { updateProfile, deactivateAccount } from '@/lib/users';
import { getMyApplication } from '@/lib/mentor';
import { useModal } from '@/components/common/ModalProvider';
import layoutStyles from '@/components/common/Layout.module.css';
import formStyles from '@/components/question/QuestionForm.module.css';
import type { UserProfile } from '@/types/user';
import type { MentorApplication } from '@/types/mentor';

const { Text } = Typography;
const { TextArea } = Input;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { confirm } = useModal();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [deactivating, setDeactivating] = useState(false);

  const [mentorApp, setMentorApp] = useState<MentorApplication | null>(null);
  const [mentorLoading, setMentorLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    apiFetch<UserProfile>('/api/auth/me').then(res => {
      if (res.success && res.data) {
        setCurrentUser(res.data);
        setNickname(res.data.nickname);
        setBio(res.data.bio ?? '');
      } else {
        router.replace('/');
      }
      setLoading(false);
    });
    getMyApplication().then(res => {
      if (res.success) {
        setMentorApp(res.data ?? null);
      }
      setMentorLoading(false);
    });
  }, [router]);

  async function handleSave() {
    if (!nickname.trim()) {
      setSaveError('닉네임을 입력해주세요.');
      return;
    }
    if (nickname.trim().length < 2 || nickname.trim().length > 40) {
      setSaveError('닉네임은 2~40자 이내여야 합니다.');
      return;
    }
    if (bio.length > 280) {
      setSaveError('자기소개는 280자 이내여야 합니다.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const res = await updateProfile({ nickname: nickname.trim(), bio: bio.trim() || null });

    if (res.success) {
      setSaveSuccess(true);
      if (currentUser) setCurrentUser({ ...currentUser, nickname: nickname.trim(), bio: bio.trim() || null });
    } else {
      setSaveError(res.error?.message ?? '저장에 실패했습니다.');
    }
    setSaving(false);
  }

  async function handleDeactivate() {
    const ok = await confirm({
      title: '정말 탈퇴하시겠어요?',
      message: '탈퇴 후에는 로그인할 수 없습니다.\n작성한 질문과 답변은 "탈퇴한 유저"로 표시됩니다.',
      variant: 'danger',
      confirmLabel: '탈퇴하기',
    });
    if (!ok) return;

    setDeactivating(true);
    const res = await deactivateAccount();
    if (res.success) {
      clearTokens();
      router.replace('/');
    } else {
      setDeactivating(false);
    }
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

  return (
    <div className="page-root">
      <main className={layoutStyles.formPageMain}>
        {/* Back button */}
        <Flex align="center" gap={8} style={{ marginBottom: 24 }}>
          <Button
            type="text"
            size="small"
            onClick={() => currentUser ? router.push(`/users/${currentUser.id}`) : router.back()}
            style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '0 4px' }}
          >
            ← 프로필로 돌아가기
          </Button>
        </Flex>

        {/* Profile Edit Section */}
        <div
          style={{
            borderRadius: 14,
            border: '1px solid var(--border-faint)',
            background: 'var(--bg-surface)',
            padding: '28px 28px',
            marginBottom: 20,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Text
            style={{
              display: 'block',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 20,
            }}
          >
            프로필 수정
          </Text>

          <Flex vertical gap={16}>
            {/* Nickname */}
            <div className={formStyles.formField}>
              <label className={formStyles.formLabel}>
                닉네임 <span className={formStyles.formLabelRequired}>*</span>
              </label>
              <Input
                value={nickname}
                onChange={e => {
                  setNickname(e.target.value);
                  setSaveError(null);
                  setSaveSuccess(false);
                }}
                placeholder="닉네임을 입력하세요"
                maxLength={40}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
              />
              <Text style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                {nickname.length} / 40자 (최소 2자)
              </Text>
            </div>

            {/* Bio */}
            <div className={formStyles.formField}>
              <label className={formStyles.formLabel}>자기소개</label>
              <TextArea
                value={bio}
                onChange={e => {
                  setBio(e.target.value);
                  setSaveError(null);
                  setSaveSuccess(false);
                }}
                placeholder="간단한 자기소개를 작성해주세요"
                maxLength={280}
                rows={3}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />
              <Text style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                {bio.length} / 280자
              </Text>
            </div>

            {/* Feedback */}
            {saveError && (
              <Text style={{ fontSize: 13, color: 'var(--error-text)' }}>{saveError}</Text>
            )}
            {saveSuccess && (
              <Text style={{ fontSize: 13, color: 'var(--status-open)' }}>✓ 저장됐습니다.</Text>
            )}

            <div className={layoutStyles.formActions}>
              <Button
                onClick={handleSave}
                loading={saving}
                type="primary"
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', fontSize: 13 }}
              >
                저장
              </Button>
            </div>
          </Flex>
        </div>

        {/* Mentor Status */}
        {!mentorLoading && (
          <div
            style={{
              borderRadius: 14,
              border: '1px solid var(--border-faint)',
              background: 'var(--bg-surface)',
              padding: '24px 28px',
              marginBottom: 20,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {!mentorApp && (
              <Flex align="center" justify="space-between" gap={12}>
                <div>
                  <Text
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    인증 멘토가 되어보세요
                  </Text>
                  <Text style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                    경험을 나누고 후배 개발자를 도와주세요.
                  </Text>
                </div>
                <Button type="primary" onClick={() => router.push('/mentor/apply')}>
                  멘토 신청하기
                </Button>
              </Flex>
            )}

            {mentorApp?.status === 'PENDING' && (
              <Flex align="center" justify="space-between" gap={12}>
                <Flex align="center" gap={8}>
                  <span style={{ fontSize: 18 }}>⏳</span>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    심사 진행 중입니다
                  </Text>
                </Flex>
                <Button type="link" onClick={() => router.push('/mentor/apply')} style={{ padding: 0 }}>
                  상태 확인
                </Button>
              </Flex>
            )}

            {mentorApp?.status === 'APPROVED' && (
              <Flex align="center" gap={8}>
                <span style={{ fontSize: 18 }}>🎓</span>
                <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  인증 멘토
                </Text>
              </Flex>
            )}

            {mentorApp?.status === 'REJECTED' && (
              <Flex align="center" justify="space-between" gap={12}>
                <Flex align="center" gap={8}>
                  <span style={{ fontSize: 18 }}>❌</span>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    반려됨
                  </Text>
                </Flex>
                <Button type="link" onClick={() => router.push('/mentor/apply')} style={{ padding: 0 }}>
                  재신청하기
                </Button>
              </Flex>
            )}
          </div>
        )}

        {/* Danger Zone */}
        <div
          style={{
            borderRadius: 14,
            border: '1px solid var(--error-bg)',
            background: 'var(--bg-surface)',
            padding: '24px 28px',
          }}
        >
          <Text
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--error-text)',
              marginBottom: 8,
            }}
          >
            위험 구역
          </Text>
          <Text
            style={{
              display: 'block',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 16,
              lineHeight: 1.65,
            }}
          >
            탈퇴하면 계정에 접근할 수 없습니다.<br />
            작성한 질문과 답변은 삭제되지 않고 <strong>&quot;탈퇴한 유저&quot;</strong>로 표시됩니다.
          </Text>
          <Button
            danger
            onClick={handleDeactivate}
            loading={deactivating}
            style={{ fontSize: 13 }}
          >
            회원 탈퇴
          </Button>
        </div>
      </main>
    </div>
  );
}
