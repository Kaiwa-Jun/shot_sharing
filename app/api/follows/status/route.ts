import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { prisma } from "@/lib/prisma";

// フォロー状態を確認するAPI
export async function GET(request: NextRequest) {
  try {
    // ログイン中のユーザーを取得
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // クエリパラメータから対象のユーザーIDを取得
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "対象のユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // フォロー関係を検索
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: data.user.id,
        followingId: targetUserId,
      },
    });

    // フォロー関係の有無を返す
    return NextResponse.json({
      isFollowing: !!follow,
      followId: follow ? follow.id : null,
    });
  } catch (error) {
    console.error("フォロー状態確認エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
