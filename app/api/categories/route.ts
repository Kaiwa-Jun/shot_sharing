import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

// カテゴリー一覧を取得
export async function GET(request: Request) {
  console.log("GET /api/categories リクエスト受信");
  try {
    // Supabaseクライアントを初期化
    console.log("Supabaseクライアント初期化中...");
    const supabase = createRouteHandlerClient({ cookies });

    // すべてのカテゴリーを取得
    console.log("カテゴリーデータ取得開始");
    const { data: categories, error } = await supabase
      .from("Category")
      .select("*")
      .order("name");

    if (error) {
      console.error("カテゴリー取得エラー:", error);
      throw error;
    }

    console.log(`カテゴリー取得成功: ${categories?.length || 0}件`);
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
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

// 新しいカテゴリーを作成
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 名前の存在確認
    if (!body.name) {
      return NextResponse.json(
        { error: "カテゴリー名は必須です" },
        { status: 400 }
      );
    }

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // カテゴリーを作成
    const { data: category, error } = await supabase
      .from("Category")
      .insert({ name: body.name })
      .select()
      .single();

    if (error) {
      // 重複エラーの場合は409を返す
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "このカテゴリーは既に存在します" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
