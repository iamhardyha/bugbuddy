'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Flex, Pagination, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './Feed.module.css';
import { getFeedComments, createFeedComment, deleteFeedComment } from '@/lib/feeds';
import { relativeTime } from '@/lib/questionMeta';
import type { FeedComment } from '@/types/feed';

const { Text } = Typography;
const { TextArea } = Input;

interface FeedCommentSectionProps {
  feedId: number;
  currentUserId: number | null;
}

export default function FeedCommentSection({ feedId, currentUserId }: FeedCommentSectionProps) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments(0);
  }, [feedId]);

  function loadComments(targetPage: number) {
    getFeedComments(feedId, targetPage, 20).then(res => {
      if (res.success && res.data) {
        setComments(res.data.content);
        setTotalElements(res.data.totalElements);
        setPage(targetPage);
      }
    }).catch(() => {});
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const res = await createFeedComment(feedId, { body: trimmed });
    if (res.success && res.data) {
      setBody('');
      loadComments(0);
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: number) {
    const res = await deleteFeedComment(feedId, commentId);
    if (res.success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalElements(prev => prev - 1);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
        댓글 {totalElements > 0 && `(${totalElements})`}
      </Text>

      {/* Comment input */}
      {currentUserId !== null && (
        <div style={{ marginBottom: 20 }}>
          <TextArea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={2000}
            showCount
            rows={3}
            placeholder="댓글을 입력하세요"
            style={{ marginBottom: 24 }}
          />
          <Flex justify="flex-end">
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!body.trim()}
            >
              댓글 등록
            </Button>
          </Flex>
        </div>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <Text style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'block', padding: '20px 0' }}>
          아직 댓글이 없습니다.
        </Text>
      ) : (
        <>
          {comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <Flex align="center" justify="space-between" style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {comment.authorNickname} · {relativeTime(comment.createdAt)}
                </Text>
                {currentUserId === comment.authorUserId && (
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(comment.id)}
                    style={{ color: 'var(--text-tertiary)', fontSize: 12 }}
                  />
                )}
              </Flex>
              <Text style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {comment.body}
              </Text>
            </div>
          ))}

          {totalElements > 20 && (
            <Flex justify="center" style={{ padding: '16px 0' }}>
              <Pagination
                current={page + 1}
                total={totalElements}
                pageSize={20}
                onChange={(p) => loadComments(p - 1)}
                showSizeChanger={false}
                size="small"
              />
            </Flex>
          )}
        </>
      )}
    </div>
  );
}
