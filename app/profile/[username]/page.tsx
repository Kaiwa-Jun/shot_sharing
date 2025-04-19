import { generateMockPosts, MOCK_USERS } from "@/lib/mock-data";
import { ProfileContent } from "@/components/profile-content";
import { notFound } from "next/navigation";
import { Post } from "@/lib/supabase/types";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

// Define the static paths that will be pre-rendered
export async function generateStaticParams() {
  // Create a Set to ensure unique usernames
  const uniqueUsernames = new Set([
    ...MOCK_USERS.map((user) => user.username),
    "crew_runteq38", // Explicitly add the required username
  ]);

  // Convert Set back to array of objects with username property
  return Array.from(uniqueUsernames).map((username) => ({
    username,
  }));
}

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = MOCK_USERS.find((u) => u.username === params.username);

  if (!user) {
    notFound();
  }

  // Get the exact index of the user to ensure consistent post generation
  const userIndex = MOCK_USERS.findIndex((u) => u.username === params.username);
  const mockPosts = generateMockPosts(3, userIndex);

  // モックデータをPost型に変換
  const posts: Post[] = mockPosts.map((post) => ({
    id: post.id,
    userId: `user-${userIndex}`,
    imageUrl: post.imageUrl,
    shutterSpeed: post.shutterSpeed,
    iso: post.iso,
    aperture: post.aperture,
    latitude: null,
    longitude: null,
    createdAt: post.createdAt,
    User: {
      id: `user-${userIndex}`,
      email: `${post.user.username}@example.com`,
      instagramUrl: null,
      twitterUrl: null,
    },
    Like: [],
    userLiked: false,
  }));

  return <ProfileContent user={user} posts={posts} />;
}
