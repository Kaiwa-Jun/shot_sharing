"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Check, RefreshCw } from "lucide-react";

// カテゴリーの初期データ
const initialCategories = [
  { name: "風景" },
  { name: "ポートレート（人物）" },
  { name: "夜景・イルミネーション" },
  { name: "花・植物" },
  { name: "動物・ペット" },
  { name: "食べ物・カフェ" },
  { name: "街並み・建築" },
  { name: "スポーツ・動きのあるもの" },
  { name: "マクロ（接写）" },
  { name: "星空・天体" },
];

interface Category {
  id: string;
  name: string;
}

export default function InitializeCategories() {
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<
    string | null
  >(null);

  // 既存のカテゴリーを取得
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/categories");

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.message || data.error || "カテゴリーの取得に失敗しました"
        );
      }

      const data = await res.json();
      setExistingCategories(data.data || []);
    } catch (err) {
      console.error("カテゴリー取得エラー:", err);
      setError(
        err instanceof Error ? err.message : "カテゴリーの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // カテゴリーを初期化
  const initializeCategories = async () => {
    try {
      setIsInitializing(true);
      setInitializationStatus("カテゴリーを初期化中...");

      for (const category of initialCategories) {
        const existingCategory = existingCategories.find(
          (c) => c.name === category.name
        );

        if (!existingCategory) {
          setInitializationStatus(`「${category.name}」を作成中...`);

          const res = await fetch("/api/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(category),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              `「${category.name}」の作成に失敗: ${
                errorData.error || errorData.message || "不明なエラー"
              }`
            );
          }
        }
      }

      setInitializationStatus("すべてのカテゴリーが初期化されました");
      await fetchCategories(); // カテゴリーリストを更新
    } catch (err) {
      console.error("カテゴリー初期化エラー:", err);
      setInitializationStatus(
        `エラー: ${err instanceof Error ? err.message : "不明なエラー"}`
      );
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>カテゴリー初期設定</CardTitle>
          <CardDescription>
            投稿用のカテゴリーを初期化します。このページは管理者専用です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">現在のカテゴリー</h3>

              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    読み込み中...
                  </span>
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchCategories}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      再試行
                    </Button>
                  </div>
                </div>
              ) : existingCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {existingCategories.map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-amber-600 bg-amber-50 rounded-md">
                  カテゴリーがまだ設定されていません。下のボタンから初期設定を行ってください。
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">初期設定するカテゴリー</h3>
              <div className="flex flex-wrap gap-2">
                {initialCategories.map((category) => {
                  const exists = existingCategories.some(
                    (c) => c.name === category.name
                  );
                  return (
                    <Badge
                      key={category.name}
                      variant={exists ? "outline" : "default"}
                      className={exists ? "bg-green-50" : ""}
                    >
                      {category.name}
                      {exists && (
                        <Check className="ml-1 h-3 w-3 text-green-500" />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {initializationStatus && (
              <div
                className={`p-4 text-sm rounded-md ${
                  initializationStatus.startsWith("エラー")
                    ? "bg-red-50 text-red-500"
                    : initializationStatus.startsWith("すべて")
                    ? "bg-green-50 text-green-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {initializationStatus}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={initializeCategories}
            disabled={isInitializing || isLoading}
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                カテゴリーを初期化
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="ml-2"
            onClick={fetchCategories}
            disabled={isLoading || isInitializing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
