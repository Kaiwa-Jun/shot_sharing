"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";

type PostsContextType = {
  refreshPosts: () => void;
  shouldRefresh: boolean;
  setShouldRefresh: (value: boolean) => void;
  addNewPost: (post: any) => void;
  newPosts: any[];
  clearNewPosts: () => void;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [newPosts, setNewPosts] = useState<any[]>([]);

  // デバッグ用: 状態変化を監視
  useEffect(() => {
    console.log("PostsContext状態更新:", {
      shouldRefresh,
      newPostsCount: newPosts.length,
    });
  }, [shouldRefresh, newPosts]);

  const refreshPosts = useCallback(() => {
    console.log("refreshPosts呼び出し");
    setShouldRefresh(true);
  }, []);

  const addNewPost = useCallback((post: any) => {
    console.log("新しい投稿が追加されました:", post);
    if (!post) return;

    setNewPosts((prev) => {
      // 既に同じIDの投稿があれば追加しない
      if (prev.some((p) => p.id === post.id)) {
        console.log("この投稿は既に追加されています");
        return prev;
      }
      console.log("投稿をリストに追加します");
      return [post, ...prev];
    });

    // すぐに更新を反映させる
    setShouldRefresh(true);
  }, []);

  const clearNewPosts = useCallback(() => {
    setNewPosts([]);
  }, []);

  return (
    <PostsContext.Provider
      value={{
        refreshPosts,
        shouldRefresh,
        setShouldRefresh,
        addNewPost,
        newPosts,
        clearNewPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePostsContext() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error("usePostsContext must be used within a PostsProvider");
  }
  return context;
}
