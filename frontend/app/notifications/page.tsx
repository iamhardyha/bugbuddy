'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Spin, Switch, Typography } from 'antd';
import {
  LoadingOutlined,
  BellOutlined,
  TeamOutlined,
  MessageOutlined,
  StarOutlined,
  SettingOutlined,
  CheckOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

const { Text, Title } = Typography;

type NotificationType = 'ALL' | 'MENTORING' | 'ACTIVITY' | 'SYSTEM';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationPage {
  content: Notification[];
  totalElements: number;
  last: boolean;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  MENTORING: { label: '멘토링', color: '#5548e0', bg: 'rgba(85,72,224,0.1)', icon: <TeamOutlined /> },
  ANSWER:    { label: '답변',   color: '#2563eb', bg: 'rgba(37,99,235,0.1)', icon: <MessageOutlined /> },
  ACTIVITY:  { label: '활동/채택', color: '#d97706', bg: 'rgba(217,119,6,0.1)', icon: <StarOutlined /> },
  SYSTEM:    { label: '시스템', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: <WarningOutlined /> },
};

const NAV_ITEMS: { value: NotificationType; label: string; icon: React.ReactNode }[] = [
  { value: 'ALL',       label: '전체 알림',      icon: <BellOutlined /> },
  { value: 'MENTORING', label: '멘토링',         icon: <TeamOutlined /> },
  { value: 'ACTIVITY',  label: '활동(답변/채택)', icon: <StarOutlined /> },
  { value: 'SYSTEM',    label: '시스템',          icon: <SettingOutlined /> },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  if (hr < 24) return `${hr}시간 전`;
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<NotificationType>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  async function loadNotifications() {
    setLoading(true);
    const typeParam = activeType !== 'ALL' ? `&type=${activeType}` : '';
    const res = await apiFetch<NotificationPage>(`/api/notifications?page=0&size=20${typeParam}`);
    if (res.success && res.data) {
      setNotifications(res.data.content);
    } else {
      setNotifications([]);
    }
    setLoading(false);
  }

  async function handleMarkAllRead() {
    setMarking(true);
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarking(false);
  }

  async function handleMarkRead(id: number) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-layout">
      {/* Left sidebar */}
      <aside className="notification-sidebar">
        <div style={{ padding: '0 16px 16px' }}>
          <Title level={5} style={{ margin: 0, fontSize: 15 }}>알림 센터</Title>
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.value}
            onClick={() => setActiveType(item.value)}
            className={`notification-nav-btn${activeType === item.value ? ' active' : ''}`}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="notification-main">
        <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
          <Title level={5} style={{ margin: 0, fontSize: 16 }}>최근 알림</Title>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--accent)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 999,
              padding: '2px 8px',
            }}>
              {unreadCount}개 읽지 않음
            </span>
          )}
        </Flex>

        {loading ? (
          <Flex align="center" justify="center" style={{ padding: '60px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </Flex>
        ) : notifications.length === 0 ? (
          <Flex vertical align="center" justify="center" gap={12} style={{ padding: '80px 0' }}>
            <BellOutlined style={{ fontSize: 36, color: 'var(--text-tertiary)' }} />
            <Text style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>알림이 없어요.</Text>
          </Flex>
        ) : (
          <div>
            {notifications.map(notification => {
              const meta = TYPE_META[notification.type] ?? TYPE_META.SYSTEM;
              return (
                <div
                  key={notification.id}
                  className={`notification-card${!notification.read ? ' unread' : ''}`}
                  onClick={() => !notification.read && handleMarkRead(notification.id)}
                  style={{ cursor: notification.read ? 'default' : 'pointer' }}
                >
                  <Flex align="flex-start" gap={14}>
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: meta.bg, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" justify="space-between" style={{ marginBottom: 4 }} gap={8}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: meta.color,
                          background: meta.bg, borderRadius: 4, padding: '2px 6px',
                        }}>
                          {meta.label}
                        </span>
                        <Text style={{ fontSize: 11.5, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                          {relativeTime(notification.createdAt)}
                        </Text>
                      </Flex>

                      <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                        {notification.title}
                      </Text>
                      <Text style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {notification.message}
                      </Text>

                      {notification.actionUrl && notification.actionLabel && (
                        <Button
                          type="default"
                          size="small"
                          onClick={e => { e.stopPropagation(); router.push(notification.actionUrl!); }}
                          style={{ marginTop: 10, fontSize: 12 }}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notification.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--accent)', flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </Flex>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Right sidebar */}
      <aside className="notification-right">
        {/* 알림 관리 */}
        <div className="feed-sidebar-card" style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 14 }}>알림 관리</Text>
          <Button
            type="default"
            block
            icon={<CheckOutlined />}
            loading={marking}
            onClick={handleMarkAllRead}
            style={{ marginBottom: 16, fontSize: 13 }}
          >
            모든 알림 읽음 처리
          </Button>
          <Flex vertical gap={12}>
            {[
              { label: '브라우저 푸시 알림', defaultOn: true },
              { label: '이메일 알림 받기', defaultOn: false },
              { label: '마케팅 정보 수신', defaultOn: false },
            ].map(item => (
              <Flex key={item.label} align="center" justify="space-between">
                <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</Text>
                <Switch defaultChecked={item.defaultOn} size="small" />
              </Flex>
            ))}
          </Flex>
        </div>

        {/* 프리미엄 멘토링 */}
        <div
          className="feed-sidebar-card"
          style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: 'none',
          }}
        >
          <Text strong style={{ fontSize: 14, color: '#ffffff', display: 'block', marginBottom: 8 }}>
            프리미엄 멘토링
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, display: 'block', marginBottom: 12 }}>
            광고 없는 알림함과 1:1 무제한 멘토링 매칭을 경험해보세요.
          </Text>
          <button
            style={{
              width: '100%', padding: '9px 0',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#ffffff',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            업그레이드
          </button>
        </div>
      </aside>
    </div>
  );
}
