const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  try {
    // SQLファイルを読み込む
    const sqlFilePath = path.join(__dirname, "create-category-tables.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");

    console.log("SQLファイルを読み込みました。SQLを実行します...");

    // SQLを実行
    const { data, error } = await supabase.rpc("pgexec", { sql });

    if (error) {
      console.error("SQLの実行中にエラーが発生しました:", error);
      return;
    }

    console.log("SQLが正常に実行されました");
    console.log("結果:", data);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

executeSql();
