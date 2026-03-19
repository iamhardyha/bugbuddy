import QuestionFeed from '@/components/question/QuestionFeed';
import layoutStyles from '@/components/common/Layout.module.css';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <main className={layoutStyles.homeMain}>
        <QuestionFeed />
      </main>
    </div>
  );
}
