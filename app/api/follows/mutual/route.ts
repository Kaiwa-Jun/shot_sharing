import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { prisma } from "@/lib/prisma";

// 相互フォロー状態を確認するAPI
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータからユーザーIDのリストを取得
    const url = new URL(request.url);
    const userIds = url.searchParams.getAll("userId");

    if (!userIds.length) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // ログイン中のユーザーを取得
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    console.log("[DEBUG] 相互フォローチェック: ログインユーザー", data.user.id);
    console.log("[DEBUG] 相互フォローチェック: 対象ユーザー", userIds);

    // 対象ユーザーそれぞれとの関係をチェック
    const results: Record<
      string,
      { isFollowing: boolean; isFollower: boolean }
    > = {};

    for (const userId of userIds) {
      // ログインユーザーが対象ユーザーをフォローしているか
      const following = await prisma.follow.findFirst({
        where: {
          followerId: data.user.id,
          followingId: userId,
        },
      });

      // 対象ユーザーがログインユーザーをフォローしているか
      const follower = await prisma.follow.findFirst({
        where: {
          followerId: userId,
          followingId: data.user.id,
        },
      });

      results[userId] = {
        isFollowing: !!following,
        isFollower: !!follower,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("相互フォロー状態確認エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
