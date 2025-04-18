"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Info, Loader2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/app/auth/session-provider";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: any) => void;
}

interface ExifData {
  shutterSpeed?: string;
  iso?: number;
  aperture?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  shootingDate?: string;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostDialogProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [exifData, setExifData] = useState<ExifData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { authUser, dbUser } = useSession();

  const handleImageUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // 実際のアプリケーションでは、ここでEXIFデータを読み取ります
    // この例では、モックデータを使用します
    const mockExifData: ExifData = {
      shutterSpeed: "1/1000",
      iso: 100,
      aperture: 1.8,
      location: "東京都渋谷区", // UIでの表示用
      latitude: 35.658, // 実際にDBに保存する値
      longitude: 139.7016, // 実際にDBに保存する値
      shootingDate: new Date().toISOString(),
    };
    setExifData(mockExifData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 認証情報を確認
      console.log("認証情報:", {
        authUserExists: !!authUser,
        authUserId: authUser?.id,
        dbUserExists: !!dbUser,
        dbUserId: dbUser?.id,
      });

      // ユーザーIDチェック
      if (!authUser?.id && !dbUser?.id) {
        console.error("ユーザーIDが利用できません。ログインしてください。");
        setError("認証されていません。ログインしてください。");
        setIsLoading(false);
        return;
      }

      const postData = {
        imageUrl,
        description,
        shutterSpeed: exifData.shutterSpeed,
        iso: exifData.iso,
        aperture: exifData.aperture,
        latitude: showLocation ? exifData.latitude : undefined,
        longitude: showLocation ? exifData.longitude : undefined,
        shootingDate: exifData.shootingDate,
        userId: dbUser?.id || authUser?.id,
        userEmail: authUser?.email,
      };

      console.log("投稿データ:", postData);

      // セッションの状態を確認
      console.log("セッション状態の確認中...");

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
        credentials: "include", // クッキーを含める
      });

      console.log("APIレスポンスステータス:", response.status);
      const result = await response.json();
      console.log("APIレスポンス:", result);

      if (!response.ok) {
        throw new Error(result.error || "投稿に失敗しました");
      }

      // 成功メッセージを表示
      toast({
        title: "投稿成功",
        description: "投稿が正常に作成されました",
      });

      // フォームをリセット
      setImageUrl("");
      setDescription("");
      setExifData({});

      // ダイアログを閉じる
      onOpenChange(false);

      // 成功コールバックがあれば呼び出す
      if (onSuccess && result.data) {
        console.log("投稿成功時のレスポンスデータ:", result.data);
        // 確実に投稿データを渡す
        onSuccess(result.data);
      }

      // 2秒後にページをリロード（UIの更新を待つ）
      setTimeout(() => {
        console.log("ページを更新します...");
        window.location.reload();
      }, 100);
    } catch (err) {
      console.error("Error submitting post:", err);
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">新規投稿</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Image Upload */}
          <div className="flex justify-center">
            <div className="relative aspect-[3/2] w-full max-w-[320px] max-h-[240px] bg-muted rounded-lg overflow-hidden">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                    onClick={() => setImageUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    クリックして画像をアップロード
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <textarea
              placeholder="説明を入力..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] p-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Location Toggle */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <p>
                シャッタースピード、ISO、絞り値は画像から自動的に取得されます
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-location">撮影場所を表示</Label>
              <Switch
                id="show-location"
                checked={showLocation}
                onCheckedChange={setShowLocation}
              />
            </div>
          </div>

          {/* EXIF Data Display */}
          {Object.keys(exifData).length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                {exifData.shutterSpeed && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      シャッタースピード
                    </div>
                    <div className="font-medium">{exifData.shutterSpeed}</div>
                  </div>
                )}
                {exifData.iso && (
                  <div>
                    <div className="text-sm text-muted-foreground">ISO</div>
                    <div className="font-medium">{exifData.iso}</div>
                  </div>
                )}
                {exifData.aperture && (
                  <div>
                    <div className="text-sm text-muted-foreground">絞り</div>
                    <div className="font-medium">f/{exifData.aperture}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={!imageUrl || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  投稿中...
                </>
              ) : (
                "投稿"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
