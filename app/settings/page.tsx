"use client";

import {
  ArrowLeft,
  MapPin,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/app/auth/session-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SETTINGS_ITEMS = [
  {
    id: "location",
    icon: MapPin,
    label: "位置情報",
    description: "位置情報の利用設定",
    href: "/settings/location",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "通知",
    description: "通知の設定",
    href: "/settings/notifications",
  },
  {
    id: "help",
    icon: HelpCircle,
    label: "お問い合わせ",
    description: "ヘルプ・お問い合わせ",
    href: "/settings/help",
  },
  {
    id: "about",
    icon: Info,
    label: "PhotoShareについて",
    description: "アプリケーション情報",
    href: "/settings/about",
  },
];

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { authUser, dbUser, signOut } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("ログアウトしました");
      router.push("/");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      toast.error("ログアウトに失敗しました");
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={dbUser?.avatarUrl || authUser?.user_metadata?.avatar_url}
            />
            <AvatarFallback>
              {(dbUser?.name?.[0] || authUser?.email?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-semibold">設定</h1>
        </div>
      </div>

      <div className="space-y-6">
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="block w-full">
              <div className="flex items-center justify-between p-4 hover:bg-accent rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          );
        })}

        <div className="pt-6 border-t">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 p-4 text-destructive hover:bg-accent rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">ログアウト</span>
          </button>
        </div>
      </div>
    </div>
  );
}
