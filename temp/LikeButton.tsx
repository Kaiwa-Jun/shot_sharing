// いいねボタンコンポーネント - パフォーマンスを最適化
import { useState, useEffect, useRef, memo } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/app/auth/session-provider";
import { toast } from "sonner";

export const LikeButton = memo(
  ({
    postId,
    initialIsLiked,
    initialLikeCount,
    onStateChange,
  }: {
    postId: string;
    initialIsLiked: boolean;
    initialLikeCount: number;
    onStateChange?: (isLiked: boolean, likeCount: number) => void;
  }) => {
    const { authUser } = useSession();
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);

    // 状態確認中フラグと最後の操作時間を記録
    const isProcessingRef = useRef(false);
    const lastActionTimeRef = useRef(0);

    // いいね状態を直接チェックする関数
    const checkLikeStatus = async (postId: string, userId: string) => {
      // 操作中または最後の操作から500ms以内はスキップ
      if (
        isProcessingRef.current ||
        Date.now() - lastActionTimeRef.current < 500
      ) {
        return;
      }

      isProcessingRef.current = true;

      try {
        const response = await fetch(
          `/api/posts/${postId}/like/check?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          const newIsLiked = !!data.isLiked;

          // 状態が変わった場合のみUI更新
          if (newIsLiked !== isLiked) {
            setIsLiked(newIsLiked);

            // いいねカウントも実際の状態に合わせる（古いカウントに依存しない）
            const newCount = newIsLiked
              ? Math.max(initialLikeCount, likeCount) + 1
              : Math.max(1, likeCount) - 1;

            setLikeCount(newCount);

            // 親コンポーネントに通知
            if (onStateChange) {
              onStateChange(newIsLiked, newCount);
            }
          }
        }
      } catch (error) {
        console.error("いいね状態チェックエラー:", error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // いいねボタンをクリック
    const handleLikeClick = async (e: React.MouseEvent) => {
      e.stopPropagation();

      // 認証チェック
      if (!authUser) {
        toast.error("いいねするにはログインが必要です");
        return;
      }

      // 連続クリック防止
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      lastActionTimeRef.current = Date.now();

      // 現在の状態を保存
      const currentLiked = isLiked;

      // UI即時更新（オプティミスティックUI）
      const newIsLiked = !currentLiked;
      setIsLiked(newIsLiked);
      const newLikeCount = currentLiked ? likeCount - 1 : likeCount + 1;
      setLikeCount(newLikeCount);

      // 親コンポーネントに通知
      if (onStateChange) {
        onStateChange(newIsLiked, newLikeCount);
      }

      // APIリクエスト
      try {
        const response = await fetch(
          `/api/posts/${postId}/like?userId=${authUser.id}`,
          {
            method: currentLiked ? "DELETE" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: authUser.id }),
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "いいねの処理に失敗しました");
        }

        // 成功したら500ms後に状態を確認
        setTimeout(() => {
          isProcessingRef.current = false;
          if (authUser) checkLikeStatus(postId, authUser.id);
        }, 500);
      } catch (error) {
        console.error("いいね処理エラー:", error);

        // 失敗したら元に戻す
        setIsLiked(currentLiked);
        setLikeCount(currentLiked ? likeCount + 1 : likeCount - 1);

        if (onStateChange) {
          onStateChange(
            currentLiked,
            currentLiked ? likeCount + 1 : likeCount - 1
          );
        }

        toast.error(
          error instanceof Error ? error.message : "いいねの処理に失敗しました"
        );
        isProcessingRef.current = false;
      }
    };

    // マウント時とユーザー変更時に1回だけ状態チェック
    useEffect(() => {
      let isMounted = true;

      if (authUser && postId && isMounted) {
        // マウント直後はすぐにチェックしない（他の処理優先）
        const timer = setTimeout(() => {
          if (isMounted) checkLikeStatus(postId, authUser.id);
        }, 300);

        return () => {
          isMounted = false;
          clearTimeout(timer);
        };
      }
    }, [authUser, postId]);

    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 px-2"
        onClick={handleLikeClick}
      >
        <Heart
          className={cn(
            "h-5 w-5",
            isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
          )}
        />
        <span>{likeCount}</span>
      </Button>
    );
  }
);

LikeButton.displayName = "LikeButton";
