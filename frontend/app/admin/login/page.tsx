'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { isAdminLoggedIn, saveAdminTokens } from '@/lib/adminAuth';
import type { AdminLoginRequest, AdminLoginResponse } from '@/types/admin';

const { Title } = Typography;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace('/admin');
    }
  }, [router]);

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

      saveAdminTokens(json.data.accessToken, json.data.refreshToken);
      message.success('로그인 성공');
      router.push('/admin');
    } catch {
      message.error('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <Card style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0 }}>
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

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
