"use client";

import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn, isBrowser } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect, memo } from "react";
import { ReplySection } from "@/components/reply-section";
import { ReplyDialog } from "@/components/reply-dialog";
import { Post } from "@/lib/supabase/types";
import { useSession } from "@/app/auth/session-provider";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
  isDetail?: boolean;
}

// いいねボタンコンポーネント - メモ化してパフォーマンス向上
export const LikeButton = memo(
  ({
    postId,
    initialIsLiked,
    initialLikeCount,
  }: {
    postId: string;
    initialIsLiked: boolean;
    initialLikeCount: number;
  }) => {
    const { authUser } = useSession();
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);

    // いいね状態を直接チェックする関数
    const checkLikeStatus = async (postId: string, userId: string) => {
      try {
        const response = await fetch(
          `/api/posts/${postId}/like/check?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("いいね状態チェック結果:", data);
          setIsLiked(!!data.isLiked);
        }
      } catch (error) {
        console.error("いいね状態チェックエラー:", error);
      }
    };

    // コンポーネントマウント時と認証ユーザー変更時にいいね状態チェック
    useEffect(() => {
      if (authUser && postId) {
        checkLikeStatus(postId, authUser.id);
      }
    }, [postId, authUser]);

    // いいねボタンをクリック
    const handleLikeClick = async (e: React.MouseEvent) => {
      e.stopPropagation();

      // 認証チェック - ログインしていない場合はエラーメッセージを表示
      if (!authUser) {
        toast.error("いいねするにはログインが必要です");
        return;
      }

      console.log("認証情報 (クライアント):", {
        userId: authUser.id,
        email: authUser.email,
        isAuthenticated: !!authUser,
      });

      // いいね操作の実行フラグ
      let shouldContinue = true;
      // 実際のいいね状態
      let currentLiked = isLiked;

      // いいね操作の前に最新のいいね状態をチェック
      if (postId) {
        try {
          const checkResponse = await fetch(
            `/api/posts/${postId}/like/check?userId=${authUser.id}`
          );
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            console.log("操作前のいいね状態チェック:", checkData);

            // 現在のいいね状態を更新
            currentLiked = checkData.isLiked;

            // UI状態と実際の状態が一致しない場合は警告
            if (currentLiked !== isLiked) {
              console.log("状態の不一致を検出:", {
                uiState: isLiked,
                actualState: currentLiked,
              });
              // UI状態を実際の状態に合わせる
              setIsLiked(currentLiked);
            }
          }
        } catch (checkError) {
          console.error("いいね状態確認エラー:", checkError);
          // エラー時も処理を続行
        }
      }

      // 最新のいいね状態をUIに反映
      setIsLiked(!currentLiked);
      setLikeCount((prev) => (currentLiked ? prev - 1 : prev + 1));

      // いいね処理を実装するためのAPI呼び出し
      try {
        console.log("いいね操作実行:", {
          操作: currentLiked ? "削除" : "追加",
          method: currentLiked ? "DELETE" : "POST",
          currentLiked,
        });

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
          console.error("サーバーエラー詳細:", errorData);
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

        // エラーメッセージを表示
        const errorMessage =
          error instanceof Error ? error.message : "いいねの処理に失敗しました";
        toast.error(errorMessage);
      }
    };

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
// 表示名を設定（デバッグのため）
LikeButton.displayName = "LikeButton";

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [showReplies, setShowReplies] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const { authUser, dbUser } = useSession();

  // nullチェックを追加
  if (!post) {
    return null;
  }

  // ユーザー情報を取得
  const userId = post.User?.id || post.userId;
  const userEmail = post.User?.email;

  // 投稿者のメールアドレスとログインユーザーのメールアドレスが一致するか確認
  // IDではなくメールアドレスで比較（画像から見るとこちらの方が確実）
  const isCurrentUser = authUser?.email === userEmail;

  // アバターURLを取得
  let avatarUrl: string | undefined;

  if (isCurrentUser && authUser) {
    // 現在のユーザーが投稿者の場合、authUserのメタデータから直接取得
    avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      dbUser?.avatarUrl;
  } else {
    // 他のユーザーの場合、投稿データからアバターURLを取得
    // または、Dicebearのプレースホルダーを使用
    avatarUrl = userId
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      : undefined;
  }

  // 投稿の詳細ページに移動
  const handleCardClick = () => {
    router.push(`/posts/${post.id}`);
  };

  // コメントボタンをクリック
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReplyDialogOpen(true);
  };

  // シェアボタンをクリック
  const handleShare = () => {
    if (isBrowser() && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.origin}/posts/${post.id}`
      );
      toast.success("URLをコピーしました");
    } else {
      toast.error("この機能はブラウザでのみ利用可能です");
    }
  };

  // 投稿を編集
  const handleEditPost = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 編集機能は未実装
  };

  // 投稿を削除
  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 削除機能は未実装
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={avatarUrl} alt="User Avatar" />
              <AvatarFallback>
                {userEmail ? userEmail.substring(0, 2).toUpperCase() : "UN"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {isCurrentUser && authUser?.user_metadata?.full_name
                  ? authUser.user_metadata.full_name
                  : userEmail || "不明なユーザー"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isCurrentUser && (
                <>
                  <DropdownMenuItem
                    onClick={handleEditPost}
                    className="flex justify-between"
                  >
                    <span>投稿の編集</span>
                    <Edit className="ml-8 h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeletePost}
                    className="flex justify-between"
                  >
                    <span>投稿の削除</span>
                    <Trash2 className="ml-8 h-4 w-4" />
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={handleShare}
                className="flex justify-between"
              >
                <span>投稿の共有</span>
                <Share2 className="ml-8 h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <img src={post.imageUrl} alt="Photo" className="w-full h-auto" />
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-4">
          {/* いいねコンポーネントを分離 */}
          <LikeButton
            postId={post.id}
            initialIsLiked={!!post.userLiked}
            initialLikeCount={post.Like?.length || 0}
          />

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 px-2"
            onClick={handleCommentClick}
          >
            <MessageCircle className="h-5 w-5" />
            <span>0</span>
          </Button>
        </div>

        {/* EXIF情報をまとめて表示 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
          {post.shutterSpeed && (
            <div>
              <div className="text-muted-foreground">シャッタースピード</div>
              <div className="font-medium">{post.shutterSpeed}</div>
            </div>
          )}
          {post.iso && (
            <div>
              <div className="text-muted-foreground">ISO</div>
              <div className="font-medium">{post.iso}</div>
            </div>
          )}
          {post.aperture && (
            <div>
              <div className="text-muted-foreground">絞り</div>
              <div className="font-medium">f/{post.aperture}</div>
            </div>
          )}
          {post.latitude && post.longitude && (
            <div>
              <div className="text-muted-foreground">位置情報</div>
              <div className="font-medium">
                {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}
              </div>
            </div>
          )}
        </div>

        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ReplySection postId={post.id} />
          </motion.div>
        )}
      </div>

      <ReplyDialog
        open={isReplyDialogOpen}
        onOpenChange={setIsReplyDialogOpen}
        postId={post.id}
      />
    </Card>
  );
}
