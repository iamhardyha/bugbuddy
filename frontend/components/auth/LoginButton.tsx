import { Button } from 'antd';
import { GithubOutlined } from '@ant-design/icons';

const GITHUB_LOGIN_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080') +
  '/oauth2/authorization/github';

export default function LoginButton() {
  return (
    <Button
      href={GITHUB_LOGIN_URL}
      icon={<GithubOutlined />}
      style={{ flexShrink: 0 }}
    >
      GitHub 로그인
    </Button>
  );
}
