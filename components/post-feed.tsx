"use client";

import { useState, useEffect } from "react";
import { PostCard } from "@/components/post-card";
import InfiniteScroll from "react-infinite-scroll-component";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "@/lib/supabase/types";
import { usePostsContext } from "@/lib/contexts/posts-context";

const POSTS_PER_PAGE = 10;

export function PostFeed() {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const { shouldRefresh, setShouldRefresh, newPosts, clearNewPosts } =
    usePostsContext();

  // 投稿を取得する関数
  const fetchPosts = async (newCursor?: string | null) => {
    if (loading) return;

    setLoading(true);
    try {
      // URLパラメータの構築
      const params = new URLSearchParams();
      params.append("limit", POSTS_PER_PAGE.toString());
      if (newCursor) {
        params.append("cursor", newCursor);
      }

      // APIからデータを取得
      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();

      if (newCursor) {
        // 追加の投稿を読み込む場合
        setPosts((prev) => [...prev, ...data.data]);
      } else {
        // 初回の読み込み
        setPosts(data.data);
      }

      setCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchPosts();
  }, []);

  // 新規投稿や更新があったら再取得
  useEffect(() => {
    if (shouldRefresh) {
      console.log("投稿リストを更新します");
      // 完全に最新データを取得するため、カーソルをリセット
      setCursor(null);
      fetchPosts();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, setShouldRefresh]);

  // 新しい投稿をリストに追加
  useEffect(() => {
    if (newPosts && newPosts.length > 0) {
      console.log("新しい投稿をリストに追加します:", newPosts);
      // 既存の投稿と重複がないようにマージ
      const uniquePosts = [...newPosts, ...posts].filter(
        (post, index, self) => index === self.findIndex((p) => p.id === post.id)
      );
      console.log("更新後の投稿リスト:", uniquePosts);
      setPosts(uniquePosts);

      // 投稿が反映されたらnewPostsをクリア
      clearNewPosts();
    }
  }, [newPosts, posts, clearNewPosts]);

  const loadMorePosts = () => {
    fetchPosts(cursor);
  };

  if (!mounted) {
    return (
      <div className="space-y-8">
        {Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={posts.length}
      next={loadMorePosts}
      hasMore={hasMore}
      loader={
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
      endMessage={
        <p className="text-center text-muted-foreground py-4">
          すべての投稿を読み込みました
        </p>
      }
    >
      <AnimatePresence>
        <div className="space-y-8">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </InfiniteScroll>
  );
}
