"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/app/auth/session-provider";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ユーザーの型定義
type User = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

// フォロー状態の型定義
type FollowState = {
  isFollowing: boolean;
  isFollower: boolean;
};

export default function FollowsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "followers";
  const userId = searchParams.get("userId");

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authUser } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [followStates, setFollowStates] = useState<Record<string, FollowState>>(
    {}
  );
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        // APIエンドポイントを決定
        const endpoint =
          tab === "following"
            ? `/api/users/${userId}/following`
            : `/api/users/${userId}/followers`;

        console.log(`[DEBUG] ユーザー一覧取得開始: ${endpoint}`);
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("ユーザー情報の取得に失敗しました");
        }

        const data = await response.json();
        console.log(`[DEBUG] 取得したユーザー数: ${data.length}`);
        setUsers(data);
      } catch (error) {
        console.error("ユーザー取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userId, tab]);

  useEffect(() => {
    const fetchFollowStates = async () => {
      if (!authUser || !users.length) return;

      const loadingStates: Record<string, boolean> = {};
      // 全ユーザーのローディング状態を初期化
      users.forEach((user) => {
        if (user.id !== authUser.id) {
          loadingStates[user.id] = true;
        }
      });
      setLoadingStates(loadingStates);

      try {
        // 対象ユーザーIDをクエリパラメータとして構築
        const userIdParams = users
          .filter((user) => user.id !== authUser.id)
          .map((user) => `userId=${encodeURIComponent(user.id)}`)
          .join("&");

        console.log(`[DEBUG] 相互フォロー状態確認: ${userIdParams}`);
        const response = await fetch(`/api/follows/mutual?${userIdParams}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("フォロー状態の取得に失敗しました");
        }

        const data = await response.json();
        console.log(`[DEBUG] 相互フォロー状態確認結果:`, data);

        setFollowStates(data);
      } catch (error) {
        console.error("フォロー状態取得エラー:", error);
        // エラー時はデフォルト値を設定
        const defaultStates: Record<
          string,
          { isFollowing: boolean; isFollower: boolean }
        > = {};
        users.forEach((user) => {
          if (user.id !== authUser.id) {
            defaultStates[user.id] = {
              isFollowing: false,
              isFollower: tab === "followers",
            };
          }
        });
        setFollowStates(defaultStates);
      } finally {
        // 全ユーザーのローディング状態をfalseに
        const completedLoadingStates: Record<string, boolean> = {};
        users.forEach((user) => {
          if (user.id !== authUser.id) {
            completedLoadingStates[user.id] = false;
          }
        });
        setLoadingStates(completedLoadingStates);
      }
    };

    if (authUser && users.length) {
      fetchFollowStates();
    }
  }, [authUser, users, tab]);

  const handleFollow = async (userId: string) => {
    if (!authUser) return;

    setLoadingStates((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId: userId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("フォロー処理に失敗しました");
      }

      // 成功したらフォロー状態を更新
      setFollowStates((prev) => ({
        ...prev,
        [userId]: {
          isFollowing: true,
          isFollower: prev[userId]?.isFollower || false,
        },
      }));
    } catch (error) {
      console.error("Failed to follow user:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-center text-muted-foreground">
          ユーザーIDが指定されていません
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-background border-b flex items-center p-4">
        <Link
          href="/profile"
          className="rounded-full p-2 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold">
            {authUser?.user_metadata?.name ||
              authUser?.email?.split("@")[0] ||
              "ユーザー"}
          </h1>
        </div>
        {/* 右側のスペースを確保するための空のdiv */}
        <div className="w-8"></div>
      </div>

      {/* タブ */}
      <div className="border-b">
        <div className="flex relative">
          <Link
            href={`/follows?userId=${userId}&tab=followers`}
            className={cn(
              "flex-1 py-4 text-sm font-medium text-center hover:bg-muted/50",
              tab === "followers" && "text-primary"
            )}
          >
            フォロワー
          </Link>
          <Link
            href={`/follows?userId=${userId}&tab=following`}
            className={cn(
              "flex-1 py-4 text-sm font-medium text-center hover:bg-muted/50",
              tab === "following" && "text-primary"
            )}
          >
            フォロー中
          </Link>
          <motion.div
            className="absolute bottom-0 h-1 bg-primary"
            initial={false}
            animate={{
              left: tab === "followers" ? "0%" : "50%",
              width: "50%",
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        </div>
      </div>

      {/* ユーザーリスト */}
      <div className="mt-2">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {tab === "followers"
              ? "フォロワーはいません"
              : "フォロー中のユーザーはいません"}
          </div>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id} className="border-b last:border-b-0">
                <div className="flex items-center justify-between p-4">
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center"
                  >
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage
                        src={user.avatarUrl || undefined}
                        alt={user.name || "ユーザー"}
                      />
                      <AvatarFallback>
                        {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.name || user.email?.split("@")[0]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{user.email?.split("@")[0]}
                      </p>
                    </div>
                  </Link>
                  {authUser && authUser.id !== user.id && (
                    <button
                      className="border px-3 py-1 rounded-md text-sm font-medium"
                      onClick={() => handleFollow(user.id)}
                      disabled={loadingStates[user.id]}
                    >
                      {loadingStates[user.id]
                        ? "処理中..."
                        : followStates[user.id]?.isFollowing
                        ? followStates[user.id]?.isFollower
                          ? "相互フォロー中"
                          : "フォロー中"
                        : followStates[user.id]?.isFollower
                        ? "フォローバック"
                        : "フォローする"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
