import React, { memo, useCallback, useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/app/auth/session-provider";
import { toast } from "sonner";

interface LikeButtonProps {
  postId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  onStateChange?: (isLiked: boolean, likeCount: number) => void;
}

// いいねボタンを別コンポーネントに分離してメモ化
export const LikeButton = memo(
  ({
    postId,
    initialIsLiked,
    initialLikeCount,
    onStateChange,
  }: LikeButtonProps) => {
    const { authUser } = useSession();
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    // いいね処理中かどうかの状態を追加
    const [isUpdating, setIsUpdating] = useState(false);

    // いいね状態を直接チェックする関数
    const checkLikeStatus = useCallback(
      async (postId: string, userId: string) => {
        try {
          const response = await fetch(
            `/api/posts/${postId}/like/check?userId=${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            const newIsLiked = !!data.isLiked;
            setIsLiked(newIsLiked);

            // 親コンポーネントに状態変更を通知（任意）
            if (onStateChange && newIsLiked !== isLiked) {
              onStateChange(
                newIsLiked,
                newIsLiked ? likeCount + 1 : likeCount - 1
              );
            }
          }
        } catch (error) {
          console.error("いいね状態チェックエラー:", error);
        }
      },
      [isLiked, likeCount, onStateChange]
    );

    // コンポーネントマウント時と認証ユーザー変更時にいいね状態チェック
    useEffect(() => {
      if (authUser && postId) {
        checkLikeStatus(postId, authUser.id);
      }
    }, [postId, authUser, checkLikeStatus]);

    // いいねボタンをクリック
    const handleLikeClick = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();

        // 処理中なら操作を受け付けない
        if (isUpdating) return;

        // 認証チェック - ログインしていない場合はエラーメッセージを表示
        if (!authUser) {
          toast.error("いいねするにはログインが必要です");
          return;
        }

        // 処理中フラグをセット
        setIsUpdating(true);

        // 現在のいいね状態を保存（元に戻すために使用）
        const currentLiked = isLiked;
        const currentCount = likeCount;

        // 楽観的UI更新（すぐに表示を更新）
        const newIsLiked = !currentLiked;
        setIsLiked(newIsLiked);
        const newLikeCount = currentLiked ? likeCount - 1 : likeCount + 1;
        setLikeCount(newLikeCount);

        // 親コンポーネントに状態変更を通知（任意）
        if (onStateChange) {
          onStateChange(newIsLiked, newLikeCount);
        }

        // いいね処理を実装するためのAPI呼び出し
        try {
          // リクエストボディにユーザーIDを含める
          const response = await fetch(
            `/api/posts/${postId}/like?userId=${authUser.id}`,
            {
              method: currentLiked ? "DELETE" : "POST", // 最新のいいね状態に基づいて操作を決定
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: authUser.id }), // ユーザーIDをリクエストボディに含める
              credentials: "include", // クッキーを含める
            }
          );

          if (!response.ok) {
            // サーバーからのエラーレスポンスを処理
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "いいねの処理に失敗しました");
          }

          // 成功時の処理
          // 状態確認のための追加リクエストは削除（チラつきの原因になる可能性があるため）
        } catch (error) {
          console.error("Error liking post:", error);
          // 失敗した場合は元に戻す
          setIsLiked(currentLiked);
          setLikeCount(currentCount);

          // 親コンポーネントにも状態を元に戻すことを通知
          if (onStateChange) {
            onStateChange(currentLiked, currentCount);
          }

          // エラーメッセージを表示
          const errorMessage =
            error instanceof Error
              ? error.message
              : "いいねの処理に失敗しました";
          toast.error(errorMessage);
        } finally {
          // 処理完了後、フラグをリセット
          setIsUpdating(false);
        }
      },
      [authUser, isLiked, likeCount, postId, onStateChange, isUpdating]
    );

    return (
      <button
        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        onClick={handleLikeClick}
        disabled={isUpdating}
      >
        <Heart
          className={cn(
            "h-5 w-5 transform transition-all duration-300 ease-in-out",
            isLiked ? "fill-red-500 text-red-500 scale-110" : "text-gray-600"
          )}
        />
        <span className="transition-all duration-200">{likeCount}</span>
      </button>
    );
  }
);

LikeButton.displayName = "LikeButton";
