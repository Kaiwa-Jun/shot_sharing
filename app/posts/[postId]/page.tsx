"use client";

import { useState, useEffect } from "react";
import { PostCard } from "@/components/post-card";
import { notFound } from "next/navigation";
import { Post } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error("投稿の取得に失敗しました");
        }

        const data = await response.json();
        setPost(data.data);
      } catch (err) {
        console.error("投稿取得エラー:", err);
        setError("投稿の取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center text-muted-foreground">
          投稿が見つかりませんでした
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32 lg:pb-8">
      <PostCard post={post} isDetail />
    </div>
  );
}
