import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    console.log("POST リクエスト受信: /api/posts/[postId]/delete");

    // パスパラメータから投稿IDを取得
    const postId = params.postId;
    console.log("削除対象の投稿ID:", postId);

    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const userIdFromParam = searchParams.get("userId");
    const userEmailFromParam = searchParams.get("userEmail");
    console.log("URLパラメータの認証情報:", {
      userIdFromParam,
      userEmailFromParam,
    });

    // ヘッダー情報を出力
    const requestHeaders = Object.fromEntries(request.headers);
    console.log("リクエストヘッダー:", JSON.stringify(requestHeaders));

    // カスタムヘッダーから認証情報を取得
    const userIdFromHeader = request.headers.get("x-user-id");
    const userEmailFromHeader = request.headers.get("x-user-email");
    console.log("ヘッダーの認証情報:", {
      userIdFromHeader,
      userEmailFromHeader,
    });

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });
    console.log("Supabaseクライアント初期化完了");

    // 認証中のユーザーを取得
    console.log("認証ユーザー取得中...");
    const authResponse = await supabase.auth.getUser();
    const {
      data: { user },
    } = authResponse;

    console.log("認証レスポンス:", {
      hasUser: !!user,
      userData: user ? { id: user.id, email: user.email } : null,
    });

    // ユーザー情報を確定（Supabaseの認証 -> ヘッダー -> URLパラメータの順で優先）
    let authenticatedUserId = user?.id || userIdFromHeader || userIdFromParam;
    let authenticatedUserEmail =
      user?.email || userEmailFromHeader || userEmailFromParam;

    console.log("最終的な認証情報:", {
      authenticatedUserId,
      authenticatedUserEmail,
    });

    if (!authenticatedUserId) {
      console.log("認証エラー: ユーザーIDが見つかりません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 投稿を取得して所有者を確認
    console.log(`投稿データ取得中: ${postId}`);
    const { data: post, error: fetchError } = await supabase
      .from("Post")
      .select("userId")
      .eq("id", postId)
      .single();

    if (fetchError) {
      console.error("投稿取得エラー:", fetchError);
      return NextResponse.json(
        { error: "投稿取得エラー: " + fetchError.message },
        { status: 500 }
      );
    }

    console.log("取得した投稿データ:", post);

    if (!post) {
      console.log("投稿が見つかりません");
      return NextResponse.json(
        { error: "投稿が見つかりません" },
        { status: 404 }
      );
    }

    // 所有者チェック - ユーザーIDが一致するか確認
    console.log("所有者チェック:", {
      postUserId: post.userId,
      currentUserId: authenticatedUserId,
    });
    if (post.userId !== authenticatedUserId) {
      console.log("権限エラー: 投稿の所有者ではありません");
      return NextResponse.json(
        { error: "この投稿を削除する権限がありません" },
        { status: 403 }
      );
    }

    // 投稿を削除
    console.log(`投稿削除実行: ${postId}`);
    const { error: deleteError } = await supabase
      .from("Post")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("削除エラー:", deleteError);
      throw deleteError;
    }

    console.log("投稿の削除に成功しました");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
