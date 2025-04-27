import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

// カテゴリーごとの投稿数を取得
export async function GET(request: Request) {
  console.log("GET /api/categories/counts リクエスト受信");
  try {
    // Supabaseクライアントを初期化
    console.log("Supabaseクライアント初期化中...");
    const supabase = createRouteHandlerClient({ cookies });

    // カテゴリーごとの投稿数を取得
    console.log("カテゴリーごとの投稿数取得開始");
    const { data, error } = await supabase.from("Category").select(`
        id,
        name,
        posts:PostCategory(count)
      `);

    if (error) {
      console.error("カテゴリー投稿数取得エラー:", error);
      throw error;
    }

    // データを整形：カウント情報を取得しやすい形式に変換
    const formattedData = data.map((category) => ({
      id: category.id,
      name: category.name,
      count: category.posts[0]?.count || 0,
    }));

    console.log(`カテゴリー投稿数取得成功: ${formattedData.length}件`);
    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching category counts:", error);
    // エラーの詳細情報を含める
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails =
      error instanceof Error && "code" in error
        ? { code: (error as any).code }
        : {};

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
