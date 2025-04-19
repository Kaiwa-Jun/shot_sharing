"use client";

import { cn, isBrowser } from "@/lib/utils";
import { Home, Search, Users, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout>();
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [visible, setVisible] = useState(true);

  // スクロール処理を安全に行うためのチェック
  const safelyAccessScroll = useCallback(() => {
    return isBrowser() && typeof window !== "undefined" ? window.scrollY : 0;
  }, []);

  const handleScroll = useCallback(() => {
    if (!isBrowser()) return;

    const currentScrollY = safelyAccessScroll();
    setVisible(prevScrollY > currentScrollY || currentScrollY < 10);
    setPrevScrollY(currentScrollY);
  }, [prevScrollY, safelyAccessScroll]);

  useEffect(() => {
    if (!isBrowser()) return;

    // 安全なイベントリスナー設定
    try {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    } catch (e) {
      console.error("Failed to set up scroll listener:", e);
    }
  }, [handleScroll]);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 border-t py-2 transition-colors duration-200",
        isScrolling && lastScrollY > 0
          ? "bg-background/30 backdrop-blur supports-[backdrop-filter]:bg-background/30"
          : "bg-background",
        className
      )}
    >
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-2"
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
