import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "投稿IDが必要です" }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 認証状態を確認（コメント取得は認証不要）
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("コメント取得 - セッション状態:", !!session);

    // 指定した投稿IDに関連するコメントを取得
    const { data: comments, error } = await supabase
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
      console.error("コメント取得エラー:", error);
      return NextResponse.json(
        { error: "コメントの取得に失敗しました" },
        { status: 500 }
      );
    }

    // ユーザーメタデータを整理して使いやすい形に変換
    const commentsWithMetadata = comments.map((comment) => {
      return {
        ...comment,
        user: comment.User || {},
      };
    });

    return NextResponse.json({ data: commentsWithMetadata });
  } catch (error) {
    console.error("コメント取得エラー:", error);
    return NextResponse.json(
      { error: "コメントの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Cookie取得方法を変更して認証情報をより確実に取得する
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // クエリパラメータからユーザーIDを取得
    const searchParams = request.nextUrl.searchParams;
    const userIdFromQuery = searchParams.get("userId");

    // デバッグ用：処理前のクッキー情報を出力
    console.log("リクエストクッキー:", {
      cookieCount: cookieStore.getAll().length,
      cookieNames: cookieStore.getAll().map((c) => c.name),
      userIdFromQuery,
    });

    // リクエストボディを取得（先に取得しておく）
    let body;
    try {
      body = await request.json();
      console.log("リクエストボディ:", body);
    } catch (error) {
      console.error("リクエストボディ解析エラー:", error);
      body = {};
    }

    const { postId, content, userId: bodyUserId } = body;

    // 認証状態を確認 - セッション取得
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("コメント投稿 - セッション状態:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    // ユーザーIDの取得（優先順位: セッション > クエリパラメータ > リクエストボディ）
    let userId = null;
    if (session?.user?.id) {
      userId = session.user.id;
      console.log("セッションからユーザーIDを取得:", userId);
    } else if (userIdFromQuery) {
      userId = userIdFromQuery;
      console.log("クエリパラメータからユーザーIDを取得:", userId);
    } else if (bodyUserId) {
      userId = bodyUserId;
      console.log("リクエストボディからユーザーIDを取得:", userId);
    }

    if (!userId) {
      console.error(
        "ユーザーID取得失敗: どのソースからもユーザーIDを取得できませんでした"
      );
      return NextResponse.json(
        { error: "コメントの投稿にはユーザーIDが必要です" },
        { status: 401 }
      );
    }

    if (!postId || !content) {
      return NextResponse.json(
        { error: "投稿IDとコメント内容が必要です" },
        { status: 400 }
      );
    }

    console.log("コメント投稿情報:", {
      userId,
      postId,
      contentLength: content?.length,
    });

    // コメントをデータベースに保存
    const { data: comment, error } = await supabase
      .from("Comment")
      .insert({
        postId,
        userId,
        content,
        parentId: null,
      })
      .select()
      .single();

    if (error) {
      console.error("コメント保存エラー:", error);
      return NextResponse.json(
        { error: "コメントの保存に失敗しました" },
        { status: 500 }
      );
    }

    // ユーザー情報を別のクエリで取得
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id, email, avatarUrl")
      .eq("id", userId)
      .single();

    if (userError) {
      console.warn("ユーザー情報取得エラー:", userError);
    }

    // レスポンスを構築
    const responseComment = {
      ...comment,
      user: userData || { id: userId },
    };

    return NextResponse.json({ data: responseComment });
  } catch (error) {
    console.error("コメント保存エラー:", error);
    return NextResponse.json(
      { error: "コメントの保存に失敗しました" },
      { status: 500 }
    );
  }
}
