import AuthStatus from '@/components/auth/AuthStatus';
import QuestionFeed from '@/components/question/QuestionFeed';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--border-faint)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          background: 'var(--header-bg)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                flexShrink: 0,
                boxShadow: '0 2px 8px var(--accent-ring)',
              }}
            >
              🐞
            </div>
            <span
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 800,
                fontSize: 17,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              버그버디
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <ThemeToggle />
          <AuthStatus />
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <QuestionFeed />
      </main>
    </div>
  );
}
