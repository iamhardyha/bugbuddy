'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Button } from 'antd';
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
} from '@ant-design/icons';
import { clearAdminTokens } from '@/lib/adminAuth';
import styles from './AdminLayout.module.css';

const { Sider, Header, Content } = Layout;

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
  const pathname = usePathname();
  const router = useRouter();

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
    <Layout className={styles.layout}>
      <Sider
        className={styles.sider}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        collapsedWidth={64}
      >
        <div className={`${styles.logo} ${collapsed ? styles.logoCollapsed : ''}`}>
          {collapsed ? 'BB' : 'BugBuddy Admin'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 64 : 220, transition: 'margin-left 0.2s' }}>
        <Header className={styles.header}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((prev) => !prev)}
            style={{ marginRight: 'auto' }}
          />
          <span className={styles.adminLabel}>관리자</span>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </Header>

        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
