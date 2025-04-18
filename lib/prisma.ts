import { PrismaClient } from "@prisma/client";

// グローバルスコープでPrismaClientのインスタンスを保持
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// PrismaClientはサーバーサイドでのみ初期化
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

// development環境では、hot-reloadingでPrismaClientのインスタンスが複数作成されるのを防ぐ
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
