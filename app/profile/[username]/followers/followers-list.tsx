"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

interface FollowersListProps {
  followers: Array<{
    username: string;
    name: string;
    avatar: string;
  }>;
}

export default function FollowersList({ followers }: FollowersListProps) {
  return (
    <motion.div
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {followers.map((follower) => (
        <motion.div
          key={follower.username}
          variants={item}
          className="flex items-center justify-between p-4 hover:bg-accent/50 rounded-lg transition-colors"
        >
          <Link
            href={`/profile/${follower.username}`}
            className="flex items-center gap-3 flex-1"
          >
            <Avatar>
              <AvatarImage src={follower.avatar} />
              <AvatarFallback>{follower.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{follower.name}</div>
              <div className="text-sm text-muted-foreground">@{follower.username}</div>
            </div>
          </Link>
          <Button variant="outline">フォロー中</Button>
        </motion.div>
      ))}
    </motion.div>
  );
}