import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// SQL関数を作成するエンドポイント
export async function GET() {
  try {
    console.log("セットアップエンドポイント起動");

    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient({ cookies });

    // 投稿を安全に削除するSQL関数を作成
    const safelyDeletePostSQL = `
      CREATE OR REPLACE FUNCTION safely_delete_post(target_post_id UUID)
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        success BOOLEAN;
      BEGIN
        -- まずいいねを削除
        DELETE FROM "Like" WHERE "postId" = target_post_id;

        -- コメントも削除（存在する場合）
        BEGIN
          DELETE FROM "Comment" WHERE "postId" = target_post_id;
        EXCEPTION WHEN undefined_table THEN
          -- コメントテーブルが存在しない場合は無視
          RAISE NOTICE 'Comment table does not exist, skipping';
        END;

        -- 投稿を削除
        DELETE FROM "Post" WHERE "id" = target_post_id;

        -- 成功を返す
        success := true;
        RETURN success;
      EXCEPTION WHEN OTHERS THEN
        -- エラーが発生した場合
        RAISE NOTICE 'Error during post deletion: %', SQLERRM;
        success := false;
        RETURN success;
      END;
      $$;
    `;

    console.log("safely_delete_post 関数を作成中...");
    const { error: fnError } = await supabase.rpc("exec_sql", {
      sql_query: safelyDeletePostSQL,
    });

    if (fnError) {
      // exec_sql RPC関数がない場合は直接SQL実行を試みる
      console.log("exec_sql関数が見つかりません。代替手段を試みます...");

      try {
        const { error: directError } = await supabase.rpc(
          "safely_delete_post",
          { target_post_id: "00000000-0000-0000-0000-000000000000" }
        );

        if (
          directError &&
          directError.message.includes("function does not exist")
        ) {
          console.log(
            "safely_delete_post関数が存在しません。管理コンソールでSQL関数を作成してください。"
          );
        } else {
          console.log("safely_delete_post関数はすでに存在します");
        }
      } catch (rpcError) {
        console.error("RPC呼び出しエラー:", rpcError);
      }

      return NextResponse.json({
        success: false,
        message:
          "SQL関数の作成に失敗しました。管理コンソールで手動で作成してください。",
        sql: safelyDeletePostSQL,
      });
    }

    console.log("safely_delete_post関数が作成されました");

    return NextResponse.json({
      success: true,
      message: "SQL関数が正常に作成されました",
    });
  } catch (error) {
    console.error("セットアップエラー:", error);
    return NextResponse.json(
      {
        error: "SQL関数の作成中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
