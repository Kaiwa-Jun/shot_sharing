const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// カテゴリーの初期データ
const categories = [
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

async function insertCategories() {
  console.log("カテゴリー登録開始...");

  try {
    // Categoryテーブルにカテゴリーを挿入
    const { data, error } = await supabase
      .from("Category")
      .insert(categories)
      .select();

    if (error) {
      console.error("カテゴリー登録エラー:", error);
      return;
    }

    console.log("カテゴリー登録完了:", data.length, "件登録");
  } catch (error) {
    console.error("エラー発生:", error);
  }
}

insertCategories();
