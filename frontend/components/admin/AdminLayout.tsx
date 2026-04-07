'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Button, ConfigProvider, theme as antTheme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
  ReadOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { clearAdminTokens } from '@/lib/adminAuth';
import styles from './AdminLayout.module.css';

const { Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: '/admin', icon: <DashboardOutlined />, label: '대시보드' },
  { key: '/admin/users', icon: <UserOutlined />, label: '사용자' },
  { key: '/admin/questions', icon: <QuestionCircleOutlined />, label: '질문' },
  { key: '/admin/answers', icon: <MessageOutlined />, label: '답변' },
  { key: '/admin/feeds', icon: <ReadOutlined />, label: '피드' },
  { key: '/admin/reports', icon: <WarningOutlined />, label: '신고' },
  { key: '/admin/mentors', icon: <SafetyCertificateOutlined />, label: '멘토' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(() => {
      setIsDark(html.getAttribute('data-theme') === 'dark');
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const selectedKey = MENU_ITEMS.find(
    (item) => item.key !== '/admin' && pathname.startsWith(item.key)
  )?.key ?? '/admin';

  function handleMenuClick({ key }: { key: string }) {
    router.push(key);
  }

  function handleLogout() {
    clearAdminTokens();
    router.push('/admin/login');
  }

  return (
    <ConfigProvider
      theme={{
        cssVar: {},
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#5548e0',
          colorBgContainer: isDark ? '#13131e' : '#ffffff',
          colorBgLayout: isDark ? '#0d0d14' : '#f0f2f5',
          colorBgElevated: isDark ? '#1b1b2a' : '#ffffff',
          colorText: isDark ? '#e6e6f2' : '#1a1a2e',
          colorTextSecondary: isDark ? '#8686a8' : '#6b7280',
          colorBorder: isDark ? '#262638' : '#e5e7eb',
          borderRadius: 8,
          fontSize: 14,
          controlHeight: 36,
        },
      }}
    >
      <Layout className={styles.layout}>
        <Sider
          className={styles.sider}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={220}
          collapsedWidth={64}
          theme="light"
        >
          <div className={`${styles.logo} ${collapsed ? styles.logoCollapsed : ''}`}>
            <span className={styles.logoIcon}><BugOutlined /></span>
            {!collapsed && 'BugBuddy'}
          </div>

          <Menu
            className={styles.menu}
            mode="inline"
            theme="light"
            selectedKeys={[selectedKey]}
            items={MENU_ITEMS}
            onClick={handleMenuClick}
          />

          <div className={styles.siderBottom}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((prev) => !prev)}
              className={styles.collapseButton}
            />
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              {!collapsed && '로그아웃'}
            </Button>
          </div>
        </Sider>

        <Layout className={`${styles.innerLayout} ${collapsed ? styles.innerLayoutCollapsed : styles.innerLayoutExpanded}`}>
          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
