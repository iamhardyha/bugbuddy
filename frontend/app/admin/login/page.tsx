'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, ConfigProvider, Form, Input, Typography, message, theme as antTheme } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { isAdminLoggedIn, saveAdminTokens } from '@/lib/adminAuth';
import { ApiResponse } from '@/lib/adminApi';
import type { AdminLoginRequest, AdminLoginResponse } from '@/types/admin';
import styles from './page.module.css';

const { Title } = Typography;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace('/admin');
    }
  }, [router]);

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(() => {
      setIsDark(html.getAttribute('data-theme') === 'dark');
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  async function handleSubmit(values: AdminLoginRequest) {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json: ApiResponse<AdminLoginResponse> = await res.json();

      if (!json.success || !json.data) {
        message.error(json.error?.message ?? '로그인에 실패했습니다.');
        return;
      }

      saveAdminTokens(json.data.accessToken);
      message.success('로그인 성공');
      router.push('/admin');
    } catch {
      message.error('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfigProvider
      theme={{
        cssVar: {},
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#5548e0',
          colorBgContainer: isDark ? '#13131e' : '#ffffff',
          colorBgLayout: isDark ? '#0d0d14' : '#f5f5f5',
          colorText: isDark ? '#e6e6f2' : '#0c0c1e',
          borderRadius: 8,
        },
      }}
    >
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.titleArea}>
          <Title level={3} className={styles.title}>
            BugBuddy Admin
          </Title>
          <Typography.Text type="secondary">관리자 로그인</Typography.Text>
        </div>

        <Form<AdminLoginRequest>
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="loginId"
            rules={[{ required: true, message: '아이디를 입력하세요' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="아이디" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
          </Form.Item>

          <Form.Item className={styles.lastFormItem}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </ConfigProvider>
  );
}
