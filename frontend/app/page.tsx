import LoginButton from '@/components/auth/LoginButton';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">버그버디</h1>
          <LoginButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            막히는 문제, 빠르게 해결하세요
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            1:1 개발자 멘토링 커뮤니티 — 질문하고, 답변하고, 함께 성장하세요.
          </p>
          <div className="mt-8">
            <LoginButton />
          </div>
        </section>
      </main>
    </div>
  );
}
