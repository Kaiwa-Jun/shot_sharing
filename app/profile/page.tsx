"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  MapPin,
  Calendar,
  Instagram,
  Twitter,
  Link as LinkIcon,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { ProfileEditDialog } from "@/components/profile-edit-dialog";
import { SocialLinkDialog } from "@/components/social-link-dialog";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/app/auth/session-provider";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/supabase/types";
import { toast } from "sonner";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

const TABS = [
  { id: "posts", label: "投稿" },
  { id: "replies", label: "返信" },
  { id: "media", label: "メディア" },
  { id: "likes", label: "いいね" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [socialDialog, setSocialDialog] = useState<{
    open: boolean;
    type: "instagram" | "twitter" | null;
  }>({
    open: false,
    type: null,
  });
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingLikedPosts, setIsLoadingLikedPosts] = useState(false);
  const [followStats, setFollowStats] = useState({
    followingCount: 0,
    followerCount: 0,
  });
  const [isLoadingFollowStats, setIsLoadingFollowStats] = useState(false);

  // セッションからユーザー情報を取得
  const { authUser, dbUser, isLoading, updateUserProfile } = useSession();
  const router = useRouter();

  // 未ログイン時はログインページにリダイレクト
  useEffect(() => {
    if (!isLoading && !authUser) {
      router.push("/");
    }
  }, [isLoading, authUser, router]);

  // ユーザーの投稿を取得
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!authUser) return;

      // デバッグ: 認証情報の詳細をログ出力
      console.log("[DEBUG] 認証ユーザー情報:", {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata,
      });

      try {
        setIsLoadingPosts(true);
        console.log("[DEBUG] ユーザー投稿取得開始");

        // 既存のAPIが機能していないため、直接すべての投稿を取得して
        // ユーザーのメールアドレスでフィルタリングする
        const response = await fetch(`/api/posts?limit=100`);
        console.log("[DEBUG] API応答ステータス:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "[DEBUG] 投稿取得APIエラー:",
            response.status,
            errorData
          );
          throw new Error("投稿の取得に失敗しました");
        }

        const data = await response.json();
        console.log("[DEBUG] 全投稿取得結果:", {
          totalPosts: data.data?.length || 0,
        });

        // ユーザーのメールアドレスと一致する投稿をフィルタリング
        const userEmail = authUser.email;
        const filteredPosts =
          data.data?.filter((post: any) => post.User?.email === userEmail) ||
          [];

        console.log("[DEBUG] フィルタリング後の投稿数:", filteredPosts.length);
        if (filteredPosts.length > 0) {
          console.log("[DEBUG] 最初の投稿のサンプル:", {
            id: filteredPosts[0].id,
            userId: filteredPosts[0].userId,
            userEmail: filteredPosts[0].User?.email,
          });
        }

        setUserPosts(filteredPosts);
      } catch (error) {
        console.error("[DEBUG] ユーザー投稿取得エラー:", error);
        toast.error("投稿の取得に失敗しました");
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (activeTab === "posts") {
      fetchUserPosts();
    }
  }, [authUser, activeTab]);

  // いいねした投稿を取得
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!authUser) return;

      try {
        setIsLoadingLikedPosts(true);
        console.log("[DEBUG] いいね投稿取得開始: ユーザーID", authUser.id);

        // 専用のいいね投稿取得APIを使用
        const response = await fetch(`/api/posts/liked?userId=${authUser.id}`);

        console.log("[DEBUG] API応答ステータス:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "[DEBUG] いいね投稿取得エラー:",
            response.status,
            errorData
          );
          throw new Error("いいねした投稿の取得に失敗しました");
        }

        const data = await response.json();
        console.log("[DEBUG] いいね投稿取得数:", data.data?.length || 0);

        // APIからの応答を直接使用
        setLikedPosts(data.data || []);
      } catch (error) {
        console.error("[DEBUG] いいね投稿取得エラー:", error);
        toast.error("いいねした投稿の取得に失敗しました");
      } finally {
        setIsLoadingLikedPosts(false);
      }
    };

    if (activeTab === "likes") {
      fetchLikedPosts();
    }
  }, [authUser, activeTab]);

  // フォロー数・フォロワー数を取得
  useEffect(() => {
    const fetchFollowStats = async () => {
      if (!authUser) return;

      // デバッグ: 詳細なユーザー情報ログ
      console.log("[DEBUG] フォロー統計取得時のユーザー情報:", {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata,
      });

      try {
        setIsLoadingFollowStats(true);
        console.log("[DEBUG] フォロー統計取得開始: ユーザーID", authUser.id);

        // リクエストURLを変数に格納して詳細ログ出力
        const requestUrl = `/api/follows/count?userId=${authUser.id}`;
        console.log("[DEBUG] フォロー統計API リクエストURL:", requestUrl);

        const response = await fetch(requestUrl);
        console.log("[DEBUG] フォロー統計API応答ステータス:", response.status);

        // レスポンスのクローンを作成して生データを確認
        const responseClone = response.clone();
        const rawResponseText = await responseClone.text();
        console.log("[DEBUG] フォロー統計API生レスポンス:", rawResponseText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "[DEBUG] フォロー統計取得エラー:",
            response.status,
            errorData
          );
          throw new Error("フォロー情報の取得に失敗しました");
        }

        // JSON解析を別で行い、エラーが発生したらキャッチ
        let data;
        try {
          data = JSON.parse(rawResponseText);
          console.log("[DEBUG] フォロー統計 パース後データ:", data);
        } catch (parseError) {
          console.error("[DEBUG] JSONパースエラー:", parseError);
          throw new Error("フォロー情報のパースに失敗しました");
        }

        console.log("[DEBUG] フォロー統計 設定前の状態:", followStats);
        setFollowStats(data);
        console.log("[DEBUG] フォロー統計 設定後の値:", data);
      } catch (error) {
        console.error("[DEBUG] フォロー統計取得エラー:", error);
        toast.error("フォロー情報の取得に失敗しました");
      } finally {
        setIsLoadingFollowStats(false);
      }
    };

    if (authUser) {
      console.log("[DEBUG] フォロー統計取得関数を呼び出します");
      fetchFollowStats();
    } else {
      console.log("[DEBUG] authUserが未定義のためフォロー統計を取得しません");
    }
  }, [authUser]);

  const handleProfileSave = async (updatedProfile: any) => {
    if (!dbUser) return;

    try {
      // Prismaデータベースとユーザープロフィールを更新
      await updateUserProfile({
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        // SNSリンクはSocialLinkDialogで個別に処理
      });
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
    }
  };

  const handleSocialSave = async (username: string) => {
    if (!dbUser || !socialDialog.type) return;

    try {
      const updateData =
        socialDialog.type === "instagram"
          ? { instagramUrl: username }
          : { twitterUrl: username };

      await updateUserProfile(updateData);
    } catch (error) {
      console.error(`${socialDialog.type}更新エラー:`, error);
    }
  };

  // ローディング中または未ログイン時
  if (isLoading || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Cover Image */}
      <motion.div
        className="relative h-48 bg-gradient-to-r from-blue-400 to-blue-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute bottom-4 left-4">
          <Camera className="h-6 w-6 text-white/80" />
        </div>
      </motion.div>

      {/* Profile Header */}
      <div className="relative px-4">
        <motion.div
          className="absolute -top-16 left-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.2,
          }}
        >
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-background bg-muted">
              <img
                src={
                  dbUser?.avatarUrl ||
                  authUser.user_metadata?.avatar_url ||
                  "https://via.placeholder.com/128"
                }
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90">
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <motion.div
          className="pt-20 pb-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <div className="flex justify-between items-center mb-4">
            <ProfileEditDialog
              profile={{
                name:
                  dbUser?.name ||
                  authUser.user_metadata?.name ||
                  authUser.email?.split("@")[0] ||
                  "",
                username: authUser.email?.split("@")[0] || "",
                bio: dbUser?.bio || authUser.user_metadata?.bio || "",
                location: "",
                twitter:
                  dbUser?.twitterUrl ||
                  authUser.user_metadata?.twitter_url ||
                  "",
                instagram:
                  dbUser?.instagramUrl ||
                  authUser.user_metadata?.instagram_url ||
                  "",
                url: "",
              }}
              onSave={handleProfileSave}
            />
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <motion.div variants={item}>
            <h1 className="text-xl font-bold">
              {dbUser?.name ||
                authUser.user_metadata?.name ||
                authUser.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground">
              @{authUser.email?.split("@")[0]}
            </p>
          </motion.div>

          <motion.div variants={item} className="mt-4 space-y-4">
            <p>{dbUser?.bio || authUser.user_metadata?.bio || ""}</p>

            <div className="space-y-2 text-muted-foreground">
              {/* 位置情報は省略可能 */}

              <motion.div className="flex items-center gap-4" variants={item}>
                <button
                  onClick={() =>
                    setSocialDialog({ open: true, type: "twitter" })
                  }
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setSocialDialog({ open: true, type: "instagram" })
                  }
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </button>
              </motion.div>
            </div>

            {/* フォロー数などはAPIから取得するように将来的に修正 */}
            {/* コメントアウト: フォロー・フォロワー表示
            <motion.div className="flex gap-4" variants={item}>
              <Link href={`/follows?userId=${authUser.id}&tab=following`} className="hover:underline">
                <span className="font-semibold">
                  {isLoadingFollowStats ? (
                    <Loader2 className="h-3 w-3 inline animate-spin" />
                  ) : (
                    followStats.followingCount
                  )}
                </span>
                <span className="text-muted-foreground ml-1">フォロー中</span>
              </Link>
              <Link href={`/follows?userId=${authUser.id}&tab=followers`} className="hover:underline">
                <span className="font-semibold">
                  {isLoadingFollowStats ? (
                    <Loader2 className="h-3 w-3 inline animate-spin" />
                  ) : (
                    followStats.followerCount
                  )}
                </span>
                <span className="text-muted-foreground ml-1">フォロワー</span>
              </Link>
            </motion.div>
            */}
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex relative">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-4 text-sm font-medium hover:bg-muted/50",
                  activeTab === tab.id && "text-primary"
                )}
              >
                {tab.label}
              </button>
            ))}
            <motion.div
              className="absolute bottom-0 h-1 bg-primary"
              initial={false}
              animate={{
                left: `${
                  (TABS.findIndex((tab) => tab.id === activeTab) * 100) /
                  TABS.length
                }%`,
                width: `${100 / TABS.length}%`,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="mt-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* 投稿タブ */}
            {activeTab === "posts" && isLoadingPosts ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activeTab === "posts" && userPosts.length > 0 ? (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : activeTab === "posts" ? (
              <div className="py-8 text-center text-muted-foreground">
                まだ投稿はありません
              </div>
            ) : null}

            {/* いいねタブ */}
            {activeTab === "likes" && isLoadingLikedPosts ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activeTab === "likes" && likedPosts.length > 0 ? (
              likedPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : activeTab === "likes" ? (
              <div className="py-8 text-center text-muted-foreground">
                まだいいねした投稿はありません
              </div>
            ) : null}

            {(activeTab === "replies" || activeTab === "media") && (
              <div className="py-8 text-center text-muted-foreground">
                まだ{TABS.find((t) => t.id === activeTab)?.label}はありません
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SocialLinkDialog
        open={socialDialog.open}
        onOpenChange={(open) =>
          setSocialDialog({ open, type: socialDialog.type })
        }
        type={socialDialog.type || "instagram"}
        username={
          socialDialog.type === "instagram"
            ? dbUser?.instagramUrl ||
              authUser.user_metadata?.instagram_url ||
              ""
            : dbUser?.twitterUrl || authUser.user_metadata?.twitter_url || ""
        }
        onSave={handleSocialSave}
      />
    </div>
  );
}
