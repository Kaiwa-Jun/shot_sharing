"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "unknown";
  const description =
    searchParams.get("description") || "認証中にエラーが発生しました";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-red-600">
          認証エラー
        </h1>

        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="font-semibold">エラーコード: {error}</p>
          <p className="mt-2 text-gray-700">{description}</p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <h2 className="font-medium">考えられる原因:</h2>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>セッションの有効期限が切れている</li>
              <li>ブラウザのCookieに問題がある</li>
              <li>認証フローが中断された</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Link
              href="/auth/signin"
              className="block w-full py-2 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              ログインし直す
            </Link>
            <Link
              href="/"
              className="block w-full py-2 text-center text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
