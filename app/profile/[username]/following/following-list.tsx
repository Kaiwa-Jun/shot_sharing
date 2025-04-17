'use client';

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { type User } from "@/lib/mock-data";

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

interface FollowingListProps {
  user: User;
  following: User[];
}

export default function FollowingList({ user, following }: FollowingListProps) {
  return (
    <div className="container max-w-2xl mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/profile/${user.username}`}>
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">フォロー中</p>
          </div>
        </div>
      </div>

      <motion.div
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {following.map((followedUser) => (
          <motion.div
            key={followedUser.username}
            variants={item}
            className="flex items-center justify-between p-4 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <Link
              href={`/profile/${followedUser.username}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar>
                <AvatarImage src={followedUser.avatar} />
                <AvatarFallback>{followedUser.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{followedUser.name}</div>
                <div className="text-sm text-muted-foreground">@{followedUser.username}</div>
              </div>
            </Link>
            <Button variant="outline">フォロー中</Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}