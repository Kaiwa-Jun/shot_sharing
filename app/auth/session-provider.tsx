"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/user-service";
import { User } from "@prisma/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

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

  // Prismaユーザーデータを取得・同期する関数
  const syncUserWithDatabase = async (supabaseUser: any) => {
    if (!supabaseUser) {
      setDbUser(null);
      return;
    }

    try {
      // Supabase認証ユーザーのIDを使ってPrismaのユーザーデータを取得または作成
      const user = await UserService.getOrCreateUser(
        supabaseUser.id,
        supabaseUser.email || "",
        {
          instagramUrl: supabaseUser.user_metadata?.instagram_url,
          twitterUrl: supabaseUser.user_metadata?.twitter_url,
          bio: supabaseUser.user_metadata?.bio,
          name:
            supabaseUser.user_metadata?.name ||
            supabaseUser.user_metadata?.full_name,
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
        }
      );
      setDbUser(user);
    } catch (error) {
      console.error("ユーザー同期エラー:", error);
    }
  };

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setAuthUser(data.user);

        // 認証ユーザーがいる場合はPrismaと同期
        if (data.user) {
          await syncUserWithDatabase(data.user);
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

        // ユーザーデータベース同期
        await syncUserWithDatabase(user);

        if (event === "SIGNED_IN") {
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          router.refresh();
        } else if (event === "USER_UPDATED") {
          // ユーザー情報が更新された場合も同期
          await syncUserWithDatabase(user);
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
    if (!authUser || !dbUser) {
      return null;
    }

    try {
      // Prismaのユーザーデータを更新
      const updatedUser = await UserService.updateUser(dbUser.id, data);
      setDbUser(updatedUser);
      return updatedUser;
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
