import { PostCard } from "@/components/post-card";
import { generateMockPosts, MOCK_USERS } from "@/lib/mock-data";
import { notFound } from "next/navigation";

// Generate static paths for all possible posts
export async function generateStaticParams() {
  // Generate params for all possible post IDs
  const params = [];
  
  // Each user can have multiple posts
  MOCK_USERS.forEach((_, userIndex) => {
    // For each user, generate 5 post IDs (matching POSTS_PER_PAGE in PostFeed)
    Array.from({ length: 5 }).forEach((_, postIndex) => {
      params.push({
        id: `${userIndex}-${postIndex + 1}`
      });
    });
  });

  return params;
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  // Parse the user index and post index from the ID
  const [userIndex, postIndex] = params.id.split('-').map(Number);
  
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

  const post = generateMockPosts(1, userIndex)[0];

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center text-muted-foreground">
          投稿が見つかりませんでした
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32 lg:pb-8">
      <PostCard post={post} isDetail />
    </div>
  );
}