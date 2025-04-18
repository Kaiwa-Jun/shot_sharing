import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const followedOnly = searchParams.get("followedOnly") === "true";

    // ページネーション用のオフセットを計算
    const offset = (page - 1) * limit;

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // 認証中のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase.from("Post").select(`
        *,
        User (
          id,
          email
        ),
        Like (
          id,
          userId
        )
      `);

    // カーソルベースページネーション
    if (cursor) {
      const decodedCursor = decodeURIComponent(cursor);
      query = query.lt("createdAt", decodedCursor);
    }

    // フォローしているユーザーの投稿のみ取得
    if (followedOnly && user) {
      const { data: follows } = await supabase
        .from("Follow")
        .select("followingId")
        .eq("followerId", user.id);

      const followingIds = follows?.map((follow) => follow.followingId) || [];

      if (followingIds.length > 0) {
        query = query.in("userId", followingIds);
      } else {
        // フォローしているユーザーがいない場合は空の結果を返す
        return NextResponse.json({ data: [], cursor: null, hasMore: false });
      }
    }

    // ソートと制限
    const { data: posts, error } = await query
      .order(sortBy as any, { ascending: sortOrder === "asc" })
      .limit(limit + 1); // 次のページがあるかどうかを確認するために1つ多く取得

    if (error) {
      throw error;
    }

    // 次のページがあるかどうかを確認
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop(); // 余分な1件を削除
    }

    // 次のカーソルを設定
    const nextCursor =
      posts.length > 0
        ? encodeURIComponent(posts[posts.length - 1].createdAt)
        : null;

    // ユーザーが各投稿にいいねしているかどうかを確認
    const postsWithLikeStatus = posts.map((post) => {
      const userLiked = user
        ? post.Like.some((like: any) => like.userId === user.id)
        : false;

      return {
        ...post,
        userLiked,
      };
    });

    return NextResponse.json({
      data: postsWithLikeStatus,
      cursor: nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
