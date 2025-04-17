"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send } from "lucide-react";
import { useState } from "react";

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
  };
  onReplySubmit?: () => void;
}

export function ReplyDialog({ open, onOpenChange, post, onReplySubmit }: ReplyDialogProps) {
  const [replyText, setReplyText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    onReplySubmit?.();
    setReplyText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">返信を投稿</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{post.user.name}</div>
              <div className="text-sm text-muted-foreground">@{post.user.username}</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="返信を入力..."
                  className="w-full min-h-[80px] p-3 pr-12 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <div className="absolute bottom-3 right-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Image className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  className="rounded-full"
                  disabled={!replyText.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  返信
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}