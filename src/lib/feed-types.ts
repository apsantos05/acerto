import type { Plan } from "@/lib/plan";

export type FeedAuthor = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
  city: string | null;
  plan: Plan;
};

export type FeedMaterial = {
  id: string;
  title: string;
  subject: string;
  materialType: string;
};

export type FeedComment = {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: FeedAuthor;
};

export type FeedPost = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  publishedAt: string;
  author: FeedAuthor;
  material: FeedMaterial | null;
  comments: FeedComment[];
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  isSavedByMe: boolean;
};
