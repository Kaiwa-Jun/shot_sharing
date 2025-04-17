"use client";

import { useState, useEffect } from "react";
import { PostCard } from "@/components/post-card";
import InfiniteScroll from "react-infinite-scroll-component";
import { motion, AnimatePresence } from "framer-motion";
import { generateMockPosts, MOCK_USERS } from "@/lib/mock-data";

const POSTS_PER_PAGE = 5;

export function PostFeed() {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<ReturnType<typeof generateMockPosts>>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setMounted(true);
    const initialPosts = Array.from({ length: POSTS_PER_PAGE }, (_, i) => {
      // Rotate through all users evenly
      const userIndex = i % MOCK_USERS.length;
      return generateMockPosts(1, userIndex)[0];
    });
    setPosts(initialPosts);
  }, []);

  const loadMorePosts = () => {
    const nextPage = page + 1;
    const newPosts = Array.from({ length: POSTS_PER_PAGE }, (_, i) => {
      // Calculate the absolute index to ensure we continue rotating through all users
      const absoluteIndex = (nextPage * POSTS_PER_PAGE + i);
      const userIndex = absoluteIndex % MOCK_USERS.length;
      return generateMockPosts(1, userIndex)[0];
    });

    setTimeout(() => {
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setPage(nextPage);
      setHasMore(nextPage < 3); // Limit to 4 pages total
    }, 1000);
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