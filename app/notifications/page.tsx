"use client";

import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "like",
    user: "Sarah Parker",
    time: "2 hours ago",
    message: "liked your photo",
    icon: Heart,
  },
  {
    id: "2",
    type: "comment",
    user: "Mike Johnson",
    time: "5 hours ago",
    message: "commented on your post",
    icon: MessageCircle,
  },
  {
    id: "3",
    type: "follow",
    user: "Emily Wilson",
    time: "1 day ago",
    message: "started following you",
    icon: UserPlus,
  },
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

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <Bell className="h-8 w-8" />
          Notifications
        </motion.h1>
        <motion.div
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {MOCK_NOTIFICATIONS.map((notification) => {
            const Icon = notification.icon;
            return (
              <motion.div
                key={notification.id}
                variants={item}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{notification.user}</span>{" "}
                    {notification.message}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.time}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
