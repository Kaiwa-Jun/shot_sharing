"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

// 型定義
interface Category {
  id: string;
  name: string;
  count: number;
}

interface Post {
  id: string;
  imageUrl: string;
  description: string | null;
  createdAt: string;
  User: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  userLiked: boolean;
  categoryIds: string[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const postsContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const postItem = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

export default function SearchPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  // カテゴリーとその投稿数を取得
  useEffect(() => {
    const fetchCategoriesWithCounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/categories/counts");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "カテゴリーの取得に失敗しました");
        }

        const data = await response.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error("カテゴリー取得エラー:", err);
        setError(
          err instanceof Error ? err.message : "カテゴリーの取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoriesWithCounts();
  }, []);

  // 選択されたカテゴリの投稿を取得
  const fetchPostsByCategory = async (categoryId: string) => {
    try {
      setLoadingPosts(true);
      setPostsError(null);

      const response = await fetch(
        `/api/posts?categoryId=${categoryId}&limit=20`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "投稿の取得に失敗しました");
      }

      const data = await response.json();
      setPosts(data.data || []);
    } catch (err) {
      console.error("投稿取得エラー:", err);
      setPostsError(
        err instanceof Error ? err.message : "投稿の取得に失敗しました"
      );
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // カテゴリーがクリックされたときの処理
  const handleCategoryClick = (categoryId: string) => {
    console.log(`カテゴリーがクリックされました: ${categoryId}`);
    setSelectedCategory(categoryId);
    fetchPostsByCategory(categoryId);
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="container mx-auto py-24">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">
            カテゴリー情報を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="container mx-auto py-16">
        <div className="max-w-lg mx-auto p-6 bg-destructive/10 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            エラーが発生しました
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            className="text-2xl font-semibold mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            カテゴリーから探す
          </motion.h2>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <Card
                  className={`hover:bg-accent/50 cursor-pointer transition-colors h-full ${
                    selectedCategory === category.id
                      ? "bg-primary/10 border-primary"
                      : ""
                  }`}
                >
                  <CardContent className="py-5 px-4 flex flex-col items-center justify-center text-center h-full">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {category.count.toLocaleString()}件
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* 投稿表示エリア */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="mt-12"
          >
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-medium mb-6"
            >
              {categories.find((c) => c.id === selectedCategory)?.name}の投稿
            </motion.h3>

            {loadingPosts && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {postsError && (
              <div className="p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-destructive">{postsError}</p>
              </div>
            )}

            {!loadingPosts && !postsError && posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  投稿が見つかりませんでした
                </p>
              </div>
            )}

            {!loadingPosts && !postsError && posts.length > 0 && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                variants={postsContainer}
                initial="hidden"
                animate="show"
              >
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={postItem}
                    className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={post.imageUrl}
                        alt={post.description || "投稿画像"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      {post.description && (
                        <p className="text-sm line-clamp-2 mb-2">
                          {post.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
