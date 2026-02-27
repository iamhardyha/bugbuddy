import AuthStatus from '@/components/auth/AuthStatus';
import QuestionFeed from '@/components/question/QuestionFeed';
import FadeUp from '@/components/common/FadeUp';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FadeUp>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">🐞 버그버디</h1>
            <AuthStatus />
          </div>
        </header>
      </FadeUp>

      <main className="mx-auto w-full max-w-5xl px-6 py-6">
        <QuestionFeed />
      </main>
    </div>
  );
}
