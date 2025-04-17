"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

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

// Separate component for the reply form to prevent unnecessary re-renders
const ReplyForm = ({
  onSubmit,
  isMobile,
  hasReplies,
}: {
  onSubmit: (text: string) => void;
  isMobile: boolean;
  hasReplies: boolean;
}) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };

  if (isMobile) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces" />
            <AvatarFallback>JD</AvatarFallback>
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
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
            >
              <Image className="h-5 w-5" />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8"
              disabled={!text.trim()}
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
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces" />
            <AvatarFallback>JD</AvatarFallback>
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
              disabled={!text.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              返信
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export function ReplySection({ postId, isMobile = false, onReplyCountChange }: ReplySectionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);

  const handleSubmit = (text: string) => {
    const newReply: Reply = {
      id: Date.now().toString(),
      text,
      createdAt: new Date(),
      user: {
        name: "じゅん@Webエンジニア",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
      },
    };

    const newReplies = [...replies, newReply];
    setReplies(newReplies);
    onReplyCountChange?.(newReplies.length);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {isMobile ? (
          <div className="p-3">
            <ReplyForm onSubmit={handleSubmit} isMobile={true} hasReplies={replies.length > 0} />
            {replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {replies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    className="relative flex gap-2"
                  >
                    <div className="relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 -translate-y-6 bg-border" />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.user.avatar} />
                        <AvatarFallback>{reply.user.name[0]}</AvatarFallback>
                      </Avatar>
                      {index < replies.length - 1 && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{reply.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(reply.createdAt, { 
                            addSuffix: true,
                            locale: ja 
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{reply.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-background p-4 rounded-lg">
              <ReplyForm onSubmit={handleSubmit} isMobile={false} hasReplies={replies.length > 0} />
            </div>

            {replies.length > 0 && (
              <div className="bg-background p-4 rounded-lg space-y-6">
                {replies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    className="relative flex gap-3"
                  >
                    <div className="relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 -translate-y-6 bg-border" />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={reply.user.avatar} />
                        <AvatarFallback>{reply.user.name[0]}</AvatarFallback>
                      </Avatar>
                      {index < replies.length - 1 && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 translate-y-6 bg-border" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reply.user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(reply.createdAt, { 
                            addSuffix: true,
                            locale: ja 
                          })}
                        </span>
                      </div>
                      <p className="mt-1">{reply.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}