"use client";

import { useState, useEffect } from "react";
import { PostCard } from "@/components/post-card";
import InfiniteScroll from "react-infinite-scroll-component";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "@/lib/supabase/types";
import { usePostsContext } from "@/lib/contexts/posts-context";
import useSWRInfinite from "swr/infinite";

const POSTS_PER_PAGE = 10;

// APIレスポンスの型定義
export interface PostsResponse {
  data: Post[];
  cursor: string | null;
  hasMore: boolean;
}

// SWRのフェッチャー関数
const fetcher = async (url: string): Promise<PostsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return response.json();
};

// 事前に取得したデータを受け取るためのProps追加
interface PostFeedProps {
  initialData?: PostsResponse;
}

export function PostFeed({ initialData }: PostFeedProps = {}) {
  const [mounted, setMounted] = useState(false);
  const { shouldRefresh, setShouldRefresh, newPosts, clearNewPosts } =
    usePostsContext();

  // SWRのキー生成関数
  const getKey = (
    pageIndex: number,
    previousPageData: PostsResponse | null
  ) => {
    // 前のページがなかった場合は初回取得
    if (pageIndex === 0) return `/api/posts?limit=${POSTS_PER_PAGE}`;

    // 前のページがない、またはカーソルが存在しない場合は終了
    if (!previousPageData || !previousPageData.cursor) return null;

    // 次のページのURLを返す
    return `/api/posts?limit=${POSTS_PER_PAGE}&cursor=${previousPageData.cursor}`;
  };

  // SWRInfiniteを使用してデータ取得（初期データあり）
  const { data, error, size, setSize, mutate } = useSWRInfinite<PostsResponse>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      fallbackData: initialData ? [initialData] : undefined, // 初期データをセット
    }
  );

  // データを整形
  const isLoading = !data && !error;
  const posts = data ? data.flatMap((page) => page.data) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : true;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 新規投稿や更新があったら再取得
  useEffect(() => {
    if (shouldRefresh) {
      console.log("投稿リストを更新します");
      mutate();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, setShouldRefresh, mutate]);

  // 新しい投稿をリストに追加
  useEffect(() => {
    if (newPosts && newPosts.length > 0) {
      console.log("新しい投稿をリストに追加します:", newPosts);

      // SWRのデータを更新（最初のページのみ）
      mutate(async (pages) => {
        if (!pages || pages.length === 0) return pages;

        // 最初のページのデータと新しい投稿をマージ
        const firstPage = pages[0];
        const mergedData = [...newPosts, ...firstPage.data];

        // 重複排除
        const uniquePosts = mergedData.filter(
          (post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );

        // 最初のページを更新
        const updatedFirstPage = { ...firstPage, data: uniquePosts };
        return [updatedFirstPage, ...pages.slice(1)];
      }, false);

      // 投稿が反映されたらnewPostsをクリア
      clearNewPosts();
    }
  }, [newPosts, clearNewPosts, mutate]);

  const loadMorePosts = () => {
    setSize(size + 1);
  };

  // 初期データがあって、まだマウントされていない場合は、スケルトンではなく初期データを表示
  if (!mounted) {
    if (initialData && initialData.data.length > 0) {
      return (
        <div className="space-y-8">
          {initialData.data.map((post, index) => (
            <div key={post.id} className="opacity-90">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      );
    }

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

  if (error) {
    return (
      <div className="text-center text-red-500 my-8">
        投稿の読み込み中にエラーが発生しました
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
