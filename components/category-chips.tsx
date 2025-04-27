"use client";

import { Badge } from "@/components/ui/badge";

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

interface CategoryChipsProps {
  categoryIds: string[];
  onClick?: (categoryId: string) => void;
  variant?: "default" | "secondary" | "outline";
  className?: string;
  limit?: number;
}

export function CategoryChips({
  categoryIds,
  onClick,
  variant = "secondary",
  className = "",
  limit,
}: CategoryChipsProps) {
  if (!categoryIds || categoryIds.length === 0) {
    return null;
  }

  // 選択されたカテゴリーIDからカテゴリー情報を取得
  const categories = categoryIds
    .map((id) => STATIC_CATEGORIES.find((cat) => cat.id === id))
    .filter((cat) => cat !== undefined) as { id: string; name: string }[];

  const displayCategories = limit ? categories.slice(0, limit) : categories;
  const hasMore = limit && categories.length > limit;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayCategories.map((category) => (
        <Badge
          key={category.id}
          variant={variant}
          className={onClick ? "cursor-pointer" : ""}
          onClick={onClick ? () => onClick(category.id) : undefined}
        >
          {category.name}
        </Badge>
      ))}
      {hasMore && (
        <Badge variant="outline">+{categories.length - limit!}</Badge>
      )}
    </div>
  );
}
