import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// エッジランタイムを使用
export const runtime = "edge";

// APIルートでは必ずGETリクエストをエクスポートする
export async function GET(request: NextRequest) {
  try {
    // URLパラメータからユーザーIDを取得
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // いいねテーブルからユーザーがいいねした投稿のIDを取得
    const { data: likes, error: likesError } = await supabase
      .from("Like")
      .select("postId")
      .eq("userId", userId);

    if (likesError) {
      console.error("[DEBUG] いいね取得エラー:", likesError);
      return NextResponse.json(
        { error: "いいねの取得に失敗しました" },
        { status: 500 }
      );
    }

    // いいねした投稿がない場合は空配列を返す
    if (!likes || likes.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // いいねした投稿のIDリストを作成
    const likedPostIds = likes.map((like) => like.postId);
    console.log("[DEBUG] いいねした投稿ID:", likedPostIds);

    // いいねした投稿の詳細情報を取得
    const { data: posts, error: postsError } = await supabase
      .from("Post")
      .select(
        `
        *,
        User (
          id,
          email,
          name,
          avatarUrl
        ),
        Like (
          id,
          userId
        )
      `
      )
      .in("id", likedPostIds)
      .order("createdAt", { ascending: false });

    if (postsError) {
      console.error("[DEBUG] いいね投稿取得エラー:", postsError);
      return NextResponse.json(
        { error: "いいねした投稿の取得に失敗しました" },
        { status: 500 }
      );
    }

    // いいねした投稿を返す
    return NextResponse.json({
      data: posts.map((post) => ({
        ...post,
        userLiked: true, // いいね済みとしてマーク
      })),
    });
  } catch (error) {
    console.error("[DEBUG] いいね投稿API処理エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
