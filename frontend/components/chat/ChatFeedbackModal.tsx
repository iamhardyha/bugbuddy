'use client';

import { useState } from 'react';
import { Modal, Rate, Input, Button, Flex, Typography } from 'antd';
import { StarFilled } from '@ant-design/icons';
import modalStyles from '@/components/common/Modal.module.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export default function ChatFeedbackModal({ open, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setLoading(true);
    await onSubmit(rating, comment);
    setLoading(false);
    setRating(0);
    setComment('');
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      title={null}
      closable={false}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      <Flex vertical align="center" gap={16} style={{ padding: '28px 24px 20px' }}>
        <div className={`${modalStyles.icon} ${modalStyles.iconSuccess}`}>
          <StarFilled style={{ fontSize: 22 }} />
        </div>
        <Title level={5} style={{ margin: 0 }}>
          멘토링 피드백
        </Title>
        <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
          이번 멘토링 세션은 어떠셨나요?
        </Text>
        <Rate value={rating} onChange={setRating} style={{ fontSize: 28 }} />
        <TextArea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="자유롭게 피드백을 남겨주세요 (선택)"
          rows={3}
          style={{ width: '100%', resize: 'none' }}
        />
        <Flex gap={8} style={{ width: '100%' }}>
          <Button onClick={onClose} style={{ flex: 1 }}>
            나중에
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={rating === 0}
            style={{ flex: 1 }}
          >
            제출
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
