"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ABOUT_ITEMS = [
  {
    id: "version",
    label: "アプリのバージョン",
    value: "1.19.0",
    isLink: false,
  },
  {
    id: "terms",
    label: "利用規約",
    isLink: true,
  },
  {
    id: "privacy",
    label: "プライバシーポリシー",
    isLink: true,
  },
  {
    id: "license",
    label: "ライセンス",
    isLink: true,
  },
];

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="container max-w-2xl mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-semibold">PhotoShareについて</h1>
        </div>
      </div>

      <div className="space-y-2">
        {ABOUT_ITEMS.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg",
              item.isLink && "hover:bg-accent cursor-pointer"
            )}
          >
            <div className="font-medium">{item.label}</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {item.value && <span>{item.value}</span>}
              {item.isLink && <ChevronRight className="h-5 w-5" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
