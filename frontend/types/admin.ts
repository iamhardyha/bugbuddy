// Page type for admin paginated responses
export interface AdminPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Login
export interface AdminLoginRequest {
  loginId: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
}

// Dashboard
export interface DashboardSummary {
  totalUsers: number;
  totalQuestions: number;
  totalAnswers: number;
  totalFeeds: number;
  todaySignups: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendData {
  type: string;
  period: string;
  points: TrendPoint[];
}

export interface ActiveUsers {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface ReportSummary {
  openCount: number;
  reviewingCount: number;
  resolvedCount: number;
  rejectedCount: number;
  pendingMentorApps: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface TagCount {
  tagName: string;
  count: number;
}

export interface LevelCount {
  level: number;
  userCount: number;
}

export interface FeedStats {
  totalFeeds: number;
  categories: { category: string; count: number }[];
  avgLikes: number;
  avgComments: number;
}

// User management
export interface AdminUser {
  id: number;
  nickname: string;
  email: string;
  mentorStatus: string;
  xp: number;
  level: number;
  reportCount: number;
  suspendedUntil: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  bio: string | null;
  oauthProvider: string;
  deactivatedAt: string | null;
  recentReports: {
    id: number;
    targetType: string;
    reasonCode: string;
    status: string;
    createdAt: string;
  }[];
}

// Content management
export interface AdminQuestion {
  id: number;
  title: string;
  body: string;
  category: string;
  status: string;
  questionType: string;
  viewCount: number;
  hidden: boolean;
  deletedAt: string | null;
  createdAt: string;
  authorId: number;
  authorNickname: string;
}

export interface AdminAnswer {
  id: number;
  questionId: number;
  questionTitle: string;
  body: string;
  accepted: boolean;
  hidden: boolean;
  deletedAt: string | null;
  createdAt: string;
  authorId: number;
  authorNickname: string;
}

export interface AdminFeed {
  id: number;
  url: string;
  title: string;
  description: string;
  category: string;
  comment: string;
  likeCount: number;
  commentCount: number;
  hidden: boolean;
  deletedAt: string | null;
  createdAt: string;
  authorId: number;
  authorNickname: string;
}

// Report management
export interface AdminReport {
  id: number;
  reporterUserId: number;
  targetType: string;
  targetId: number;
  reasonCode: string;
  reasonDetail: string | null;
  status: string;
  resolvedAt: string | null;
  resolverUserId: number | null;
  createdAt: string;
}

// Mentor management
export interface AdminMentorApp {
  id: number;
  userId: number;
  nickname: string;
  q1Answer: string;
  q2Answer: string;
  links: { linkType: string; url: string }[];
  status: string;
  reviewerUserId: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}
