import { PostFeed, PostsResponse } from "@/components/post-feed";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Suspense } from "react";

// ISRを設定（10秒間有効なキャッシュ）
export const revalidate = 10;

// 動的レンダリングの設定を削除
// export const dynamic = "force-dynamic";

// サーバーサイドで初期データを取得
async function getInitialPosts(): Promise<PostsResponse> {
  try {
    // 人為的な遅延を追加せず、できるだけ高速化
    const supabase = createServerComponentClient({ cookies });

    const { data: posts, error } = await supabase
      .from("Post")
      .select(
        `
        *,
        User (
          id,
          email
        ),
        Like (
          id,
          userId
        )
      `
      )
      .order("createdAt", { ascending: false })
      .limit(11); // 1つ多く取得して次のページがあるか確認

    if (error) {
      console.error("Error fetching initial posts:", error);
      return { data: [], cursor: null, hasMore: false };
    }

    // 次のページがあるか確認
    const hasMore = posts.length > 10;
    if (hasMore) {
      posts.pop(); // 余分な1件を削除
    }

    // 次のカーソルを設定
    const nextCursor =
      posts.length > 0
        ? encodeURIComponent(posts[posts.length - 1].createdAt)
        : null;

    // 匿名ユーザーなのでいいね状態はすべてfalse
    const postsWithLikeStatus = posts.map((post) => ({
      ...post,
      userLiked: false,
    }));

    return {
      data: postsWithLikeStatus,
      cursor: nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch initial posts:", error);
    return { data: [], cursor: null, hasMore: false };
  }
}

// データ取得コンポーネント
async function PostsContainer() {
  const initialData = await getInitialPosts();
  return <PostFeed initialData={initialData} />;
}

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダーやその他のファーストビュー要素をここに配置 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">最新の投稿</h1>
        <p className="text-muted-foreground">写真家たちの作品をご覧ください</p>
      </div>

      {/* 投稿フィードは別途ストリーミングで読み込む */}
      <Suspense
        fallback={
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        }
      >
        <PostsContainer />
      </Suspense>
    </div>
  );
}
