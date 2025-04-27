-- Categoryテーブルが存在しなければ作成
CREATE TABLE IF NOT EXISTS "Category" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL
);

-- PostCategoryテーブルが存在しなければ作成
CREATE TABLE IF NOT EXISTS "PostCategory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE,
  CONSTRAINT "PostCategory_postId_categoryId_key" UNIQUE ("postId", "categoryId")
);

-- 初期カテゴリーデータの挿入（既に存在する場合は無視）
INSERT INTO "Category" ("name") VALUES
  ('風景'),
  ('ポートレート（人物）'),
  ('夜景・イルミネーション'),
  ('花・植物'),
  ('動物・ペット'),
  ('食べ物・カフェ'),
  ('街並み・建築'),
  ('スポーツ・動きのあるもの'),
  ('マクロ（接写）'),
  ('星空・天体')
ON CONFLICT ("name") DO NOTHING;