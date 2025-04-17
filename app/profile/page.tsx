"use client";

import { useState } from "react";
import { Camera, MapPin, Calendar, Instagram, Twitter, Link as LinkIcon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { generateMockPosts } from "@/lib/mock-data";
import { ProfileEditDialog } from "@/components/profile-edit-dialog";
import { SocialLinkDialog } from "@/components/social-link-dialog";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "posts", label: "投稿" },
  { id: "replies", label: "返信" },
  { id: "media", label: "メディア" },
  { id: "likes", label: "いいね" },
];

const LIKED_POSTS = generateMockPosts(3, 10).map(post => ({
  ...post,
  isLiked: true
}));

const DEFAULT_PROFILE = {
  name: "じゅん@Webエンジニア",
  username: "crew_runteq38",
  bio: "仙台でwebエンジニアしてます—",
  location: "仙台, 日本",
  twitter: "",
  instagram: "",
  url: "",
};

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

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [socialDialog, setSocialDialog] = useState<{
    open: boolean;
    type: "instagram" | "twitter" | null;
  }>({
    open: false,
    type: null,
  });
  
  const posts = generateMockPosts(3, 0);

  const handleProfileSave = (updatedProfile: typeof DEFAULT_PROFILE) => {
    setProfile(updatedProfile);
  };

  const handleSocialSave = (username: string) => {
    if (socialDialog.type) {
      setProfile(prev => ({
        ...prev,
        [socialDialog.type]: username
      }));
    }
  };

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
            delay: 0.2
          }}
        >
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-background bg-muted">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces"
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
            <ProfileEditDialog profile={profile} onSave={handleProfileSave} />
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <motion.div variants={item}>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </motion.div>

          <motion.div variants={item} className="mt-4 space-y-4">
            <p>{profile.bio}</p>
            
            <div className="space-y-2 text-muted-foreground">
              <motion.div 
                className="flex items-center gap-2"
                variants={item}
              >
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </motion.div>
              
              {profile.url && (
                <motion.div 
                  className="flex items-center gap-2"
                  variants={item}
                >
                  <LinkIcon className="h-4 w-4" />
                  <a href={profile.url} className="text-primary hover:underline">
                    {profile.url}
                  </a>
                </motion.div>
              )}

              <motion.div 
                className="flex items-center gap-4"
                variants={item}
              >
                <button
                  onClick={() => setSocialDialog({ open: true, type: "twitter" })}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSocialDialog({ open: true, type: "instagram" })}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </button>
              </motion.div>
            </div>

            <motion.div 
              className="flex gap-4"
              variants={item}
            >
              <Link
                href={`/profile/${profile.username}/connections?tab=following`}
                className="hover:underline"
              >
                <span className="font-semibold">1,218</span>
                <span className="text-muted-foreground ml-1">フォロー中</span>
              </Link>
              <Link
                href={`/profile/${profile.username}/connections?tab=followers`}
                className="hover:underline"
              >
                <span className="font-semibold">1,099</span>
                <span className="text-muted-foreground ml-1">フォロワー</span>
              </Link>
            </motion.div>
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
                left: `${(TABS.findIndex(tab => tab.id === activeTab) * 100) / TABS.length}%`,
                width: `${100 / TABS.length}%`
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30
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
              damping: 30
            }}
          >
            {activeTab === "posts" && posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {activeTab === "likes" && LIKED_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {(activeTab === "replies" || activeTab === "media") && (
              <div className="py-8 text-center text-muted-foreground">
                まだ{TABS.find(t => t.id === activeTab)?.label}はありません
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SocialLinkDialog
        open={socialDialog.open}
        onOpenChange={(open) => setSocialDialog({ open, type: null })}
        type={socialDialog.type || "instagram"}
        username={socialDialog.type ? profile[socialDialog.type] : ""}
        onSave={handleSocialSave}
      />
    </div>
  );
}