import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { SideNav } from "@/components/side-nav";
import { BottomNav } from "@/components/bottom-nav";
import { CreatePostButton } from "@/components/create-post-button";
import SessionProvider from "@/app/auth/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { PostsProvider } from "@/lib/contexts/posts-context";
import { AlertProvider } from "@/components/alert-dialog";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PhotoShare - Share Your Photography",
  description: "A beautiful platform for photographers to share their work",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          inter.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          <AlertProvider>
            <SessionProvider>
              <PostsProvider>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <SideNav className="hidden lg:block" />
                    <main className="flex-1 container mx-auto px-4 py-6">
                      {children}
                    </main>
                  </div>
                  <BottomNav className="lg:hidden fixed bottom-0 left-0 right-0" />
                  <CreatePostButton />
                </div>
              </PostsProvider>
            </SessionProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
