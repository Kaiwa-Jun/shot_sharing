"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// DBから取得したカテゴリーデータを使用
const STATIC_CATEGORIES = [
  { id: "574604ed-b174-44e3-bbbd-ffa0e63e220b", name: "風景" },
  { id: "afd441c1-1bf6-4f18-bf2d-fb277161d631", name: "ポートレート（人物）" },
  {
    id: "750c55a2-2f4f-48e5-8cf0-11b567742c7b",
    name: "夜景・イルミネーション",
  },
  { id: "c8a2f740-3fd9-4f6f-bf22-37c516daf607", name: "花・植物" },
  { id: "541b09b5-d5b0-4d3f-ab34-104d02c6f439", name: "動物・ペット" },
  { id: "4b3586b9-10ca-4914-9d92-dd9b0253c95d", name: "食べ物・カフェ" },
  { id: "88086ab1-6a79-4f31-b328-0a24fc8ba07c", name: "街並み・建築" },
  {
    id: "4a5281c0-ff9a-41e3-859a-6d727ac80da7",
    name: "スポーツ・動きのあるもの",
  },
  { id: "01eab307-b476-45ed-9fd3-355046ae5fe1", name: "マクロ（接写）" },
  { id: "a84d1618-6d84-49db-8e38-9c61d4134481", name: "星空・天体" },
];

interface CategorySelectProps {
  selectedCategories: string[];
  onChange: (categoryIds: string[]) => void;
}

export function CategorySelect({
  selectedCategories,
  onChange,
}: CategorySelectProps) {
  // カテゴリーの選択/解除を処理
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      // 選択解除
      onChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      // 選択追加
      onChange([...selectedCategories, categoryId]);
    }
  };

  // 選択をクリア
  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">カテゴリー</div>
        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-muted-foreground hover:text-primary flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            クリア
          </button>
        )}
      </div>

      <ScrollArea className="h-[120px] rounded-md border p-2">
        <div className="grid grid-cols-2 gap-2">
          {STATIC_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer flex justify-between items-center ${
                  isSelected ? "bg-primary" : "hover:bg-muted"
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="truncate">{category.name}</span>
                {isSelected && <Check className="h-3 w-3 ml-1 shrink-0" />}
              </Badge>
            );
          })}
        </div>
      </ScrollArea>

      <div className="text-xs text-muted-foreground">
        {selectedCategories.length > 0
          ? `${selectedCategories.length}個のカテゴリーを選択中`
          : "撮影内容に合ったカテゴリーを選択してください"}
      </div>
    </div>
  );
}
