"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePostDialog } from "./create-post-dialog";
import { usePathname } from "next/navigation";
import { usePostsContext } from "@/lib/contexts/posts-context";

export function CreatePostButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isPostDetail = pathname.startsWith("/posts/");
  const isSettings = pathname.startsWith("/settings");
  const { addNewPost } = usePostsContext();

  const handlePostSuccess = (post: any) => {
    // デバッグログを追加
    console.log("投稿成功ハンドラーが呼ばれました", post);
    if (!post) {
      console.error("投稿データがありません");
      return;
    }

    // 新しい投稿をコンテキストに追加
    addNewPost(post);
  };

  if (isPostDetail || isSettings) {
    return null;
  }

  return (
    <>
      <motion.div
        className="fixed bottom-20 right-4 lg:hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
      <CreatePostDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handlePostSuccess}
      />
    </>
  );
}
