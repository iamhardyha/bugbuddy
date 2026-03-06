import QuestionFeed from '@/components/question/QuestionFeed';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className="home-main">
        <QuestionFeed />
      </main>
    </div>
  );
}
