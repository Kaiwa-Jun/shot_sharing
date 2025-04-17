"use client";

import { cn } from "@/lib/utils";
import { Home, Search, Users, Bell, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePostDialog } from "./create-post-dialog";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export function SideNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={cn("w-[200px] px-4 py-6 fixed top-14", className)}>
        <div className="space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-accent rounded-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "ml-3",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>{item.label}</span>
                </span>
              </Link>
            );
          })}
          <Button
            className="w-full bg-black text-white hover:bg-black/90 rounded-full h-12"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Post
          </Button>
        </div>
      </nav>
      <CreatePostDialog open={open} onOpenChange={setOpen} />
    </>
  );
}