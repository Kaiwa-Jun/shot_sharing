const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
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

  console.log(`カテゴリーの初期データを登録中...`);

  // 既存カテゴリーと重複しないように登録
  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: category,
      });
      console.log(`カテゴリー "${category.name}" を登録しました`);
    } else {
      console.log(`カテゴリー "${category.name}" は既に登録されています`);
    }
  }

  console.log(`カテゴリーの初期データ登録完了`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
