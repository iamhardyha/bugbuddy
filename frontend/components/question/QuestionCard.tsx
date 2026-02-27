import Link from 'next/link';
import { CATEGORY_META, QUESTION_TYPE_META, STATUS_META, relativeTime } from '@/lib/questionMeta';
import type { QuestionSummary } from '@/types/question';

interface Props {
  question: QuestionSummary;
}

export default function QuestionCard({ question }: Props) {
  const status = STATUS_META[question.status];
  const category = CATEGORY_META[question.category];
  const type = QUESTION_TYPE_META[question.questionType];

  return (
    <Link
      href={`/questions/${question.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:border-gray-300"
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${status.color}`}
        >
          {status.label}
        </span>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-50 ring-1 ring-inset ring-purple-600/20">
          {category.emoji} {category.label}
        </span>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-50 ring-1 ring-inset ring-orange-600/20">
          {type.emoji} {type.label}
        </span>
        {question.allowOneToOne && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-teal-700 bg-teal-50 ring-1 ring-inset ring-teal-600/20">
            💬 1:1 가능
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
        {question.title}
      </h3>

      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {question.tags.map(tag => (
            <span
              key={tag}
              className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span>👁 {question.viewCount.toLocaleString()}</span>
        <span>{relativeTime(question.createdAt)}</span>
      </div>
    </Link>
  );
}
