"use client";

import { cn } from "@/lib/utils";
import { Home, Search, Users, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 0 && Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsScrolling(true);
      }

      setLastScrollY(currentScrollY);

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      const timeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      setScrollTimeout(timeout);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout, lastScrollY]);

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
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
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