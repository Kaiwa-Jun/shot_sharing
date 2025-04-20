import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

// キャッシュを無効化し、常に最新データを取得するための設定
export const dynamic = "force-dynamic";

// ユーザーが存在するか確認し、存在しない場合は作成する関数
async function ensureUserExists(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null
) {
  // ユーザーがUserテーブルに存在するか確認
  const { data: dbUser, error: userError } = await supabase
    .from("User")
    .select("id")
    .eq("id", userId)
    .single();

  // Userテーブルにユーザーが存在しない場合は作成
  if (!dbUser) {
    console.log("ユーザーがUserテーブルに存在しないため作成します", userId);

    // ユーザーを作成
    const { error: createUserError } = await supabase.from("User").insert([
      {
        id: userId,
        email: userEmail,
        // 必要に応じて他のフィールドも設定
      },
    ]);

    if (createUserError) {
      console.error("ユーザー作成エラー:", createUserError);
      throw new Error("ユーザーの作成に失敗しました");
    }
    console.log("ユーザーを作成しました", userId);
  }
}

// いいねを追加するPOSTリクエスト
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  console.log("POSTリクエスト開始: /api/posts/[postId]/like", params.postId);

  try {
    // URLパラメータからユーザーIDを取得
    const url = new URL(request.url);
    const urlUserId = url.searchParams.get("userId");
    console.log("URLからのユーザーID:", urlUserId);

    // リクエストボディからも確認
    let bodyUserId = null;
    try {
      const body = await request.json();
      bodyUserId = body.userId;
      console.log("ボディからのユーザーID:", bodyUserId);
    } catch (e) {
      console.log("リクエストボディの解析に失敗:", e);
    }

    // 認証情報を取得するためのクライアントを作成
    const cookieStore = cookies();
    console.log("Cookieのヘッダー:", request.headers.get("cookie"));

    // すべてのCookieを出力
    const allCookies = cookieStore.getAll();
    console.log(
      "すべてのCookie:",
      allCookies.map((c) => `${c.name}: ${c.value.substring(0, 15)}...`)
    );

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    console.log("Supabaseクライアント作成完了");

    // ユーザー情報を直接取得
    const authResponse = await supabase.auth.getUser();
    console.log(
      "認証レスポンス:",
      JSON.stringify({
        hasUser: !!authResponse.data.user,
        error: authResponse.error,
      })
    );

    const {
      data: { user },
    } = authResponse;

    // URL/ボディからのユーザーIDを使用（認証失敗時のフォールバック）
    let userId;
    let userEmail = null;

    if (user) {
      console.log("認証済みユーザー:", user.id);
      userId = user.id;
      userEmail = user.email;
    } else if (urlUserId || bodyUserId) {
      console.log("URL/ボディからのユーザーIDを使用:", urlUserId || bodyUserId);
      userId = urlUserId || bodyUserId;
    } else {
      console.log("ユーザーが認証されていません");
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    const postId = params.postId;

    // ユーザーがUserテーブルに存在するか確認し、必要に応じて作成
    try {
      await ensureUserExists(supabase, userId, userEmail || null);
    } catch (error) {
      return NextResponse.json(
        { error: "ユーザーの作成に失敗しました" },
        { status: 500 }
      );
    }

    // 同一ユーザーによる同一投稿への重複いいねを防止するためのチェック
    const likeCheckResult = await supabase
      .from("Like")
      .select("*")
      .eq("userId", userId)
      .eq("postId", postId)
      .single();

    console.log("いいねチェック結果:", {
      hasData: !!likeCheckResult.data,
      error: likeCheckResult.error ? likeCheckResult.error.message : null,
    });

    const { data: existingLike, error: checkError } = likeCheckResult;

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116はデータが見つからないエラー
      console.error("いいねチェックエラー:", checkError);
      return NextResponse.json(
        { error: "いいね状態の確認に失敗しました" },
        { status: 500 }
      );
    }

    if (existingLike) {
      console.log("すでにいいねされています");
      return NextResponse.json(
        { error: "すでにいいねしています" },
        { status: 400 }
      );
    }

    // いいねを追加
    console.log("いいねを追加します", { userId, postId });
    const { data, error } = await supabase
      .from("Like")
      .insert([{ userId, postId }])
      .select();

    if (error) {
      console.error("いいね追加エラー:", error);
      return NextResponse.json(
        { error: "いいねの追加に失敗しました" },
        { status: 500 }
      );
    }

    console.log("いいね追加成功");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("いいね処理エラー:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}

// いいねを削除するDELETEリクエスト
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  console.log("DELETEリクエスト開始: /api/posts/[postId]/like", params.postId);

  try {
    // URLパラメータからユーザーIDを取得
    const url = new URL(request.url);
    const urlUserId = url.searchParams.get("userId");
    console.log("URLからのユーザーID:", urlUserId);

    // リクエストボディからも確認
    let bodyUserId = null;
    try {
      const body = await request.json();
      bodyUserId = body.userId;
      console.log("ボディからのユーザーID:", bodyUserId);
    } catch (e) {
      console.log("リクエストボディの解析に失敗:", e);
    }

    // 認証情報を取得するためのクライアントを作成
    const cookieStore = cookies();
    console.log("Cookieのヘッダー:", request.headers.get("cookie"));

    // すべてのCookieを出力
    const allCookies = cookieStore.getAll();
    console.log(
      "すべてのCookie:",
      allCookies.map((c) => `${c.name}: ${c.value.substring(0, 15)}...`)
    );

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    console.log("Supabaseクライアント作成完了");

    // ユーザー情報を直接取得
    const authResponse = await supabase.auth.getUser();
    console.log(
      "認証レスポンス:",
      JSON.stringify({
        hasUser: !!authResponse.data.user,
        error: authResponse.error,
      })
    );

    const {
      data: { user },
    } = authResponse;

    // URL/ボディからのユーザーIDを使用（認証失敗時のフォールバック）
    let userId;
    let userEmail = null;

    if (user) {
      console.log("認証済みユーザー:", user.id);
      userId = user.id;
      userEmail = user.email;
    } else if (urlUserId || bodyUserId) {
      console.log("URL/ボディからのユーザーIDを使用:", urlUserId || bodyUserId);
      userId = urlUserId || bodyUserId;
    } else {
      console.log("ユーザーが認証されていません");
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    const postId = params.postId;

    // ユーザーがUserテーブルに存在するか確認し、必要に応じて作成
    try {
      await ensureUserExists(supabase, userId, userEmail || null);
    } catch (error) {
      return NextResponse.json(
        { error: "ユーザーの作成に失敗しました" },
        { status: 500 }
      );
    }

    // いいねを削除
    console.log("いいねを削除します", { userId, postId });
    const { error } = await supabase
      .from("Like")
      .delete()
      .eq("userId", userId)
      .eq("postId", postId);

    if (error) {
      console.error("いいね削除エラー:", error);
      return NextResponse.json(
        { error: "いいねの削除に失敗しました" },
        { status: 500 }
      );
    }

    console.log("いいね削除成功");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("いいね削除エラー:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}
