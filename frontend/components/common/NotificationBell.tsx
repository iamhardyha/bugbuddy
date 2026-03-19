'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import themeBtnStyles from '@/components/common/ThemeToggle.module.css';

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) return;
    apiFetch<{ unreadCount: number }>('/api/notifications/unread-count')
      .then(res => {
        if (res.success && res.data) setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  if (!getAccessToken()) return null;

  return (
    <Badge count={unreadCount} size="small" offset={[-2, 2]}>
      <button
        className={themeBtnStyles.themeBtn}
        onClick={() => router.push('/notifications')}
        style={{ width: 32, height: 32 }}
        title="알림"
      >
        <BellOutlined style={{ fontSize: 15 }} />
      </button>
    </Badge>
  );
}
