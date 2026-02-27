export type QuestionCategory =
  | 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'MOBILE'
  | 'AI_DATA' | 'CS_ALGO' | 'CAREER' | 'FUTURE' | 'ETC';

export type QuestionType =
  | 'BUG' | 'CONCEPT' | 'ARCH' | 'PERF'
  | 'OPS' | 'TECH_CHOICE' | 'CAREER' | 'FUTURE';

export type QuestionStatus = 'OPEN' | 'SOLVED' | 'CLOSED';

export interface QuestionSummary {
  id: number;
  title: string;
  category: QuestionCategory;
  questionType: QuestionType;
  status: QuestionStatus;
  allowOneToOne: boolean;
  viewCount: number;
  tags: string[];
  createdAt: string;
}

export interface QuestionDetail extends QuestionSummary {
  authorUserId: number;
  body: string;
  updatedAt: string;
}

export interface QuestionRequest {
  title: string;
  body: string;
  category: QuestionCategory;
  questionType: QuestionType;
  allowOneToOne?: boolean;
  tags?: string[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
