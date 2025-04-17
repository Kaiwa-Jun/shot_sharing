"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type User } from "@/lib/mock-data";

const TABS = [
  { id: "followers", label: "フォロワー" },
  { id: "following", label: "フォロー中" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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

interface ConnectionsListProps {
  user: User;
  followers: User[];
  following: User[];
}

export default function ConnectionsList({ user, followers, following }: ConnectionsListProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "following" || tab === "followers") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const connections = activeTab === "followers" ? followers : following;

  return (
    <div>
      {/* Tabs */}
      <div className="border-b mb-4">
        <div className="flex relative">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "followers" | "following")}
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
              left: activeTab === "followers" ? "0%" : "50%",
              width: "50%"
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
          variants={container}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4"
        >
          {connections.map((connection) => (
            <motion.div
              key={connection.username}
              variants={item}
              className="flex items-center justify-between p-4 hover:bg-accent/50 rounded-lg transition-colors"
            >
              <Link
                href={`/profile/${connection.username}`}
                className="flex items-center gap-3 flex-1"
              >
                <Avatar>
                  <AvatarImage src={connection.avatar} />
                  <AvatarFallback>{connection.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{connection.name}</div>
                  <div className="text-sm text-muted-foreground">@{connection.username}</div>
                </div>
              </Link>
              <Button variant="outline">フォロー中</Button>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}