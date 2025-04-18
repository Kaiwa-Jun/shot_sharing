"use client";

import { useState, useEffect } from "react";
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
import exifr from "exifr";
import EXIF from "exif-js";
import heic2any from "heic2any";

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

// HEIC/HEIF画像を検出する関数
const isHeicImage = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return (
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif") ||
    fileType.includes("heic") ||
    fileType.includes("heif") ||
    fileType === "image/heic" ||
    fileType === "image/heif"
  );
};

// HEIC画像をJPEGに変換する関数
const convertHeicToJpeg = async (
  file: File
): Promise<{ jpegFile: File; jpegUrl: string }> => {
  try {
    console.log("HEIC変換開始:", file.name, file.type, file.size);

    const convertedBlob = (await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8,
    })) as Blob;

    console.log("HEIC変換結果:", convertedBlob);

    // BlobからFileを作成
    const fileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    const jpegFile = new File([convertedBlob], fileName, {
      type: "image/jpeg",
    });

    // プレビュー用URLを作成
    const jpegUrl = URL.createObjectURL(convertedBlob);

    console.log("HEIC変換完了:", { fileName, jpegUrl, size: jpegFile.size });
    return { jpegFile, jpegUrl };
  } catch (error) {
    console.error("HEIC変換エラー:", error);
    throw error;
  }
};

