"use client";

import React from "react";
import { AlertProvider } from "@/components/alert-dialog";
import SessionProvider from "@/app/auth/session-provider";
import { PostsProvider } from "@/lib/contexts/posts-context";

export function RootLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AlertProvider>
      <SessionProvider>
        <PostsProvider>{children}</PostsProvider>
      </SessionProvider>
    </AlertProvider>
  );
}
