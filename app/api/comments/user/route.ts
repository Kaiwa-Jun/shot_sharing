import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDが必要です" },
      { status: 400 }
    );
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 認証状態を確認
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("ユーザーコメント取得 - セッション状態:", !!session);

    // ユーザーがコメントした投稿を取得
    // Commentテーブルからユーザーのコメントを取得し、関連する投稿情報も取得
    const { data: userComments, error } = await supabase
      .from("Comment")
      .select(
        `
        *,
        Post:postId(*,
          User:userId(id, email, name, avatarUrl)
        ),
        User:userId(id, email, name, avatarUrl)
      `
      )
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("ユーザーコメント取得エラー:", error);
      return NextResponse.json(
        { error: "コメントの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 投稿データを整形し、コメントも含める
    const postWithComments = [];
    const processedPostIds = new Set();

    for (const comment of userComments) {
      if (!comment.Post) continue;

      const postId = comment.Post.id;

      // 同じ投稿のコメントが複数ある場合は一度だけ処理する
      if (!processedPostIds.has(postId)) {
        processedPostIds.add(postId);

        // その投稿に対するすべてのコメントを取得
        const { data: allComments, error: commentsError } = await supabase
          .from("Comment")
          .select(
            `
            *,
            User:userId(id, email, name, avatarUrl)
          `
          )
          .eq("postId", postId)
          .order("createdAt", { ascending: true });

        if (commentsError) {
          console.error("投稿コメント取得エラー:", commentsError);
          continue;
        }

        // ユーザー情報を整形
        const formattedComments = allComments.map((c) => ({
          ...c,
          user: c.User || {},
        }));

        // 投稿とコメントをセットで追加
        postWithComments.push({
          ...comment.Post,
          User: comment.Post.User || {},
          comments: formattedComments,
        });
      }
    }

    return NextResponse.json({ data: postWithComments });
  } catch (error) {
    console.error("ユーザーコメント取得エラー:", error);
    return NextResponse.json(
      { error: "コメントした投稿の取得に失敗しました" },
      { status: 500 }
    );
  }
}
