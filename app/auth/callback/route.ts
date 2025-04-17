import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Edge Runtimeの指定を一時的に削除
// export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // 認証コードの取得
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorCode = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // ユーザーをリダイレクトするURLを準備
  const redirectUrl = new URL("/", requestUrl.origin);
  const errorRedirectUrl = new URL("/auth/error", requestUrl.origin);

  try {
    // エラーがある場合は処理
    if (errorCode) {
      console.error(
        `Auth error: ${errorCode}. Description: ${errorDescription}`
      );
      errorRedirectUrl.searchParams.set("error", errorCode);
      errorRedirectUrl.searchParams.set("description", errorDescription || "");
      return NextResponse.redirect(errorRedirectUrl);
    }

    if (!code) {
      console.warn("No code found in callback URL");
      errorRedirectUrl.searchParams.set("error", "no_code");
      errorRedirectUrl.searchParams.set(
        "description",
        "認証コードが見つかりませんでした"
      );
      return NextResponse.redirect(errorRedirectUrl);
    }

    // クッキーストアを取得
    const cookieStore = cookies();

    // Supabaseサーバークライアントを作成
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error(`Failed to set cookie ${name}:`, error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {
              console.error(`Failed to delete cookie ${name}:`, error);
            }
          },
        },
      }
    );

    // PKCEコードベリファイアの存在を確認
    const allCookies = cookieStore.getAll();
    const hasCodeVerifier = allCookies.some(
      (cookie) =>
        cookie.name.includes("code_verifier") ||
        cookie.name.includes("supabase-auth-token")
    );

    if (!hasCodeVerifier) {
      console.warn(
        "No code verifier found in cookies. Session might not be properly established."
      );
    }

    // 認証コードをセッションに交換（PKCE検証を含む）
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth code exchange error:", error);

      // エラー情報をリダイレクトURLに追加
      errorRedirectUrl.searchParams.set("error", error.name || "unknown");
      errorRedirectUrl.searchParams.set(
        "description",
        error.message || "認証処理中にエラーが発生しました"
      );

      return NextResponse.redirect(errorRedirectUrl);
    }

    console.log("Auth code exchange successful, session established");

    // ホームページにリダイレクト（成功）
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Auth callback error:", error);

    // エラー情報をリダイレクトURLに追加
    errorRedirectUrl.searchParams.set("error", "server_error");
    errorRedirectUrl.searchParams.set(
      "description",
      error?.message || "サーバーエラーが発生しました"
    );

    return NextResponse.redirect(errorRedirectUrl);
  }
}
