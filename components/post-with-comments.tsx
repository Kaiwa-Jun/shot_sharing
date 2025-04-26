"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Post, Comment } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

// 拡張した投稿型
interface ExtendedPost extends Post {
  comments?: Comment[];
  content?: string;
  likeCount?: number;
}

interface PostWithCommentsProps {
  post: ExtendedPost;
}

export function PostWithComments({ post }: PostWithCommentsProps) {
  const router = useRouter();
  const comments = post.comments || [];
  // nullの場合はundefinedに変換する
  const avatarUrl = post.User?.avatarUrl ? post.User.avatarUrl : undefined;

  // 投稿日時を「〜前」の形式でフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja,
      });
    } catch (error) {
      return "";
    }
  };

  // 投稿の詳細ページに移動
  const handleCardClick = () => {
    router.push(`/posts/${post.id}`);
  };

  // シェアボタンをクリック
  const handleShare = () => {
    // シェア機能は実装省略
  };

  return (
    <motion.div initial={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
        )}
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={avatarUrl} alt="User Avatar" />
                <AvatarFallback>
                  {post.User?.email
                    ? post.User.email.substring(0, 2).toUpperCase()
                    : "UN"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {post.User?.email?.split("@")[0] || "不明なユーザー"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.createdAt)}
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
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="h-5 w-5" />
              <span>{post.likeCount || post.Like?.length || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{comments.length}</span>
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

          {/* コメントセクション */}
          {comments.length > 0 && (
            <div className="border-t pt-3">
              <h3 className="text-sm font-medium mb-2">コメント</h3>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {comment.User?.email
                          ? comment.User.email.substring(0, 2).toUpperCase()
                          : "UN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xs font-medium">
                          {comment.User?.email?.split("@")[0] ||
                            "不明なユーザー"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
