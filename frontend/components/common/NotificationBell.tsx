'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Popover, Button, Flex, Typography, Spin } from 'antd';
import { BellOutlined, LoadingOutlined, CheckOutlined } from '@ant-design/icons';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications';
import { getMeta } from '@/lib/notificationMeta';
import { relativeTime } from '@/lib/questionMeta';
import { getAccessToken } from '@/lib/auth';
import type { Notification } from '@/types/notification';
import styles from '@/components/notification/NotificationLayout.module.css';
import themeBtnStyles from '@/components/common/ThemeToggle.module.css';

const { Text } = Typography;

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDropdownData = useCallback(async () => {
    setLoading(true);
    const [notifRes, countRes] = await Promise.all([
      getNotifications(0, 5),
      getUnreadCount(),
    ]);
    if (notifRes.success && notifRes.data) {
      setItems(notifRes.data.content);
    }
    if (countRes.success && countRes.data != null) {
      setUnreadCount(countRes.data);
    }
    setLoading(false);
  }, []);

  function handleOpenChange(visible: boolean) {
    setOpen(visible);
    if (visible) {
      fetchDropdownData();
    }
  }

  async function handleItemClick(notification: Notification) {
    setOpen(false);
    if (!notification.read) {
      // Optimistic update
      const prev = [...items];
      const prevCount = unreadCount;
      setItems((ns) =>
        ns.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      const res = await markAsRead(notification.id);
      if (!res.success) {
        setItems(prev);
        setUnreadCount(prevCount);
      }
    }
    router.push(notification.linkUrl);
  }

  async function handleMarkAllRead() {
    const prev = [...items];
    const prevCount = unreadCount;
    setItems((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    const res = await markAllAsRead();
    if (!res.success) {
      setItems(prev);
      setUnreadCount(prevCount);
    }
  }

  function handleViewAll() {
    setOpen(false);
    router.push('/notifications');
  }

  if (!getAccessToken()) return null;

  const dropdownContent = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className={styles.dropdownHeader}>
        <Text strong style={{ fontSize: 14 }}>알림</Text>
        <button
          onClick={handleMarkAllRead}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          <CheckOutlined style={{ fontSize: 11 }} />
          모두 읽음
        </button>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Flex align="center" justify="center" style={{ padding: '32px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 18 }} spin />} />
          </Flex>
        ) : items.length === 0 ? (
          <Flex
            vertical
            align="center"
            justify="center"
            gap={8}
            style={{ padding: '32px 0' }}
          >
            <BellOutlined style={{ fontSize: 24, color: 'var(--text-tertiary)' }} />
            <Text style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              알림이 없어요.
            </Text>
          </Flex>
        ) : (
          items.map((notification) => {
            const meta = getMeta(notification.type);
            const nickname = notification.triggerUserNickname ?? '알 수 없는 사용자';
            const title = notification.targetTitle ?? '삭제된 게시글';

            return (
              <div
                key={notification.id}
                className={styles.dropdownItem}
                onClick={() => handleItemClick(notification)}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: meta.bg,
                    color: meta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      display: 'block',
                      lineHeight: 1.4,
                    }}
                  >
                    {meta.text(nickname)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    {title} · {relativeTime(notification.createdAt)}
                  </Text>
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={styles.dropdownFooter}>
        <Button type="link" size="small" onClick={handleViewAll} style={{ fontSize: 13 }}>
          전체 보기
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={dropdownContent}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <button
          className={themeBtnStyles.themeBtn}
          style={{ width: 32, height: 32 }}
          title="알림"
        >
          <BellOutlined style={{ fontSize: 15 }} />
        </button>
      </Badge>
    </Popover>
  );
}
