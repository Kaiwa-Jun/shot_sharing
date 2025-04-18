"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ReplySection } from "@/components/reply-section";
import { ReplyDialog } from "@/components/reply-dialog";
import { Post } from "@/lib/supabase/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(post.userLiked || false);
  const [likeCount, setLikeCount] = useState(post.Like?.length || 0);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  // 投稿の詳細ページに移動
  const handleCardClick = () => {
    router.push(`/posts/${post.id}`);
  };

  // いいねボタンをクリック
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 実際にはAPIを呼び出してデータベースを更新する処理が必要
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    // いいね処理を実装するためのAPI呼び出し
    // try {
    //   await fetch(`/api/posts/${post.id}/like`, {
    //     method: isLiked ? 'DELETE' : 'POST',
    //   });
    // } catch (error) {
    //   console.error('Error liking post:', error);
    //   // 失敗した場合は元に戻す
    //   setIsLiked(!isLiked);
    //   setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    // }
  };

  // コメントボタンをクリック
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReplyDialogOpen(true);
  };

  // シェアボタンをクリック
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
    // 後でトースト通知を追加する
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Avatar>
            <AvatarImage
              src={
                post.User?.id
                  ? `https://avatars.dicebear.com/api/avataaars/${post.User.id}.svg`
                  : undefined
              }
            />
            <AvatarFallback>
              {post.User?.email
                ? post.User.email.substring(0, 2).toUpperCase()
                : "UN"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {post.User?.email || "不明なユーザー"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </div>

      <div>
        <img src={post.imageUrl} alt="Photo" className="w-full h-auto" />
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-4">
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

          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={handleShareClick}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* EXIF情報を下部にまとめて表示 */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm mb-4">
          <div className="grid grid-cols-2 gap-2">
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
