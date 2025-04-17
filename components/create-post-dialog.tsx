"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExifData {
  shutterSpeed?: string;
  iso?: number;
  aperture?: number;
  location?: string;
  shootingDate?: string;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [exifData, setExifData] = useState<ExifData>({});

  const handleImageUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // 実際のアプリケーションでは、ここでEXIFデータを読み取ります
    // この例では、モックデータを使用します
    const mockExifData: ExifData = {
      shutterSpeed: "1/1000",
      iso: 100,
      aperture: 1.8,
      location: "東京都渋谷区",
      shootingDate: new Date().toISOString(),
    };
    setExifData(mockExifData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const postData = {
      imageUrl,
      description,
      ...exifData,
      location: showLocation ? exifData.location : undefined,
    };
    
    console.log("Post data:", postData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0" closeButton={false}>
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">新規投稿</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Image Upload */}
          <div className="flex justify-center">
            <div className="relative aspect-[3/2] w-full max-w-[320px] max-h-[240px] bg-muted rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
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
              <p>シャッタースピード、ISO、絞り値は画像から自動的に取得されます</p>
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
                    <div className="text-sm text-muted-foreground">シャッタースピード</div>
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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">投稿</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}