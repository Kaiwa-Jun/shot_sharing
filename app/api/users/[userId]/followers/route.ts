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

    // フォロワー一覧を取得
    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: true, // フォロワーのユーザー情報も取得
      },
    });

    // フォロワーのユーザー情報のみを抽出
    const followerUsers = followers.map((follow) => follow.follower);

    return NextResponse.json(followerUsers);
  } catch (error) {
    console.error("フォロワー一覧取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
