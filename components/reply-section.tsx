"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Comment } from "@/lib/supabase/types";
import { useSession } from "@/app/auth/session-provider";
import { toast } from "sonner";
import eventEmitter, { EVENTS } from "@/lib/utils/event-emitter";

interface Reply {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    name: string;
    avatar: string;
  };
}

interface ReplySectionProps {
  postId: string;
  isMobile?: boolean;
  onReplyCountChange?: (count: number) => void;
}

// ユーザーアバターURLを取得するヘルパー関数
const getUserAvatarUrl = (user: any) => {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.avatarUrl ||
    (user?.id
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
      : undefined)
  );
};

// ユーザー名を取得するヘルパー関数
const getUserDisplayName = (user: any) => {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.name ||
    user?.email ||
    "ゲスト"
  );
};

// Separate component for the reply form to prevent unnecessary re-renders
const ReplyForm = ({
  onSubmit,
  isMobile,
  hasReplies,
  isSubmitting,
}: {
  onSubmit: (text: string) => Promise<void>;
  isMobile: boolean;
  hasReplies: boolean;
  isSubmitting: boolean;
}) => {
  const [text, setText] = useState("");
  const { authUser, dbUser } = useSession();

  // ユーザーアイコンを取得
  const avatarUrl = getUserAvatarUrl(authUser) || getUserAvatarUrl(dbUser);

  // ユーザーのイニシャルまたはデフォルト値
  const initials = authUser?.email
    ? authUser.email.substring(0, 2).toUpperCase()
    : "ゲスト";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    // 認証チェック
    if (!authUser) {
      toast.error("コメントを投稿するにはログインが必要です");
      return;
    }

    try {
      await onSubmit(text);
      setText("");
    } catch (error) {
      console.error("コメント送信エラー:", error);
    }
  };

  if (isMobile) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="User Avatar" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {hasReplies && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
          )}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="返信をポスト"
            className="w-full h-10 px-4 pr-20 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={isSubmitting}
            >
              <Image className="h-5 w-5" />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8"
              disabled={!text.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt="User Avatar" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {hasReplies && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
          )}
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="返信を入力..."
              className="w-full min-h-[80px] p-3 pr-12 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              disabled={isSubmitting}
            />
            <div className="absolute bottom-3 right-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isSubmitting}
              >
                <Image className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              className="rounded-full"
              disabled={!text.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  送信中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  返信
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export function ReplySection({
  postId,
  isMobile = false,
  onReplyCountChange,
}: ReplySectionProps) {
  const [comments, setComments] = useState<any[]>([]); // 型は後で適切に修正
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authUser, dbUser } = useSession();

  // コメントを取得する関数
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("コメントの取得に失敗しました");
      }

      const data = await response.json();
      console.log("取得したコメントデータ:", data);

      if (data.data) {
        // コメントデータを正規化して、user情報を確実に取得
        const normalizedComments = data.data.map((comment: any) => {
          // userオブジェクトを正規化するための情報をAPIから取得
          const userData = comment.user || {};

          return {
            ...comment,
            // ユーザー情報を適切に設定
            user: {
              ...userData,
              // ユーザーメタデータを確保
              user_metadata: userData.user_metadata || {},
            },
          };
        });

        setComments(normalizedComments);
        onReplyCountChange?.(normalizedComments.length);
      }
    } catch (error) {
      console.error("コメント取得エラー:", error);
      toast.error("コメントの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時とpostIdが変更されたときにコメントを取得
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // コメントを投稿する関数
  const handleSubmit = async (text: string) => {
    // 認証チェック
    if (!authUser) {
      toast.error("コメントを投稿するにはログインが必要です");
      return;
    }

    // ユーザーIDを取得
    const userId = authUser.id;
    if (!userId) {
      console.error("ユーザーIDが取得できません", authUser);
      toast.error("ユーザー情報の取得に失敗しました");
      return;
    }

    console.log("コメント投稿開始:", {
      認証済み: !!authUser,
      ユーザーID: userId,
      メール: authUser.email,
    });

    setIsSubmitting(true);
    try {
      // URLにユーザーIDをクエリパラメータとして追加
      const url = `/api/comments?userId=${encodeURIComponent(userId)}`;
      console.log("リクエスト送信先:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: text,
          userId: userId, // ボディにもユーザーIDを含める
        }),
        credentials: "include", // 重要: 認証クッキーを含める
      });

      // レスポンスのステータスをログ出力
      console.log("コメント投稿レスポンス:", {
        ステータス: response.status,
        OK: response.ok,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("エラーレスポンス:", errorData);
        } catch (e) {
          console.error("エラーレスポンスのパースに失敗:", e);
          errorData = { error: "不明なエラー" };
        }
        throw new Error(errorData.error || "コメントの投稿に失敗しました");
      }

      const data = await response.json();
      console.log("投稿したコメント:", data);

      if (data.data) {
        // 新しいコメントも正規化してからコメントリストに追加
        const newComment = {
          ...data.data,
          user: {
            id: userId,
            name: getUserDisplayName(authUser),
            avatarUrl: getUserAvatarUrl(authUser) || getUserAvatarUrl(dbUser),
            user_metadata: authUser.user_metadata || {},
          },
        };

        // 既存のコメントに新しいコメントを追加
        const newComments = [...comments, newComment];
        setComments(newComments);
        onReplyCountChange?.(newComments.length);
        toast.success("コメントを投稿しました");

        // グローバルイベントを発行
        console.log("[ReplySection] コメント追加イベント発行:", { postId });
        eventEmitter.emit(EVENTS.COMMENT_ADDED, postId);
      }
    } catch (error) {
      console.error("コメント投稿エラー:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの投稿に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {isMobile ? (
          <div className="p-3">
            <ReplyForm
              onSubmit={handleSubmit}
              isMobile={true}
              hasReplies={comments.length > 0}
              isSubmitting={isSubmitting}
            />
            {comments.length > 0 && (
              <div className="mt-4 space-y-4">
                {comments.map((comment, index) => {
                  // User型からユーザー情報を取得
                  const user = comment.user || {};

                  // ユーザー情報を取得
                  const displayName = getUserDisplayName(user);

                  console.log("コメント表示データ:", {
                    commentId: comment.id,
                    userId: user.id,
                    userName: displayName,
                    avatarUrl: getUserAvatarUrl(user),
                    rawUser: user,
                  });

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="relative flex gap-2"
                    >
                      <div className="relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 -translate-y-6 bg-border" />
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={getUserAvatarUrl(user)}
                            alt={`${displayName}のアバター`}
                          />
                          <AvatarFallback>
                            {displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index < comments.length - 1 && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: ja,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-background p-4 rounded-lg">
              <ReplyForm
                onSubmit={handleSubmit}
                isMobile={false}
                hasReplies={comments.length > 0}
                isSubmitting={isSubmitting}
              />
            </div>

            {comments.length > 0 && (
              <div className="bg-background p-4 rounded-lg space-y-6">
                {comments.map((comment, index) => {
                  // User型からユーザー情報を取得
                  const user = comment.user || {};

                  // ユーザー情報を取得
                  const displayName = getUserDisplayName(user);

                  console.log("コメント表示データ:", {
                    commentId: comment.id,
                    userId: user.id,
                    userName: displayName,
                    avatarUrl: getUserAvatarUrl(user),
                    rawUser: user,
                  });

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="relative flex gap-3"
                    >
                      <div className="relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 -translate-y-6 bg-border" />
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getUserAvatarUrl(user)}
                            alt={`${displayName}のアバター`}
                          />
                          <AvatarFallback>
                            {displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index < comments.length - 1 && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{displayName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: ja,
                            })}
                          </span>
                        </div>
                        <p className="mt-1">{comment.content}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
