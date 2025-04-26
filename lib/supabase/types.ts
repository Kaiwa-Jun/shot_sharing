export type Post = {
  id: string;
  userId: string;
  imageUrl: string;
  shutterSpeed: string | null;
  iso: number | null;
  aperture: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  User: User;
  Like: Like[];
  userLiked?: boolean; // フロントエンド用（API応答時に追加）
};

export type User = {
  id: string;
  email: string;
  instagramUrl: string | null;
  twitterUrl: string | null;
  bio?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

export type Like = {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
};

export type Follow = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId: string | null;
  createdAt: string;
  User: User;
};
