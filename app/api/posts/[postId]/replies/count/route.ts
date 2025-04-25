import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * 特定の投稿に対する返信（コメント）の数を取得するAPI
 * GET /api/posts/[postId]/replies/count
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

    // 返信数をカウントするクエリを実行
    const { count, error } = await supabase
      .from("Comment")
      .select("id", { count: "exact" })
      .eq("postId", postId);

    if (error) {
      console.error("返信数取得エラー:", error);
      return NextResponse.json(
        { error: "返信数の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("返信数取得エラー:", error);
    return NextResponse.json(
      { error: "返信数の取得に失敗しました" },
      { status: 500 }
    );
  }
}
