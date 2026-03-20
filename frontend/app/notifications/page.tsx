'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Spin, Typography, Pagination } from 'antd';
import { LoadingOutlined, BellOutlined, CheckOutlined } from '@ant-design/icons';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/lib/notifications';
import { getMeta } from '@/lib/notificationMeta';
import { relativeTime } from '@/lib/questionMeta';
import { getAccessToken } from '@/lib/auth';
import type { Notification } from '@/types/notification';
import type { Page } from '@/types/question';
import styles from '@/components/notification/NotificationLayout.module.css';

const { Text, Title } = Typography;

type TabKey = 'ALL' | 'ANSWER' | 'CHAT';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ANSWER', label: '답변' },
  { key: 'CHAT', label: '채팅' },
];

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    const [notifRes, countRes] = await Promise.all([
      getNotifications(p, PAGE_SIZE),
      getUnreadCount(),
    ]);
    if (notifRes.success && notifRes.data) {
      setNotifications(notifRes.data.content);
      setTotalElements(notifRes.data.totalElements);
    } else {
      setNotifications([]);
      setTotalElements(0);
    }
    if (countRes.success && countRes.data != null) {
      setUnreadCount(countRes.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    fetchData(page);
  }, [page, fetchData, router]);

  // Reset page to 0 when tab changes
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  const filtered =
    activeTab === 'ALL'
      ? notifications
      : notifications.filter((n) => getMeta(n.type).filterGroup === activeTab);

  const filteredTotal =
    activeTab === 'ALL' ? totalElements : filtered.length;

  async function handleMarkAllRead() {
    // Optimistic update
    const prev = [...notifications];
    const prevCount = unreadCount;
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    const res = await markAllAsRead();
    if (!res.success) {
      // Rollback
      setNotifications(prev);
      setUnreadCount(prevCount);
    }
  }

  async function handleCardClick(notification: Notification) {
    if (!notification.read) {
      // Optimistic update
      const prev = [...notifications];
      const prevCount = unreadCount;
      setNotifications((ns) =>
        ns.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      const res = await markAsRead(notification.id);
      if (!res.success) {
        // Rollback
        setNotifications(prev);
        setUnreadCount(prevCount);
      }
    }
    router.push(notification.linkUrl);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage - 1); // antd Pagination is 1-based, our API is 0-based
  }

  const emptyMessage =
    activeTab === 'ALL'
      ? '알림이 없어요.'
      : activeTab === 'ANSWER'
        ? '답변 관련 알림이 없어요.'
        : '채팅 관련 알림이 없어요.';

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        {/* Header bar */}
        <div className={styles.headerBar}>
          <div className={styles.headerLeft}>
            <Title level={4} style={{ margin: 0, fontSize: 18 }}>
              알림
            </Title>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            <CheckOutlined style={{ fontSize: 12 }} />
            모두 읽음
          </button>
        </div>

        {/* Pill tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tab}${activeTab === tab.key ? ` ${styles.active}` : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <Flex align="center" justify="center" style={{ padding: '80px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </Flex>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <Flex
            vertical
            align="center"
            justify="center"
            gap={12}
            style={{ padding: '80px 0' }}
          >
            <BellOutlined style={{ fontSize: 36, color: 'var(--text-tertiary)' }} />
            <Text style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
              {emptyMessage}
            </Text>
          </Flex>
        ) : (
          /* Notification cards */
          <div>
            {filtered.map((notification) => {
              const meta = getMeta(notification.type);
              const nickname = notification.triggerUserNickname ?? '알 수 없는 사용자';
              const title = notification.targetTitle ?? '삭제된 게시글';

              return (
                <div
                  key={notification.id}
                  className={`${styles.card}${
                    !notification.read ? ` ${styles.unread}` : ` ${styles.readCard}`
                  }`}
                  onClick={() => handleCardClick(notification)}
                >
                  <Flex gap={12} align="flex-start">
                    {/* Icon circle */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: meta.bg,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: 'var(--text-primary)',
                          display: 'block',
                          lineHeight: 1.5,
                        }}
                      >
                        {meta.text(nickname)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
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
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                    )}
                  </Flex>
                </div>
              );
            })}

            {/* Pagination */}
            {filteredTotal > PAGE_SIZE && (
              <Flex justify="center" style={{ marginTop: 24 }}>
                <Pagination
                  current={page + 1}
                  total={filteredTotal}
                  pageSize={PAGE_SIZE}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </Flex>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
