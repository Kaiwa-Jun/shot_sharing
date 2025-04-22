import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// dynamic設定を削除して、エッジランタイムを設定
export const runtime = "edge";

// 共通のキャッシュ設定を定義
const CACHE_DURATION = 10; // 秒単位
const STALE_WHILE_REVALIDATE = 59; // 秒単位

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const followedOnly = searchParams.get("followedOnly") === "true";

    // ユーザー認証が必要な場合はキャッシュしない
    let shouldCache = true;

    // ページネーション用のオフセットを計算
    const offset = (page - 1) * limit;

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // 認証中のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ユーザー固有のコンテンツを取得する場合はキャッシュしない
    if (user || followedOnly) {
      shouldCache = false;
    }

    let query = supabase.from("Post").select(`
        *,
        User (
          id,
          email
        ),
        Like (
          id,
          userId
        )
      `);

    // カーソルベースページネーション
    if (cursor) {
      const decodedCursor = decodeURIComponent(cursor);
      query = query.lt("createdAt", decodedCursor);
    }

    // フォローしているユーザーの投稿のみ取得
    if (followedOnly && user) {
      const { data: follows } = await supabase
        .from("Follow")
        .select("followingId")
        .eq("followerId", user.id);

      const followingIds = follows?.map((follow) => follow.followingId) || [];

      if (followingIds.length > 0) {
        query = query.in("userId", followingIds);
      } else {
        // フォローしているユーザーがいない場合は空の結果を返す
        return NextResponse.json({ data: [], cursor: null, hasMore: false });
      }
    }

    // ソートと制限
    const { data: posts, error } = await query
      .order(sortBy as any, { ascending: sortOrder === "asc" })
      .limit(limit + 1); // 次のページがあるかどうかを確認するために1つ多く取得

    if (error) {
      throw error;
    }

    // 次のページがあるかどうかを確認
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop(); // 余分な1件を削除
    }

    // 次のカーソルを設定
    const nextCursor =
      posts.length > 0
        ? encodeURIComponent(posts[posts.length - 1].createdAt)
        : null;

    // ユーザーが各投稿にいいねしているかどうかを確認
    const postsWithLikeStatus = posts.map((post) => {
      const userLiked = user
        ? post.Like.some((like: any) => like.userId === user.id)
        : false;

      return {
        ...post,
        userLiked,
      };
    });

    // レスポンスを作成
    const response = {
      data: postsWithLikeStatus,
      cursor: nextCursor,
      hasMore,
    };

    // キャッシュヘッダーを設定
    const headers: HeadersInit = {};

    if (shouldCache) {
      headers[
        "Cache-Control"
      ] = `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`;
    } else {
      headers["Cache-Control"] = "no-store, must-revalidate";
    }

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST request to /api/posts received");

    // リクエストボディを先に取得
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body));

    // クライアントから送信されたユーザーIDとメールアドレスを確認
    const clientProvidedUserId = body.userId;
    const userEmail = body.userEmail;
    console.log("クライアント提供のユーザーID:", clientProvidedUserId);
    console.log("クライアント提供のメールアドレス:", userEmail);

    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });

    let userId = null;

    // 1. まず、メールアドレスでユーザーを検索（既存のユーザーを優先）
    if (userEmail) {
      const { data: existingUserByEmail } = await supabase
        .from("User")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (existingUserByEmail) {
        console.log(
          "メールアドレスで既存ユーザーを見つけました:",
          existingUserByEmail.id
        );
        userId = existingUserByEmail.id;
      }
    }

    // 2. ユーザーが見つからない場合は、クライアント提供のIDを使用
    if (!userId && clientProvidedUserId) {
      // クライアント提供のIDでユーザーが存在するか確認
      const { data: existingUserById } = await supabase
        .from("User")
        .select("id")
        .eq("id", clientProvidedUserId)
        .single();

      if (existingUserById) {
        console.log("IDで既存ユーザーを見つけました:", existingUserById.id);
        userId = existingUserById.id;
      } else {
        userId = clientProvidedUserId;
      }
    }

    // ユーザーIDがない場合はエラー
    if (!userId) {
      console.log("ユーザーIDが利用できません - 認証エラー");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 必須データのバリデーション
    if (!body.imageUrl) {
      return NextResponse.json({ error: "画像は必須です" }, { status: 400 });
    }

    // Postテーブルにデータを挿入
    console.log("Inserting post data for user:", userId);

    try {
      const { data: post, error } = await supabase
        .from("Post")
        .insert({
          userId: userId,
          imageUrl: body.imageUrl,
          description: body.description || null,
          shutterSpeed: body.shutterSpeed || null,
          iso: body.iso || null,
          aperture: body.aperture || null,
          // locationカラムは存在しないため除外
          latitude: body.latitude || null,
          longitude: body.longitude || null,
        })
        .select(
          `
          *,
          User (
            id,
            email,
            name,
            avatarUrl
          )
        `
        )
        .single();

      if (error) {
        console.error("Error creating post:", error);
        return NextResponse.json(
          { error: "投稿の作成に失敗しました: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: post }, { status: 201 });
    } catch (dbError) {
      console.error("データベース操作エラー:", dbError);
      return NextResponse.json(
        { error: "データベース操作に失敗しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("DELETE リクエスト受信: /api/posts");

    // URLからパラメータを取得
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    console.log("削除対象の投稿ID:", postId);

    if (!postId) {
      console.log("投稿IDがリクエストに含まれていません");
      return NextResponse.json({ error: "投稿IDが必要です" }, { status: 400 });
    }

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });
    console.log("Supabaseクライアント初期化完了");

    // ヘッダー情報をログに出力
    const requestHeaders = Object.fromEntries(request.headers);
    console.log("リクエストヘッダー:", JSON.stringify(requestHeaders));

    // cookieのログ
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log("Cookieの数:", allCookies.length);

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

    if (!user) {
      console.log("認証エラー: ユーザーが未認証");
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
      currentUserId: user.id,
    });
    if (post.userId !== user.id) {
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
