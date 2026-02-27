import LoginButton from '@/components/auth/LoginButton';
import FadeUp from '@/components/common/FadeUp';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <FadeUp>
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">버그버디</h1>
            <LoginButton />
          </div>
        </header>
      </FadeUp>

      <main className="mx-auto w-full max-w-5xl px-6 py-24">
        <section className="flex flex-col items-center text-center">
          <FadeUp delay={0.1}>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
              1:1 개발자 멘토링 커뮤니티
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-gray-900">
              막히는 문제,
              <br />
              빠르게 해결하세요
            </h2>
          </FadeUp>

          <FadeUp delay={0.3}>
            <p className="mt-5 max-w-md text-lg text-gray-500">
              질문하고, 답변하고, 인증된 멘토와 1:1로 대화하세요.
              <br />
              함께 성장하는 개발자 커뮤니티입니다.
            </p>
          </FadeUp>

          <FadeUp delay={0.45}>
            <div className="mt-10">
              <LoginButton />
            </div>
          </FadeUp>
        </section>
      </main>
    </div>
  );
}
