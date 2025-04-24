"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard } from "@/components/post-card";
import { notFound } from "next/navigation";
import { Post } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 進行中のリクエストを追跡するためのフラグ
  const isFetchingRef = useRef(false);
  // 最後のフェッチ時間を記録
  const lastFetchTimeRef = useRef(0);
  // デバウンスタイマー
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 投稿データを取得する関数（デバウンス機能付き）
  const fetchPost = useCallback(
    async (force = false) => {
      // すでにリクエスト実行中の場合はスキップ
      if (isFetchingRef.current) {
        console.log("データ取得中のためスキップします");
        return;
      }

      // 前回のフェッチから2秒以内の場合はスキップ（forceオプションがない場合）
      const now = Date.now();
      const elapsed = now - lastFetchTimeRef.current;
      if (!force && elapsed < 2000) {
        console.log(`前回の取得から${elapsed}ms経過のためスキップします`);
        return;
      }

      // タイマーをクリア
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // 実際の取得処理
      const doFetch = async () => {
        if (!postId) return;

        // フェッチ中フラグをセット
        isFetchingRef.current = true;
        lastFetchTimeRef.current = Date.now();

        try {
          setIsLoading(true);
          console.log("投稿データを再取得します:", postId);
          const response = await fetch(`/api/posts/${postId}`);

          if (!response.ok) {
            if (response.status === 404) {
              notFound();
            }
            throw new Error("投稿の取得に失敗しました");
          }

          const data = await response.json();
          setPost(data.data);
        } catch (err) {
          console.error("投稿取得エラー:", err);
          setError("投稿の取得中にエラーが発生しました");
        } finally {
          setIsLoading(false);
          // フェッチ中フラグを解除
          isFetchingRef.current = false;
        }
      };

      // デバウンス処理
      debounceTimerRef.current = setTimeout(doFetch, 300);
    },
    [postId]
  );

  // いいねの状態が変更されたときに呼び出される関数
  const handleLikeStateChange = useCallback(
    (isLiked: boolean, likeCount: number) => {
      console.log("詳細ページでいいね状態の変更を検知:", {
        isLiked,
        likeCount,
      });

      // いいね状態が変更されたら、最新の投稿データを再取得する（強制取得）
      fetchPost(true);
    },
    [fetchPost]
  );

  // 初回マウント時にデータを取得
  useEffect(() => {
    if (postId) {
      fetchPost(true);
    }

    // コンポーネントのアンマウント時にタイマーをクリア
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [postId, fetchPost]);

  // ページがフォーカスを取得したとき、または表示状態が変わったときに投稿を再取得
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ページがフォーカスされたときに実行
    const handleFocus = () => {
      console.log("ページがフォーカスされました - 投稿データを更新します");
      fetchPost();
    };

    // ページの表示状態が変更されたときに実行（タブ切り替え時など）
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("ページが表示されました - 投稿データを更新します");
        fetchPost();
      }
    };

    // イベントリスナーを追加
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // クリーンアップ関数
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPost]);

  if (isLoading && !post) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center text-muted-foreground">
          投稿が見つかりませんでした
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32 lg:pb-8">
      <PostCard
        post={post}
        isDetail
        onLikeStateChange={handleLikeStateChange}
      />
    </div>
  );
}
