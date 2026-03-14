export type SnapshotRole = 'USER' | 'MENTOR';

export interface Answer {
  id: number;
  questionId: number;
  authorUserId: number;
  authorNickname: string;
  body: string;
  authorSnapshotRole: SnapshotRole;
  accepted: boolean;
  allowOneToOne: boolean;
  helpfulCount: number;
  myHelpful: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerRequest {
  body: string;
  allowOneToOne?: boolean;
  uploadIds?: number[];
}
