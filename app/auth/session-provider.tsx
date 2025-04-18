"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

// ユーザーの型定義
// Prismaのimportは避けてここで型を再定義
type User = {
  id: string;
  email: string;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  bio?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

// セッションコンテキストの型定義
type SessionContextType = {
  authUser: any | null;
  dbUser: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (data: {
    instagramUrl?: string;
    twitterUrl?: string;
    bio?: string;
    name?: string;
    avatarUrl?: string;
  }) => Promise<User | null>;
};

// デフォルト値でコンテキストを作成
const SessionContext = createContext<SessionContextType>({
  authUser: null,
  dbUser: null,
  isLoading: true,
  signOut: async () => {},
  updateUserProfile: async () => null,
});

// カスタムフックでSessionContextを使用する
export const useSession = () => useContext(SessionContext);

// セッションプロバイダーコンポーネント
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authUser, setAuthUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // APIを使用してユーザーデータを取得する関数
  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const userData = await response.json();
        setDbUser(userData);
      } else {
        console.error("ユーザーデータ取得エラー:", response.statusText);
      }
    } catch (error) {
      console.error("ユーザーデータ取得エラー:", error);
    }
  };

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setAuthUser(data.user);

        // 認証ユーザーがいる場合はAPIを使ってユーザーデータを取得
        if (data.user) {
          await fetchUserData();
        }
      } catch (error) {
        console.error("セッション取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth event:", event);
        const user = session?.user || null;
        setAuthUser(user);

        if (user) {
          // ユーザーデータ取得
          await fetchUserData();
        } else {
          setDbUser(null);
        }

        if (event === "SIGNED_IN") {
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          router.refresh();
        }
      }
    );

    // クリーンアップ関数
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // サインアウト関数
  const signOut = async () => {
    await supabase.auth.signOut();
    setDbUser(null);
  };

  // ユーザープロフィール更新関数
  const updateUserProfile = async (data: {
    instagramUrl?: string;
    twitterUrl?: string;
    bio?: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<User | null> => {
    if (!authUser) {
      return null;
    }

    try {
      // APIを使用してユーザーデータを更新
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setDbUser(updatedUser);
        return updatedUser;
      } else {
        console.error("プロフィール更新エラー:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      return null;
    }
  };

  // コンテキスト値の提供
  return (
    <SessionContext.Provider
      value={{
        authUser,
        dbUser,
        isLoading,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
