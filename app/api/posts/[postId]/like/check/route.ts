import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// キャッシュを無効化
export const dynamic = "force-dynamic";

// いいね状態をチェックするためのGETリクエスト
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  console.log(
    "いいね状態チェックリクエスト開始: /api/posts/[postId]/like/check",
    params.postId
  );

  try {
    // URLパラメータからユーザーIDを取得
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    console.log("状態チェック - ユーザーID:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    const postId = params.postId;

    // Supabaseクライアントを初期化
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // いいねのチェック（認証情報は使用せず、URLパラメータのユーザーIDを使用）
    const { data, error } = await supabase
      .from("Like")
      .select("*")
      .eq("userId", userId)
      .eq("postId", postId)
      .maybeSingle(); // 結果が見つからなくてもエラーにしない

    if (error) {
      console.error("いいねチェッククエリエラー:", error);
      return NextResponse.json(
        { error: "いいね状態の確認に失敗しました" },
        { status: 500 }
      );
    }

    // いいねが見つかれば true、なければ false
    const isLiked = !!data;
    console.log("いいね状態チェック結果:", { isLiked, userId, postId });

    return NextResponse.json({ isLiked });
  } catch (error) {
    console.error("いいね状態チェックエラー:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}
