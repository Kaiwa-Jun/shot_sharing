"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaGoogle } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [origin, setOrigin] = useState("");
  const router = useRouter();

  // URLオリジンをクライアントサイドでのみ取得
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // PKCEフローに必要な完全なリダイレクトURLを指定
      const redirectTo = `${origin}/auth/callback`;
      console.log("Google認証リダイレクト先:", redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google認証エラー:", error);
      toast.error("Google認証に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // パスワードと確認用パスワードが一致するかチェック
    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }

    // パスワードの長さを検証
    if (password.length < 6) {
      toast.error("パスワードは6文字以上で入力してください");
      return;
    }

    try {
      setLoading(true);
      console.log("サインアップ開始:", email);

      // PKCEフローに必要な完全なリダイレクトURLを指定
      const redirectTo = `${origin}/auth/callback`;
      console.log("メール認証リダイレクト先:", redirectTo);

      // メール確認なしでサインアップを試す (開発環境・テスト用)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            // 基本的なユーザーメタデータを追加
            name: email.split("@")[0], // メールアドレスからユーザー名を仮生成
            avatar_url: "",
          },
        },
      });

      console.log("サインアップレスポンス:", data);

      if (error) {
        throw error;
      }

      // identities配列の長さが0の場合、ユーザーはすでに存在しています
      if (data?.user && data.user.identities?.length === 0) {
        toast.error("このメールアドレスはすでに登録されています");
        return;
      }

      // メール確認が必要かどうかチェック
      if (data?.user?.confirmed_at) {
        // メール確認が不要な場合（開発環境など）
        toast.success("登録が完了しました！");
        router.refresh();
      } else {
        // メール確認が必要な場合
        setSignupSuccess(true);
        toast.success("確認メールを送信しました。メールをご確認ください。");
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("新規登録エラー:", error);

      // エラーメッセージをより具体的に表示
      if (error.message?.includes("already registered")) {
        toast.error("このメールアドレスはすでに登録されています");
      } else {
        toast.error(
          `新規登録に失敗しました: ${error.message || "不明なエラー"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log("ログイン成功:", data);
      toast.success("ログインしました");
      router.refresh();
      onOpenChange(false);
    } catch (error: any) {
      console.error("ログインエラー:", error);

      // エラーメッセージをより具体的に表示
      if (error.message?.includes("Invalid login")) {
        toast.error("メールアドレスまたはパスワードが正しくありません");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error(
          "メールアドレスが確認されていません。確認メールをご確認ください"
        );
      } else {
        toast.error(
          `ログインに失敗しました: ${error.message || "不明なエラー"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // パスワード表示切り替え用の関数
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 確認用パスワード表示切り替え用の関数
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // サインアップ成功時に表示するメッセージ
  if (signupSuccess) {
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => {
          setSignupSuccess(false);
          onOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              メールを確認してください
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center mb-4">
              {email} に確認メールを送信しました。
              <br />
              メール内のリンクをクリックして登録を完了してください。
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              ※メールが届かない場合は、迷惑メールフォルダをご確認ください。
              <br />
              また、メールアドレスの入力に誤りがないかご確認ください。
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setSignupSuccess(false);
                onOpenChange(false);
              }}
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            アカウント
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 mb-6"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <FaGoogle className="h-4 w-4" />
            <span>Googleでログイン</span>
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">ログイン</TabsTrigger>
              <TabsTrigger value="signup">新規登録</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">メールアドレス</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">パスワード</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "処理中..." : "ログイン"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">メールアドレス</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">パスワード</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    6文字以上で入力してください
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    パスワード（確認用）
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "処理中..." : "登録する"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
