export type MentorApplicationLinkType = 'GITHUB' | 'LINKEDIN' | 'BLOG' | 'PORTFOLIO' | 'OTHER';
export type MentorApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MentorLink {
  linkType: MentorApplicationLinkType;
  url: string;
}

export interface MentorApplication {
  id: number;
  status: MentorApplicationStatus;
  q1Answer: string;
  q2Answer: string;
  links: MentorLink[];
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface MentorApplyRequest {
  links: MentorLink[];
  q1Answer: string;
  q2Answer: string;
}
