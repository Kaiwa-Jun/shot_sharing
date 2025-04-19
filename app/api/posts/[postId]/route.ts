import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // 認証中のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 投稿を取得
    const { data: post, error } = await supabase
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
      .eq("id", postId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "投稿の取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: "投稿が見つかりませんでした" },
        { status: 404 }
      );
    }

    // ユーザーがいいねしているかどうかを確認
    const userLiked = user
      ? post.Like.some((like: any) => like.userId === user.id)
      : false;

    return NextResponse.json({
      data: {
        ...post,
        userLiked,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // 認証中のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 投稿が実際にユーザーのものかを確認
    const { data: post } = await supabase
      .from("Post")
      .select("userId")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "投稿が見つかりませんでした" },
        { status: 404 }
      );
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        { error: "この操作を実行する権限がありません" },
        { status: 403 }
      );
    }

    // 投稿を削除
    const { error } = await supabase.from("Post").delete().eq("id", postId);

    if (error) {
      return NextResponse.json(
        { error: "投稿の削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
