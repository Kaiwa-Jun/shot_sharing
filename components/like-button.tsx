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

        // 認証チェック - ログインしていない場合はエラーメッセージを表示
        if (!authUser) {
          toast.error("いいねするにはログインが必要です");
          return;
        }

        // いいね操作の実行フラグ
        let currentLiked = isLiked;

        // いいね操作の前に最新のいいね状態をチェック
        if (postId) {
          try {
            const checkResponse = await fetch(
              `/api/posts/${postId}/like/check?userId=${authUser.id}`
            );
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();

              // 現在のいいね状態を更新
              currentLiked = checkData.isLiked;

              // UI状態と実際の状態が一致しない場合は警告
              if (currentLiked !== isLiked) {
                // UI状態を実際の状態に合わせる
                setIsLiked(currentLiked);
              }
            }
          } catch (checkError) {
            console.error("いいね状態確認エラー:", checkError);
            // エラー時も処理を続行
          }
        }

        // 新しいいいね状態
        const newIsLiked = !currentLiked;
        // 最新のいいね状態をUIに反映
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

          // 操作成功後、500msの遅延を入れて再度いいね状態をチェック
          setTimeout(async () => {
            if (postId && authUser) {
              await checkLikeStatus(postId, authUser.id);
            }
          }, 500);
        } catch (error) {
          console.error("Error liking post:", error);
          // 失敗した場合は元に戻す
          setIsLiked(currentLiked);
          setLikeCount((prev) => (currentLiked ? prev + 1 : prev - 1));

          // 親コンポーネントにも状態を元に戻すことを通知
          if (onStateChange) {
            onStateChange(currentLiked, currentLiked ? likeCount : likeCount);
          }

          // エラーメッセージを表示
          const errorMessage =
            error instanceof Error
              ? error.message
              : "いいねの処理に失敗しました";
          toast.error(errorMessage);
        }
      },
      [authUser, isLiked, likeCount, postId, onStateChange, checkLikeStatus]
    );

    return (
      <button
        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        onClick={handleLikeClick}
      >
        <Heart
          className={cn(
            "h-5 w-5",
            isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
          )}
        />
        <span>{likeCount}</span>
      </button>
    );
  }
);

LikeButton.displayName = "LikeButton";
