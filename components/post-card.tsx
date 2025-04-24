"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  Repeat2,
  Share,
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
import { useState, useEffect, memo, useCallback } from "react";
import { ReplySection } from "@/components/reply-section";
import { ReplyDialog } from "@/components/reply-dialog";
import { Post } from "@/lib/supabase/types";
import { useSession } from "@/app/auth/session-provider";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAlert } from "@/components/alert-dialog";
import { CustomAlert } from "@/components/custom-alert";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LikeButton } from "./like-button";

interface PostCardProps {
  post: Post;
  isDetail?: boolean;
  onLikeStateChange?: (isLiked: boolean, likeCount: number) => void;
}

export function PostCard({ post, isDetail, onLikeStateChange }: PostCardProps) {
  const router = useRouter();
  const [showReplies, setShowReplies] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const { authUser, dbUser } = useSession();
  // 投稿が削除されたかどうかを管理するstate
  const [isDeleted, setIsDeleted] = useState(false);
  // アラートの表示状態を管理
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  // 削除成功メッセージ
  const [deleteMessage, setDeleteMessage] =
    useState("投稿が正常に削除されました");
  // 削除確認ダイアログの表示状態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // アラートが表示されたら、一定時間後に非表示にする
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  // nullチェックを追加
  if (!post || isDeleted) {
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

  // 削除確認ダイアログを表示
  const showDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  // 投稿を削除
  const handleDeletePost = async () => {
    // 認証チェック
    if (!authUser) {
      toast.error("削除するにはログインが必要です");
      return;
    }

    console.log("削除処理開始", {
      postId: post.id,
      postUserEmail: userEmail, // 投稿者のメールアドレス
      currentUserEmail: authUser.email, // 現在のユーザーのメールアドレス
      isCurrentUser, // ユーザー比較結果
    });

    // 投稿者とログインユーザーが一致するか再確認
    // IDでは不一致の場合があるため、メールアドレスで比較
    if (!isCurrentUser) {
      toast.error("自分の投稿のみ削除できます");
      return;
    }

    try {
      // 新しいシンプルなAPIエンドポイントを使用
      console.log("新しい削除エンドポイントを呼び出し: /api/delete-post");
      const response = await fetch("/api/delete-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          userEmail: authUser.email,
        }),
      });

      console.log("削除API応答:", response.status, response.statusText);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("レスポンス解析エラー:", parseError);
        throw new Error("サーバーからの応答を解析できませんでした");
      }

      console.log("削除API応答データ:", data);

      if (!response.ok) {
        throw new Error(data.error || "投稿の削除に失敗しました");
      }

      // 削除成功メッセージを設定
      setDeleteMessage("投稿が正常に削除されました");

      // 成功メッセージをトースト通知で表示
      toast.success("投稿が正常に削除されました", {
        duration: 3000,
        position: "top-center",
      });

      // カスタムアラートを表示
      console.log("削除成功: アラートを表示します");
      setShowSuccessAlert(true);

      // 詳細ページにいる場合はホームに戻る
      if (window.location.pathname.includes(`/posts/${post.id}`)) {
        console.log("詳細ページからホームページへリダイレクト");
        setTimeout(() => {
          router.push("/");
        }, 1500); // アラートが表示された後にリダイレクト
        return;
      }

      // フィード一覧にいる場合は、この投稿のみを非表示にする
      console.log("投稿を非表示にします");
      setIsDeleted(true);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(
        error instanceof Error ? error.message : "投稿の削除に失敗しました"
      );
    }
  };

  // AnimatePresenceを使って投稿カードにアニメーション効果を追加
  return (
    <>
      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="投稿の削除"
        description="この投稿を削除してもよろしいですか？削除すると元に戻せません。"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeletePost();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="削除する"
        cancelText="キャンセル"
        variant="destructive"
      />

      {/* 削除成功時のアラート */}
      {showSuccessAlert && (
        <CustomAlert
          message={deleteMessage}
          type="success"
          duration={3000}
          onClose={() => setShowSuccessAlert(false)}
        />
      )}

      <AnimatePresence>
        {!isDeleted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                        {userEmail
                          ? userEmail.substring(0, 2).toUpperCase()
                          : "UN"}
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
                            onClick={showDeleteDialog}
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
                <img
                  src={post.imageUrl}
                  alt="Photo"
                  className="w-full h-auto"
                />
              </div>

              <div className="p-4">
                <div className="flex gap-4 mb-4">
                  {/* いいねコンポーネントを分離したものを使用 */}
                  <LikeButton
                    postId={post.id}
                    initialIsLiked={!!post.userLiked}
                    initialLikeCount={post.Like?.length || 0}
                    onStateChange={onLikeStateChange}
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
                      <div className="text-muted-foreground">
                        シャッタースピード
                      </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

PostCard.displayName = "PostCard";
