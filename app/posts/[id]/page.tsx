import { PostCard } from "@/components/post-card";
import { generateMockPosts, MOCK_USERS } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Post } from "@/lib/supabase/types";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

// Generate static paths for all possible posts
export async function generateStaticParams() {
  // Generate params for all possible post IDs
  const params: Array<{ id: string }> = [];

  // Each user can have multiple posts
  MOCK_USERS.forEach((_, userIndex) => {
    // For each user, generate 5 post IDs (matching POSTS_PER_PAGE in PostFeed)
    Array.from({ length: 5 }).forEach((_, postIndex) => {
      params.push({
        id: `${userIndex}-${postIndex + 1}`,
      });
    });
  });

  return params;
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  // Parse the user index and post index from the ID
  const [userIndex, postIndex] = params.id.split("-").map(Number);

  // Validate indices
  if (
    isNaN(userIndex) ||
    isNaN(postIndex) ||
    userIndex < 0 ||
    userIndex >= MOCK_USERS.length ||
    postIndex < 1
  ) {
    notFound();
  }

  const mockPost = generateMockPosts(1, userIndex)[0];

  if (!mockPost) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center text-muted-foreground">
          投稿が見つかりませんでした
        </div>
      </div>
    );
  }

  // モックデータをPostの型に変換
  const post: Post = {
    id: mockPost.id,
    userId: `user-${userIndex}`,
    imageUrl: mockPost.imageUrl,
    shutterSpeed: mockPost.shutterSpeed,
    iso: mockPost.iso,
    aperture: mockPost.aperture,
    latitude: null,
    longitude: null,
    createdAt: mockPost.createdAt,
    User: {
      id: `user-${userIndex}`,
      email: `${mockPost.user.username}@example.com`,
      instagramUrl: null,
      twitterUrl: null,
    },
    Like: [],
    userLiked: false,
  };

  return (
    <div className="max-w-2xl mx-auto pb-32 lg:pb-8">
      <PostCard post={post} isDetail />
    </div>
  );
}
