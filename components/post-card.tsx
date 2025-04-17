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

interface PostCardProps {
  post: {
    id: string;
    imageUrl: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    description: string;
    shutterSpeed: string;
    iso: number;
    aperture: number;
    location: string;
    shootingDate: string;
    likes: number;
    comments: number;
    createdAt: string;
    isLiked?: boolean;
  };
  isDetail?: boolean;
}

export function PostCard({ post, isDetail = false }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [isCommentAnimating, setIsCommentAnimating] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if (
      (e.target as HTMLElement).closest('.user-profile-link') ||
      (e.target as HTMLElement).closest('button')
    ) {
      return;
    }
    
    if (!isDetail) {
      router.push(`/posts/${post.id}`);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.user.username}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDetail) {
      setReplyDialogOpen(true);
    }
  };

  const handleReplyCountChange = (count: number) => {
    if (count !== commentCount) {
      setIsCommentAnimating(true);
      setCommentCount(count);
    }
  };

  useEffect(() => {
    if (isCommentAnimating) {
      const timer = setTimeout(() => {
        setIsCommentAnimating(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCommentAnimating]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(!isDetail && "cursor-pointer")}
      >
        <Card 
          className="overflow-hidden transition-colors duration-200 hover:bg-accent/10"
          onClick={handlePostClick}
        >
          <div className="p-4">
            <div className="flex items-center gap-3">
              <button
                className="user-profile-link"
                onClick={handleProfileClick}
              >
                <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                </Avatar>
              </button>
              <button
                className="user-profile-link text-left"
                onClick={handleProfileClick}
              >
                <div className="font-semibold hover:underline">{post.user.name}</div>
                <div className="text-sm text-muted-foreground hover:underline">@{post.user.username}</div>
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src={post.imageUrl}
              alt={post.description}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          <div className="p-4">
            <div className="mb-4">
              <p className="text-muted-foreground">{post.description}</p>
            </div>

            <div className="flex gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "transition-all duration-200",
                  isLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
                )}
                onClick={handleLikeClick}
              >
                <motion.div
                  initial={false}
                  animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart 
                    className="h-5 w-5 mr-1" 
                    fill={isLiked ? "currentColor" : "none"} 
                  />
                </motion.div>
                {likeCount}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "transition-colors duration-1000",
                  isCommentAnimating ? "text-sky-500" : "hover:text-sky-500"
                )}
                onClick={handleReplyClick}
              >
                <motion.div
                  initial={false}
                  animate={isCommentAnimating ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <MessageCircle className="h-5 w-5 mr-1" />
                </motion.div>
                {commentCount}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">シャッタースピード</div>
                  <div className="font-medium">{post.shutterSpeed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ISO</div>
                  <div className="font-medium">{post.iso}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">絞り</div>
                  <div className="font-medium">f/{post.aperture}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">撮影日時</div>
                  <div className="font-medium">{post.shootingDate}</div>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">撮影場所</div>
                <div className="font-medium">{post.location}</div>
              </div>
            </div>
          </div>
        </Card>

        {isDetail && (
          <>
            <div className="mt-6 hidden lg:block">
              <ReplySection postId={post.id} onReplyCountChange={handleReplyCountChange} />
            </div>
            <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-background border-t">
              <ReplySection postId={post.id} isMobile onReplyCountChange={handleReplyCountChange} />
            </div>
          </>
        )}
      </motion.div>

      <ReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        post={post}
        onReplySubmit={() => handleReplyCountChange(commentCount + 1)}
      />
    </>
  );
}