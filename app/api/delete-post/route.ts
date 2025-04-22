import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// 処理時間を十分確保するためにエッジランタイムの代わりにNodeJSランタイムを使用
export const runtime = "edge";

export async function POST(request: Request) {
  try {
    console.log("POST リクエスト受信: /api/delete-post");

    // リクエストボディからデータを取得
    const body = await request.json();
    const { postId, userEmail } = body;
    console.log("削除リクエスト:", { postId, userEmail });

    if (!postId || !userEmail) {
      console.log("パラメータ不足エラー");
      return NextResponse.json(
        { error: "投稿IDとユーザーメールアドレスが必要です" },
        { status: 400 }
      );
    }

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });
    console.log("Supabaseクライアント初期化完了");

    // データベース構造を確認
    console.log("テーブル構造を確認中...");
    try {
      // Likeテーブルの構造を確認
      const { data: likeColumns, error: likeColumnsError } = await supabase
        .from("Like")
        .select()
        .limit(1);

      console.log(
        "Likeテーブルのカラム:",
        likeColumns ? Object.keys(likeColumns[0] || {}) : "データなし",
        likeColumnsError ? `エラー: ${likeColumnsError.message}` : ""
      );

      // 投稿に関連する「いいね」を確認
      const { data: likes, error: likesError } = await supabase
        .from("Like")
        .select("id, userId")
        .eq("postId", postId);

      console.log(
        "この投稿へのいいね数:",
        likes?.length || 0,
        likesError ? `エラー: ${likesError.message}` : ""
      );

      if (likes && likes.length > 0) {
        console.log("いいねの例:", likes[0]);
      }
    } catch (structError) {
      console.error("テーブル構造確認エラー:", structError);
    }

    // 投稿データを取得
    console.log("投稿データを取得:", postId);
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("id, userId")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("投稿取得エラー:", postError);
      return NextResponse.json(
        { error: "投稿が見つかりません" },
        { status: 404 }
      );
    }

    console.log("取得した投稿データ:", post);

    // 投稿のユーザーIDでユーザー情報を取得
    const { data: postUser, error: userError } = await supabase
      .from("User")
      .select("id, email")
      .eq("id", post.userId)
      .single();

    if (userError || !postUser) {
      console.error("投稿ユーザー取得エラー:", userError);
      return NextResponse.json(
        { error: "投稿ユーザー情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    console.log("投稿ユーザー情報:", postUser);

    // 投稿者のメールアドレスと現在のユーザーメールアドレスを比較
    console.log("投稿者と現在のユーザーを比較:", {
      postOwnerEmail: postUser.email,
      currentUserEmail: userEmail,
    });

    if (postUser.email !== userEmail) {
      console.log("権限エラー: メールアドレスが一致しません");
      return NextResponse.json(
        { error: "この投稿を削除する権限がありません" },
        { status: 403 }
      );
    }

    // 投稿を削除
    console.log("投稿削除を実行:", postId);
    const { error: deleteError } = await supabase
      .from("Post")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("削除エラー:", deleteError);
      return NextResponse.json(
        { error: "投稿の削除に失敗しました: " + deleteError.message },
        { status: 500 }
      );
    }

    console.log("投稿削除成功");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("投稿削除処理エラー:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
