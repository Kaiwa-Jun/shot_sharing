import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// キャッシュを無効化し、常に最新データを取得するための設定
export const dynamic = "force-dynamic";

// ユーザーがいいねした投稿を取得するGETリクエスト
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log(
      "いいねした投稿取得リクエスト開始: /api/users/[userId]/likes",
      params.userId
    );

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 認証チェック（オプション）- 必要に応じてコメントアウト解除
    // if (!user || user.id !== params.userId) {
    //   return NextResponse.json(
    //     { error: "この操作を実行する権限がありません" },
    //     { status: 401 }
    //   );
    // }

    // いいねした投稿を取得
    const { data: likes, error: likesError } = await supabase
      .from("Like")
      .select("postId")
      .eq("userId", params.userId);

    if (likesError) {
      console.error("いいね取得エラー:", likesError);
      return NextResponse.json(
        { error: "いいねの取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!likes || likes.length === 0) {
      console.log("いいねした投稿はありません");
      return NextResponse.json({ posts: [] });
    }

    // いいねした投稿のIDを配列として抽出
    const postIds = likes.map((like) => like.postId);

    // 投稿の詳細データを取得
    const { data: posts, error: postsError } = await supabase
      .from("Post")
      .select(
        `
        *,
        User (*),
        Like (*)
      `
      )
      .in("id", postIds);

    if (postsError) {
      console.error("投稿取得エラー:", postsError);
      return NextResponse.json(
        { error: "投稿の取得に失敗しました" },
        { status: 500 }
      );
    }

    // 投稿データを加工
    const formattedPosts = posts.map((post) => {
      // 現在のユーザーがいいねしているかどうか
      const userLiked = true; // いいねした投稿を取得しているので常にtrue

      return {
        ...post,
        userLiked,
      };
    });

    console.log(`${formattedPosts.length}件のいいねした投稿を取得しました`);

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("いいねした投稿取得処理エラー:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}
