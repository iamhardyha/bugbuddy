import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { saveTokens } from '@/lib/auth';

const { Text } = Typography;

function LoadingState() {
  return (
    <div className="page-root">
      <Flex vertical align="center" justify="center" gap={14} style={{ height: '100%', minHeight: '100vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
        <Text type="secondary" style={{ fontSize: '13.5px' }}>로그인 처리 중...</Text>
      </Flex>
    </div>
  );
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/?error=auth_failed', { replace: true });
      return;
    }

    saveTokens(accessToken, refreshToken);
    navigate('/', { replace: true });
  }, [navigate, searchParams]);

  return <LoadingState />;
}
