import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * 特定の投稿に対する返信（コメント）を取得するAPI
 * GET /api/posts/[postId]/replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const postId = params.postId;

  if (!postId) {
    return NextResponse.json({ error: "投稿IDが必要です" }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 認証状態を確認（コメント取得は認証不要）
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("返信取得 - セッション状態:", !!session);

    // 指定した投稿IDに関連するコメントを取得
    const { data: replies, error } = await supabase
      .from("Comment")
      .select(
        `
        *,
        User:userId(id, email, avatarUrl)
      `
      )
      .eq("postId", postId)
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("返信取得エラー:", error);
      return NextResponse.json(
        { error: "返信の取得に失敗しました" },
        { status: 500 }
      );
    }

    // ユーザーメタデータを整理して使いやすい形に変換
    const repliesWithMetadata = replies.map((reply) => {
      return {
        ...reply,
        user: reply.User || {},
      };
    });

    return NextResponse.json({
      data: repliesWithMetadata,
      count: repliesWithMetadata.length,
    });
  } catch (error) {
    console.error("返信取得エラー:", error);
    return NextResponse.json(
      { error: "返信の取得に失敗しました" },
      { status: 500 }
    );
  }
}
