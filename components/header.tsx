"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./auth-dialog";
import { useSession } from "@/app/auth/session-provider";
import { useRouter } from "next/navigation";

export function Header() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { authUser, dbUser, isLoading } = useSession();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Camera className="h-6 w-6" />
            <span className="font-bold">PhotoShare</span>
          </Link>
        </div>
        <div className="flex-1" />
        <div className="px-4 flex items-center gap-4">
          {!isLoading && (
            <>
              {authUser ? (
                <Link href="/profile">
                  <Avatar>
                    <AvatarImage
                      src={
                        dbUser?.avatarUrl || authUser.user_metadata?.avatar_url
                      }
                    />
                    <AvatarFallback>
                      {(
                        dbUser?.name?.[0] ||
                        authUser.email?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Button
                  onClick={() => setAuthDialogOpen(true)}
                  variant="outline"
                >
                  ログイン / 新規登録
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </header>
  );
}
