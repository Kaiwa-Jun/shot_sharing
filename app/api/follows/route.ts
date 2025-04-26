import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { prisma } from "@/lib/prisma";

// フォロー中のユーザー一覧を取得
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

    // フォロー中のユーザー一覧を取得
    const follows = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: true, // フォロー中のユーザー情報も取得
      },
    });

    // フォロー中のユーザー情報のみを抽出
    const followingUsers = follows.map((follow) => follow.following);

    return NextResponse.json(followingUsers);
  } catch (error) {
    console.error("フォロー一覧取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// フォローする
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { followingId } = await request.json();

    if (!followingId) {
      return NextResponse.json(
        { error: "フォローするユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // 自分自身をフォローできないようにする
    if (data.user.id === followingId) {
      return NextResponse.json(
        { error: "自分自身をフォローすることはできません" },
        { status: 400 }
      );
    }

    // 既にフォロー済みかチェック
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: data.user.id,
        followingId: followingId,
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "既にフォロー済みです" },
        { status: 409 }
      );
    }

    // フォローを作成
    const follow = await prisma.follow.create({
      data: {
        followerId: data.user.id,
        followingId: followingId,
      },
    });

    return NextResponse.json(follow);
  } catch (error) {
    console.error("フォロー作成エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// フォローを解除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const url = new URL(request.url);
    const followingId = url.searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json(
        { error: "フォロー解除するユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // フォロー関係を削除
    await prisma.follow.deleteMany({
      where: {
        followerId: data.user.id,
        followingId: followingId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("フォロー解除エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
