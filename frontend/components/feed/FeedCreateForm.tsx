'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Alert } from 'antd';
import { FEED_CATEGORY_META } from './FeedCard';
import { createFeed } from '@/lib/feeds';
import { getAccessToken } from '@/lib/auth';
import type { FeedCategory } from '@/types/feed';
import layoutStyles from '@/components/common/Layout.module.css';

const { TextArea } = Input;

export default function FeedCreateForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<FeedCategory | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }
    if (!category) {
      setError('카테고리를 선택해주세요.');
      return;
    }
    if (!comment.trim()) {
      setError('추천 이유를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await createFeed({
      url: url.trim(),
      category,
      comment: comment.trim(),
    });

    if (res.success && res.data) {
      router.push(`/feeds/${res.data.id}`);
    } else {
      setError(res.error?.message ?? '피드 등록에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* URL */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          URL <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Category */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          카테고리 <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <Select<FeedCategory>
          value={category}
          onChange={v => setCategory(v)}
          placeholder="선택하세요"
          style={{ width: '100%' }}
          options={Object.entries(FEED_CATEGORY_META).map(([k, v]) => ({
            label: v.label,
            value: k,
          }))}
        />
      </div>

      {/* Comment */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          추천 이유 <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <TextArea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
          showCount
          rows={4}
          placeholder="이 글을 추천하는 이유를 적어주세요"
        />
      </div>

      {/* Error */}
      {error && <Alert type="error" message={error} showIcon />}

      {/* Actions */}
      <div className={layoutStyles.formActions}>
        <Button onClick={() => router.back()}>
          취소
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
        >
          피드 등록
        </Button>
      </div>
    </form>
  );
}
