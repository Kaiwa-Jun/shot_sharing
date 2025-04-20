import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    // ミドルウェアクライアントを作成
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    try {
      // セッションを更新して最新の状態にする
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log(
        "ミドルウェアでのセッション状態:",
        session ? "存在します" : "存在しません"
      );
    } catch (sessionError) {
      // セッション取得エラーは警告として記録するが、リクエストは続行させる
      console.warn("セッション取得中のエラー:", sessionError);
    }

    return res;
  } catch (error) {
    console.error("ミドルウェアエラー:", error);
    // エラーが発生しても処理を続行
    return NextResponse.next();
  }
}

// このミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    // APIルートを含む全てのページで認証情報を更新
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
