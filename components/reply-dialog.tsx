"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/app/auth/session-provider";
import eventEmitter, { EVENTS } from "@/lib/utils/event-emitter";

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, commentAdded?: boolean) => void;
  postId: string;
}

export function ReplyDialog({ open, onOpenChange, postId }: ReplyDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authUser } = useSession();

  const handleSubmit = async (e: React.MouseEvent) => {
    // クリックイベントの伝播を停止
    e.preventDefault();
    e.stopPropagation();

    if (!comment.trim()) return;

    // 認証チェック
    if (!authUser) {
      toast.error("コメントを投稿するにはログインが必要です");
      return;
    }

    setIsSubmitting(true);

    try {
      // ユーザーIDを取得
      const userId = authUser.id;
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      console.log("コメント投稿開始 (ReplyDialog):", {
        認証済み: !!authUser,
        ユーザーID: userId,
        メール: authUser.email,
      });

      // URLにユーザーIDをクエリパラメータとして追加
      const url = `/api/comments?userId=${encodeURIComponent(userId)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: comment,
          userId: userId, // ボディにもユーザーIDを含める
        }),
        credentials: "include", // 重要: 認証クッキーを含める
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

      // 送信成功時の処理
      const data = await response.json();
      console.log("投稿したコメントデータ:", data);

      setComment("");
      toast.success("コメントを投稿しました");

      // グローバルイベントを発行
      console.log("[ReplyDialog] コメント追加イベント発行:", { postId });
      eventEmitter.emit(EVENTS.COMMENT_ADDED, postId);

      // コメント追加成功フラグをtrueにしてダイアログを閉じる
      onOpenChange(false, true);
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの投稿に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    // クリックイベントの伝播を停止
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    // ダイアログ内部のクリックイベント伝播を停止
    e.stopPropagation();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => onOpenChange(newOpen, false)}
    >
      <DialogContent className="sm:max-w-lg" onClick={handleDialogClick}>
        <DialogHeader>
          <DialogTitle>コメントを追加</DialogTitle>
          <DialogDescription>投稿にコメントを追加します。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="コメントを入力してください..."
            className="min-h-[100px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                送信中...
              </>
            ) : (
              "コメントを投稿"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
