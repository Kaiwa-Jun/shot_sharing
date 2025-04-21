import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// キャッシュを無効化し、常に最新データを取得するための設定
export const dynamic = "force-dynamic";

// ユーザーの投稿を取得するGETリクエスト
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log(
      "🔍 デバッグ - ユーザー投稿取得リクエスト開始: /api/users/[userId]/posts",
      params.userId
    );

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log(
      "🔍 デバッグ - 認証ユーザー情報:",
      user ? { id: user.id, email: user.email } : "未認証"
    );
    console.log("🔍 デバッグ - リクエストされたユーザーID:", params.userId);

    // ユーザーIDがリクエストと一致するか確認（デバッグ用）
    const isCurrentUser = user && user.id === params.userId;
    console.log("🔍 デバッグ - 閲覧中の投稿は自分の投稿か:", isCurrentUser);

    // ユーザーテーブルを検索して実際のユーザーIDを特定
    const { data: userRecord, error: userError } = await supabase
      .from("User")
      .select("id, email")
      .eq("id", params.userId)
      .maybeSingle();

    let targetUserId = params.userId;

    if (!userRecord && user) {
      // もしUserテーブルに該当IDのレコードがない場合、
      // 認証ユーザーのメールアドレスで検索する
      const { data: userByEmail } = await supabase
        .from("User")
        .select("id, email")
        .eq("email", user.email)
        .maybeSingle();

      if (userByEmail) {
        console.log(
          "🔍 デバッグ - メールで一致するユーザーを発見:",
          userByEmail.id
        );
        targetUserId = userByEmail.id;
      }
    } else if (userRecord) {
      console.log("🔍 デバッグ - IDで一致するユーザーを発見:", userRecord.id);
    }

    console.log("🔍 デバッグ - 最終的に使用するユーザーID:", targetUserId);

    // 投稿の取得を試みる
    console.log(
      `🔍 デバッグ - クエリ実行: userId=${targetUserId} の投稿を取得`
    );
    const { data: posts, error: postsError } = await supabase
      .from("Post")
      .select(
        `
        *,
        User (*),
        Like (*)
      `
      )
      .eq("userId", targetUserId)
      .order("createdAt", { ascending: false });

    if (postsError) {
      console.error("🔍 デバッグ - 投稿取得エラー:", postsError);
      return NextResponse.json(
        { error: "投稿の取得に失敗しました", details: postsError },
        { status: 500 }
      );
    }

    // IDで投稿が見つからない場合、ユーザーのメールアドレスに関連する投稿を検索
    if ((!posts || posts.length === 0) && user) {
      console.log(
        "🔍 デバッグ - IDでの検索結果が0件。メールアドレスを使用して再検索を試みます"
      );

      // ユーザーのメールアドレスでDBのユーザーIDを取得
      const { data: userByEmail } = await supabase
        .from("User")
        .select("id, email")
        .eq("email", user.email)
        .maybeSingle();

      if (userByEmail) {
        console.log(
          "🔍 デバッグ - メールアドレスからDBユーザーID取得:",
          userByEmail.id
        );

        // そのユーザーIDで投稿を再検索
        const { data: emailPosts, error: emailPostsError } = await supabase
          .from("Post")
          .select(
            `
            *,
            User (*),
            Like (*)
          `
          )
          .eq("userId", userByEmail.id)
          .order("createdAt", { ascending: false });

        if (!emailPostsError && emailPosts && emailPosts.length > 0) {
          console.log(
            `🔍 デバッグ - メールアドレスから ${emailPosts.length} 件の投稿を発見`
          );
          return formatAndReturnPosts(emailPosts, user, supabase);
        }
      }
    }

    console.log(
      `🔍 デバッグ - クエリ結果: ${posts ? posts.length : 0}件の投稿を取得`
    );

    if (!posts || posts.length === 0) {
      console.log("🔍 デバッグ - ユーザーの投稿はありません");

      // 全ての投稿を取得して確認（デバッグ用）
      console.log("🔍 デバッグ - すべての投稿を確認します");
      const { data: allPosts } = await supabase
        .from("Post")
        .select("id, userId, createdAt")
        .order("createdAt", { ascending: false })
        .limit(10);

      if (allPosts && allPosts.length > 0) {
        console.log("🔍 デバッグ - 最新の投稿サンプル:", allPosts);

        // 投稿テーブルに存在するユーザーIDを列挙
        const userIds = allPosts
          .map((post) => post.userId)
          .filter((id, index, self) => self.indexOf(id) === index);

        console.log("🔍 デバッグ - 投稿に含まれるユーザーID一覧:", userIds);

        // これらのユーザーIDに対応するユーザー情報を取得
        const { data: usersInfo } = await supabase
          .from("User")
          .select("id, email")
          .in("id", userIds);

        console.log(
          "🔍 デバッグ - これらのユーザーIDに対応するユーザー:",
          usersInfo
        );

        // ユーザーのメールアドレスと一致するユーザーを探す
        if (user && usersInfo) {
          const matchingUser = usersInfo.find((u) => u.email === user.email);
          if (matchingUser) {
            console.log(
              "🔍 デバッグ - メールアドレスが一致するユーザーID:",
              matchingUser.id
            );

            // このユーザーIDで投稿を再取得
            const { data: matchingPosts } = await supabase
              .from("Post")
              .select(
                `
                *,
                User (*),
                Like (*)
              `
              )
              .eq("userId", matchingUser.id)
              .order("createdAt", { ascending: false });

            if (matchingPosts && matchingPosts.length > 0) {
              console.log(
                `🔍 デバッグ - メールアドレスマッチから ${matchingPosts.length} 件の投稿を発見`
              );
              return formatAndReturnPosts(matchingPosts, user, supabase);
            }
          }
        }
      }

      return NextResponse.json({ posts: [] });
    }

    return formatAndReturnPosts(posts, user, supabase);
  } catch (error) {
    console.error("🔍 デバッグ - ユーザー投稿取得処理エラー:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました", details: String(error) },
      { status: 500 }
    );
  }
}

// 投稿フォーマット用のヘルパー関数
async function formatAndReturnPosts(posts: any[], user: any, supabase: any) {
  // 投稿データを加工
  const formattedPosts = await Promise.all(
    posts.map(async (post: any) => {
      // 現在のユーザーがいいねしているかどうかチェック
      let userLiked = false;

      if (user) {
        const { data: likeData } = await supabase
          .from("Like")
          .select("*")
          .eq("userId", user.id)
          .eq("postId", post.id)
          .maybeSingle();

        userLiked = !!likeData;
      }

      return {
        ...post,
        userLiked,
      };
    })
  );

  console.log(
    `🔍 デバッグ - ${formattedPosts.length}件のユーザー投稿を取得しました`
  );

  // レスポンスの一部をログ出力
  if (formattedPosts.length > 0) {
    const samplePost = formattedPosts[0];
    console.log("🔍 デバッグ - 最初の投稿サンプル:", {
      id: samplePost.id,
      userId: samplePost.userId,
      createdAt: samplePost.createdAt,
      userInfo: samplePost.User
        ? {
            id: samplePost.User.id,
            email: samplePost.User.email,
          }
        : "ユーザー情報なし",
    });
  }

  return NextResponse.json({ posts: formattedPosts });
}
