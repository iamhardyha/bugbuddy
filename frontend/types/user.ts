export type UserRole = 'USER' | 'ADMIN';
export type MentorStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type SnapshotRole = 'USER' | 'MENTOR';

export interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  bio: string | null;
  role: UserRole;
  mentorStatus: MentorStatus;
  xp: number;
  level: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface PublicProfile {
  id: number;
  nickname: string;
  bio: string | null;
  level: number;
  xp: number;
  questionCount: number;
  answerCount: number;
  isMentor: boolean;
  mentorAvgRating: number | null;
  mentorRatingCount: number;
}

export interface UserStats {
  questionCount: number;
  answerCount: number;
  helpfulReceivedCount: number;
  acceptedAnswerCount: number;
}

export interface UserAnswerSummary {
  id: number;
  questionId: number;
  body: string;
  authorSnapshotRole: SnapshotRole;
  accepted: boolean;
  helpfulCount: number;
  createdAt: string;
}
