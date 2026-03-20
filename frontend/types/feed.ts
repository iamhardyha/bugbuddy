export type FeedCategory =
  | 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'MOBILE' | 'AI'
  | 'OPEN_SOURCE' | 'TREND' | 'TOOLS' | 'TUTORIAL' | 'CAREER' | 'ETC';

export interface Feed {
  id: number;
  authorUserId: number;
  authorNickname: string;
  url: string;
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  domain: string | null;
  category: FeedCategory;
  comment: string;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  myLiked: boolean;
  myBookmarked: boolean;
  createdAt: string;
}

export interface FeedComment {
  id: number;
  authorUserId: number;
  authorNickname: string;
  body: string;
  createdAt: string;
}

export interface FeedCreateRequest {
  url: string;
  category: FeedCategory;
  comment: string;
}

export interface FeedCommentCreateRequest {
  body: string;
}
