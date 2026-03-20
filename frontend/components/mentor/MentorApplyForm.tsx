'use client';

import { useState } from 'react';
import { Button, Input, Select, Alert, Flex, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { applyMentor } from '@/lib/mentor';
import type { MentorApplication, MentorApplyRequest, MentorLink, MentorApplicationLinkType } from '@/types/mentor';
import styles from './MentorApply.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const LINK_TYPE_OPTIONS: { label: string; value: MentorApplicationLinkType }[] = [
  { label: 'GitHub', value: 'GITHUB' },
  { label: 'LinkedIn', value: 'LINKEDIN' },
  { label: '블로그', value: 'BLOG' },
  { label: '포트폴리오', value: 'PORTFOLIO' },
  { label: '기타', value: 'OTHER' },
];

interface Props {
  onSuccess: (app: MentorApplication) => void;
}

export default function MentorApplyForm({ onSuccess }: Props) {
  const [links, setLinks] = useState<MentorLink[]>([{ linkType: 'GITHUB', url: '' }]);
  const [q1Answer, setQ1Answer] = useState('');
  const [q2Answer, setQ2Answer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function addLink() {
    setLinks([...links, { linkType: 'GITHUB', url: '' }]);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  function updateLink(index: number, field: keyof MentorLink, value: string) {
    setLinks(links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link,
    ));
  }

  async function handleSubmit() {
    setError('');

    const validLinks = links.filter(l => l.url.trim());
    if (validLinks.length === 0) {
      setError('최소 1개의 링크를 입력해주세요.');
      return;
    }
    if (!q1Answer.trim()) {
      setError('첫 번째 질문에 답변해주세요.');
      return;
    }
    if (!q2Answer.trim()) {
      setError('두 번째 질문에 답변해주세요.');
      return;
    }

    setSubmitting(true);

    const request: MentorApplyRequest = {
      links: validLinks,
      q1Answer: q1Answer.trim(),
      q2Answer: q2Answer.trim(),
    };

    const res = await applyMentor(request);

    if (res.success && res.data) {
      onSuccess(res.data);
    } else {
      setError(res.error?.message ?? '멘토 신청에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <Flex vertical gap={16}>
      {/* Links Section */}
      <div className={styles.section}>
        <Text
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 12,
          }}
        >
          포트폴리오 / 프로필 링크
        </Text>
        <Text
          style={{
            display: 'block',
            fontSize: 12.5,
            color: 'var(--text-tertiary)',
            marginBottom: 16,
          }}
        >
          심사에 참고할 수 있는 링크를 추가해주세요. (최소 1개)
        </Text>

        {links.map((link, index) => (
          <div key={index} className={styles.linkRow}>
            <Select
              value={link.linkType}
              onChange={(value) => updateLink(index, 'linkType', value)}
              options={LINK_TYPE_OPTIONS}
              style={{ width: 140 }}
            />
            <Input
              value={link.url}
              onChange={(e) => updateLink(index, 'url', e.target.value)}
              placeholder="https://..."
            />
            {links.length > 1 && (
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => removeLink(index)}
                style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
              />
            )}
          </div>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addLink}
          style={{ width: '100%', marginTop: 4 }}
        >
          링크 추가
        </Button>
      </div>

      {/* Q1 */}
      <div className={styles.section}>
        <Text
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          어떤 분야에서 멘토링할 수 있나요?
        </Text>
        <TextArea
          value={q1Answer}
          onChange={(e) => setQ1Answer(e.target.value)}
          placeholder="예: 백엔드 (Spring Boot, JPA), DevOps (Docker, AWS) 등"
          maxLength={5000}
          showCount
          rows={4}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Q2 */}
      <div className={styles.section}>
        <Text
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          멘토로서 어떤 도움을 줄 수 있나요?
        </Text>
        <TextArea
          value={q2Answer}
          onChange={(e) => setQ2Answer(e.target.value)}
          placeholder="예: 코드 리뷰, 아키텍처 상담, 커리어 조언 등"
          maxLength={5000}
          showCount
          rows={4}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Error */}
      {error && <Alert type="error" message={error} showIcon />}

      {/* Submit */}
      <Button
        type="primary"
        onClick={handleSubmit}
        loading={submitting}
        size="large"
        style={{ width: '100%' }}
      >
        멘토 신청하기
      </Button>
    </Flex>
  );
}
