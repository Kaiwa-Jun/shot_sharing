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

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function ReplyDialog({ open, onOpenChange, postId }: ReplyDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);

    try {
      // ここにコメント送信のAPIリクエストを実装
      // const response = await fetch(`/api/posts/${postId}/comments`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ content: comment }),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to post comment");
      // }

      // 送信成功時の処理
      setComment("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error posting comment:", error);
      // エラー処理
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
          >
            {isSubmitting ? "送信中..." : "コメントを投稿"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