export function CreatePostDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostDialogProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [exifData, setExifData] = useState<ExifData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { authUser, dbUser } = useSession();

  // 画像アップロード処理
  const handleImageUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setIsConverting(false);
      setImageFile(file);

      // 一時的なプレビューURLを設定
      const tempUrl = URL.createObjectURL(file);
      setImageUrl(tempUrl);

      // HEIC/HEIF画像かどうかを確認
      if (isHeicImage(file)) {
        try {
          console.log("HEIC画像を検出しました:", file.name);
          setIsConverting(true);

          // HEIC変換処理（非同期）
          const { jpegFile, jpegUrl } = await convertHeicToJpeg(file);

          // 元のURLを解放してメモリリークを防止
          URL.revokeObjectURL(tempUrl);

          // 新しいJPEG画像に更新
          setImageFile(jpegFile);
          setImageUrl(jpegUrl);
          setIsConverting(false);

          // 変換後のファイルでEXIF抽出
          await extractExifData(jpegFile);
        } catch (convErr) {
          console.error("HEIC変換失敗:", convErr);
          setIsConverting(false);
          // 変換に失敗した場合でも元の画像のEXIFを試みる
          await extractExifData(file);
        }
      } else {
        // 通常の画像の場合は直接EXIF抽出
        await extractExifData(file);
      }
    } catch (error) {
      console.error("画像処理エラー:", error);
      setExifData({});
    } finally {
      setIsLoading(false);
    }
  };

  // EXIF抽出処理を別関数に分離
  const extractExifData = async (file: File) => {
    try {
      // 両方のライブラリでEXIFデータ取得を試みる
      let extractedExifData: ExifData = {};

      // 1. まずexif-jsライブラリを使ってみる
      const exifPromise = new Promise<any>((resolve) => {
        EXIF.getData(file as any, function (this: any) {
          const allTags = EXIF.getAllTags(this);
          console.log("EXIF-JS取得データ:", allTags);

          // GPSデータを取得
          const lat = EXIF.getTag(this, "GPSLatitude");
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lng = EXIF.getTag(this, "GPSLongitude");
          const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

          console.log("EXIF-JS GPS情報:", { lat, latRef, lng, lngRef });

          // GPS座標を度数に変換
          let latitude: number | undefined;
          let longitude: number | undefined;

          if (lat && latRef && lng && lngRef) {
            // 緯度を計算 (度分秒から10進数に変換)
            latitude = lat[0] + lat[1] / 60 + lat[2] / 3600;
            if (latRef === "S" && latitude !== undefined) latitude = -latitude;

            // 経度を計算 (度分秒から10進数に変換)
            longitude = lng[0] + lng[1] / 60 + lng[2] / 3600;
            if (lngRef === "W" && longitude !== undefined)
              longitude = -longitude;

            console.log("EXIF-JS 変換後座標:", { latitude, longitude });
          }

          // その他の基本的なEXIFデータ
          const shutterSpeed = EXIF.getTag(this, "ExposureTime");
          const iso = EXIF.getTag(this, "ISOSpeedRatings");
          const aperture = EXIF.getTag(this, "FNumber");
          const date =
            EXIF.getTag(this, "DateTimeOriginal") ||
            EXIF.getTag(this, "DateTime");

          resolve({
            shutterSpeed: shutterSpeed
              ? `1/${Math.round(1 / shutterSpeed)}`
              : undefined,
            iso,
            aperture: aperture ? aperture : undefined,
            latitude,
            longitude,
            shootingDate: date || new Date().toISOString(),
          });
        });
      });

      // 2. 次にexifrを使う
      const exifrPromise = (async () => {
        try {
          const fullExif = await exifr.parse(file, {
            gps: true,
            translateKeys: true,
            translateValues: true,
            tiff: true,
            ifd0: true,
            exif: true,
            xmp: true,
          } as any);

          console.log("exifr取得データ:", fullExif);

          return {
            shutterSpeed: fullExif?.ExposureTime
              ? `1/${Math.round(1 / fullExif.ExposureTime)}`
              : undefined,
            iso: fullExif?.ISO,
            aperture: fullExif?.FNumber,
            location:
              fullExif?.GPSAddress ||
              fullExif?.city ||
              fullExif?.country ||
              undefined,
            latitude: fullExif?.latitude,
            longitude: fullExif?.longitude,
            shootingDate:
              fullExif?.DateTimeOriginal ||
              fullExif?.CreateDate ||
              new Date().toISOString(),
          };
        } catch (e) {
          console.error("exifr解析エラー:", e);
          return {};
        }
      })();

      // 両方のライブラリの結果を待ち、マージする
      const [exifJsResult, exifrResult] = await Promise.all([
        exifPromise,
        exifrPromise,
      ]);
      console.log("EXIF-JS結果:", exifJsResult);
      console.log("exifr結果:", exifrResult);

      // 結果をマージ (exif-jsの結果を優先)
      extractedExifData = {
        shutterSpeed: exifJsResult.shutterSpeed || exifrResult.shutterSpeed,
        iso: exifJsResult.iso || exifrResult.iso,
        aperture: exifJsResult.aperture || exifrResult.aperture,
        location: exifrResult.location,
        latitude: exifJsResult.latitude || exifrResult.latitude,
        longitude: exifJsResult.longitude || exifrResult.longitude,
        shootingDate: exifJsResult.shootingDate || exifrResult.shootingDate,
      };

      console.log("最終EXIFデータ:", extractedExifData);

      // デバッグ用：各プロパティの型と値を詳細に出力
      console.log("EXIFデータの型と値:");
      for (const [key, value] of Object.entries(extractedExifData)) {
        console.log(
          `${key}: 型=${typeof value}, 値=${value}, 空チェック=${
            value ? "あり" : "なし"
          }`
        );
      }

      setExifData(extractedExifData);
    } catch (error) {
      console.error("EXIF抽出エラー:", error);
      setExifData({});
    }
  };

  // 投稿送信処理
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

      if (!imageFile || !imageUrl) {
        setError("画像が選択されていません");
        setIsLoading(false);
        return;
      }

      // 画像データをBase64に変換
      let base64Image = "";
      try {
        if (imageUrl.startsWith("data:")) {
          // すでにBase64形式の場合はそのまま使用
          base64Image = imageUrl;
        } else {
          // Blob URLからBlobを取得してBase64に変換
          const response = await fetch(imageUrl);
          const blob = await response.blob();

          // FileReaderを使ってBase64に変換
          const reader = new FileReader();
          base64Image = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.error("画像変換エラー:", error);
        setError("画像の変換に失敗しました");
        setIsLoading(false);
        return;
      }

      const postData = {
        imageUrl: base64Image,
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

      console.log("投稿データ:", {
        ...postData,
        imageUrl: postData.imageUrl
          ? `${postData.imageUrl.substring(0, 30)}...`
          : null,
      });

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
      setImageFile(null);
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
                    onError={(e) => {
                      console.error("画像ロードエラー:", e);
                      // エラー時のフォールバック処理
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNGgtMjR2LTI0aDI0djI0em0tMjItMjJ2MjBoMjB2LTIwaC0yMHptMiAxOHYtMTZoMTZ2MTZoLTE2em0xMy01aC0xMHYtM2g0di0yaDJ2MmgydjN6bS05LThoM3YyaC0zdi0yem0xLTFoLTR2LTJoNHYyeiIvPjwvc3ZnPg==";
                      e.currentTarget.alt = "画像ロードエラー";
                    }}
                  />
                  {isConverting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>HEIC変換中...</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                    onClick={() => {
                      setImageUrl("");
                      setImageFile(null);
                    }}
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
                accept="image/*,.heic,.heif"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                disabled={isLoading || isConverting}
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
                    <div className="font-medium">{String(exifData.iso)}</div>
                  </div>
                )}
                {exifData.aperture && (
                  <div>
                    <div className="text-sm text-muted-foreground">絞り</div>
                    <div className="font-medium">
                      f/{String(exifData.aperture)}
                    </div>
                  </div>
                )}
              </div>

              {/* 位置情報の表示 - showLocationがtrueの場合のみ表示 */}
              {showLocation && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm font-medium mb-2">位置情報</div>
                  <div className="grid grid-cols-2 gap-4">
                    {exifData.location && (
                      <div>
                        <div className="text-sm text-muted-foreground">
                          場所
                        </div>
                        <div className="font-medium">
                          {String(exifData.location)}
                        </div>
                      </div>
                    )}
                    {exifData.latitude && exifData.longitude && (
                      <div>
                        <div className="text-sm text-muted-foreground">
                          経緯緯度
                        </div>
                        <div className="font-medium text-xs">
                          {String(
                            typeof exifData.latitude === "number"
                              ? exifData.latitude.toFixed(6)
                              : exifData.latitude
                          )}
                          ,
                          {String(
                            typeof exifData.longitude === "number"
                              ? exifData.longitude.toFixed(6)
                              : exifData.longitude
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              disabled={isLoading || isConverting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!imageUrl || isLoading || isConverting}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  投稿中...
                </>
              ) : isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  変換中...
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
