import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// 現在のユーザー情報を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json(
        { error: "ユーザーが認証されていません" },
        { status: 401 }
      );
    }

    // Prismaでユーザーを検索
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      // ユーザーがまだデータベースに存在しない場合は作成
      const newUser = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email || "",
          instagramUrl: data.user.user_metadata?.instagram_url || null,
          twitterUrl: data.user.user_metadata?.twitter_url || null,
          bio: data.user.user_metadata?.bio || null,
          name:
            data.user.user_metadata?.name ||
            data.user.user_metadata?.full_name ||
            null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
        },
      });

      return NextResponse.json(newUser);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// ユーザー情報を更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json(
        { error: "ユーザーが認証されていません" },
        { status: 401 }
      );
    }

    const userData = await request.json();

    // Prismaでユーザーを更新
    const updatedUser = await prisma.user.update({
      where: { id: data.user.id },
      data: {
        instagramUrl: userData.instagramUrl,
        twitterUrl: userData.twitterUrl,
        bio: userData.bio,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
      },
    });

    // Supabaseのユーザーメタデータも更新
    await supabase.auth.updateUser({
      data: {
        instagram_url: userData.instagramUrl,
        twitter_url: userData.twitterUrl,
        bio: userData.bio,
        name: userData.name,
        avatar_url: userData.avatarUrl,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("ユーザー更新エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
