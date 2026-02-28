'use client';

const GITHUB_LOGIN_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080') +
  '/oauth2/authorization/github';

export default function LoginButton() {
  return (
    <a
      href={GITHUB_LOGIN_URL}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'var(--border-strong)';
        el.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'var(--border)';
        el.style.background = 'var(--bg-elevated)';
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.097-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.698 1.028 1.59 1.028 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
          clipRule="evenodd"
        />
      </svg>
      GitHub 로그인
    </a>
  );
}
