import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// キャッシュを無効化し、常に最新データを取得するための設定
export const dynamic = "force-dynamic";

// ユーザーの投稿を取得するGETリクエスト
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log(
      "ユーザー投稿取得リクエスト開始: /api/users/[userId]/posts",
      params.userId
    );

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ユーザーの投稿を取得
    const { data: posts, error: postsError } = await supabase
      .from("Post")
      .select(
        `
        *,
        User (*),
        Like (*)
      `
      )
      .eq("userId", params.userId)
      .order("createdAt", { ascending: false });

    if (postsError) {
      console.error("投稿取得エラー:", postsError);
      return NextResponse.json(
        { error: "投稿の取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      console.log("ユーザーの投稿はありません");
      return NextResponse.json({ posts: [] });
    }

    // 投稿データを加工
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // 現在のユーザーがいいねしているかどうかチェック
        let userLiked = false;

        if (user) {
          const { data: likeData } = await supabase
            .from("Like")
            .select("*")
            .eq("userId", user.id)
            .eq("postId", post.id)
            .maybeSingle();

          userLiked = !!likeData;
        }

        return {
          ...post,
          userLiked,
        };
      })
    );

    console.log(`${formattedPosts.length}件のユーザー投稿を取得しました`);

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("ユーザー投稿取得処理エラー:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}
