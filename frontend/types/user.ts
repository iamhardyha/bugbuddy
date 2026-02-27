export type UserRole = 'USER' | 'ADMIN';
export type MentorStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

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
