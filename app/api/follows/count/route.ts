import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// フォロー数・フォロワー数を取得するAPI
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータからユーザーIDを取得
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // フォロー数を取得
    const followingCount = await prisma.follow.count({
      where: {
        followerId: userId,
      },
    });

    // フォロワー数を取得
    const followerCount = await prisma.follow.count({
      where: {
        followingId: userId,
      },
    });

    return NextResponse.json({
      followingCount,
      followerCount,
    });
  } catch (error) {
    console.error("フォロー数取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
