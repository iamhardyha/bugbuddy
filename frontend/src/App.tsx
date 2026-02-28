import { Routes, Route } from 'react-router-dom';
import HomePage from '@/app/page';
import OAuthCallbackPage from '@/app/oauth/callback/page';
import NewQuestionPage from '@/app/questions/new/page';
import QuestionDetailPage from '@/app/questions/[id]/page';
import EditQuestionPage from '@/app/questions/[id]/edit/page';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/questions/new" element={<NewQuestionPage />} />
      <Route path="/questions/:id" element={<QuestionDetailPage />} />
      <Route path="/questions/:id/edit" element={<EditQuestionPage />} />
    </Routes>
  );
}
