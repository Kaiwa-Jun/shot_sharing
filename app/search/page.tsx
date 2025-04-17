"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/post-card";
import { motion } from "framer-motion";

const TRENDING_POSTS = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
    user: {
      name: "鈴木 大輔",
      username: "daisuke_s",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    },
    description: "富士山の朝焼け",
    shutterSpeed: "1/250",
    iso: 200,
    aperture: 8,
    location: "山中湖",
    shootingDate: "2024/3/18",
    likes: 156,
    comments: 8,
    createdAt: "2024-03-18T05:30:00Z",
  },
];

const CATEGORIES = [
  { id: "1", name: "風景", count: 1234 },
  { id: "2", name: "ポートレート", count: 856 },
  { id: "3", name: "スナップ", count: 567 },
  { id: "4", name: "建築", count: 432 },
  { id: "5", name: "自然", count: 789 },
  { id: "6", name: "モノクローム", count: 345 },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export default function SearchPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="キーワードで検索..."
            className="pl-10"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2 
            className="text-xl font-semibold mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            カテゴリー
          </motion.h2>
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {CATEGORIES.map((category) => (
              <motion.div
                key={category.id}
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
                  <CardContent className="p-4">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {category.count.toLocaleString()}件
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.h2 
            className="text-xl font-semibold mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            トレンド
          </motion.h2>
          {TRENDING_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}