import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // フォロー中のユーザー一覧を取得
    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: true, // フォロー中のユーザー情報も取得
      },
    });

    // フォロー中のユーザー情報のみを抽出
    const followingUsers = following.map((follow) => follow.following);

    return NextResponse.json(followingUsers);
  } catch (error) {
    console.error("フォロー中ユーザー一覧取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
